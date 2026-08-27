import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import VendorRequest from "../../../models/VendorRequest";
import Vendor from "../../../models/Vendor";
import User from "../../../models/User";
import Shop from "../../../models/Shop";
import { requireAuth } from "../../../lib/routeAuth";

function getSafeShopImage(value) {
  return typeof value === "string" && /^https?:\/\//i.test(value)
    ? value
    : null;
}

function requestResponse(vendorRequest) {
  return {
    ...vendorRequest.toObject(),
    shopImage: getSafeShopImage(vendorRequest.shopImage),
  };
}

async function getClaimFailure(id, session) {
  const existingRequest = await VendorRequest.findById(id)
    .select("_id")
    .session(session);

  return existingRequest ? "ALREADY_PROCESSED" : "NOT_FOUND";
}

export async function PATCH(req, context) {
  try {
    const auth = requireAuth(req, ["admin"]);
    if (!auth.ok) return auth.response;

    await connectDB();
    const { id } = await context.params;
    const { action } = await req.json();

    if (action === "approve") {
      const session = await mongoose.startSession();
      let result;
      let claimFailure;

      try {
        await session.withTransaction(async () => {
          const reviewedAt = new Date();
          const vr = await VendorRequest.findOneAndUpdate(
            { _id: id, status: "pending" },
            {
              $set: {
                status: "approved",
                decidedBy: auth.user.userId,
                reviewedAt,
              },
            },
            { new: true, session }
          );

          if (!vr) {
            claimFailure = await getClaimFailure(id, session);
            return;
          }

          const requestUser = vr.userId
            ? await User.findById(vr.userId).session(session)
            : null;
          const vendorName = vr.businessName || "Unnamed Vendor";
          const serviceType = vr.vendorType || "shopping";
          const contactPerson =
            vr.vendorName || requestUser?.name || vr.businessName || "Owner";
          const phone = vr.phone || "N/A";
          const address = vr.address || "N/A";
          const email =
            requestUser?.email ||
            `${vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "")}-${vr._id}@example.com`;

          const vendorFilter = vr.userId ? { userId: vr.userId } : { email };
          const newVendor = await Vendor.findOneAndUpdate(
            vendorFilter,
            {
              $set: {
                vendorName,
                serviceType,
                contactPerson,
                phone,
                email,
                address,
                isActive: true,
              },
              ...(vr.userId ? { $setOnInsert: { userId: vr.userId } } : {}),
            },
            {
              new: true,
              upsert: true,
              setDefaultsOnInsert: true,
              session,
            }
          );

          if (requestUser && requestUser.role !== "vendor") {
            await User.updateOne(
              { _id: requestUser._id },
              { $set: { role: "vendor" } },
              { session }
            );
          }

          const shopPayload = {
            vendorId: newVendor._id,
            name: vendorName,
            category: serviceType,
            phone,
            address,
            description: vr.description || "",
            image: getSafeShopImage(vr.shopImage),
            kbzPayNumber: vr.kbzPayNumber || "",
            wavePayNumber: vr.wavePayNumber || "",
          };
          const shop = await Shop.findOneAndUpdate(
            { vendorId: newVendor._id },
            { $set: shopPayload },
            { new: true, upsert: true, setDefaultsOnInsert: true, session }
          );

          result = { vendor: newVendor, shop, request: vr };
        });
      } finally {
        await session.endSession();
      }

      if (claimFailure === "NOT_FOUND") {
        return NextResponse.json(
          { success: false, message: "Not found" },
          { status: 404 }
        );
      }

      if (claimFailure === "ALREADY_PROCESSED") {
        return NextResponse.json(
          { success: false, message: "Already processed" },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Approved",
          vendor: result.vendor,
          shop: result.shop,
          request: requestResponse(result.request),
        },
        { status: 200 }
      );
    }

    if (action === "reject") {
      const vr = await VendorRequest.findOneAndUpdate(
        { _id: id, status: "pending" },
        {
          $set: {
            status: "rejected",
            decidedBy: auth.user.userId,
            reviewedAt: new Date(),
          },
        },
        { new: true }
      );

      if (!vr) {
        const exists = await VendorRequest.exists({ _id: id });
        return NextResponse.json(
          {
            success: false,
            message: exists ? "Already processed" : "Not found",
          },
          { status: exists ? 409 : 404 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Rejected",
          request: requestResponse(vr),
        },
        { status: 200 }
      );
    }

    return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("vendor-requests PATCH error:", error);
    return NextResponse.json({ success: false, message: "Server error" }, { status: 500 });
  }
}
