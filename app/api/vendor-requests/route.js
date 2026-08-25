import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import VendorRequest from "../../models/VendorRequest";
import { requireAuth } from "../../lib/routeAuth";

function serializeRequest(r) {
  return {
    _id: r._id ? String(r._id) : null,
    userId: r.userId ? String(r.userId) : null,
    decidedBy: r.decidedBy ? String(r.decidedBy) : null,

    businessName: r.businessName || "",
    vendorName: r.vendorName || "",
    vendorType: r.vendorType || "",
    phone: r.phone || "",
    description: r.description || "",
    shopImage: r.shopImage || null,
    status: r.status || "pending",

    createdAt: r.createdAt
      ? r.createdAt.toISOString()
      : null,

    updatedAt: r.updatedAt
      ? r.updatedAt.toISOString()
      : null,

    reviewedAt: r.reviewedAt
      ? new Date(r.reviewedAt).toISOString()
      : null,
  };
}

export async function GET(req) {
  try {
    const auth = requireAuth(req, ["admin"]);

    if (!auth.ok) {
      return auth.response;
    }

    await connectDB();

    const { searchParams } = new URL(req.url);

    const page = Math.max(
      1,
      Number.parseInt(
        searchParams.get("page") || "1",
        10
      )
    );

    const requestedLimit =
      Number.parseInt(
        searchParams.get("limit") || "20",
        10
      );

    const limit = Math.min(
      Math.max(requestedLimit, 1),
      50
    );

    const status =
      searchParams.get("status");

    const filter = {};

    if (
      ["pending", "approved", "rejected"].includes(
        status
      )
    ) {
      filter.status = status;
    }

    const skip =
      (page - 1) * limit;

    const [rows, total] =
      await Promise.all([
        VendorRequest.find(filter)
          .select(
            [
              "_id",
              "userId",
              "decidedBy",
              "businessName",
              "vendorName",
              "vendorType",
              "phone",
              "description",
              "shopImage",
              "status",
              "createdAt",
              "updatedAt",
              "reviewedAt",
            ].join(" ")
          )
          .sort({
            createdAt: -1,
          })
          .skip(skip)
          .limit(limit)
          .lean(),

        VendorRequest.countDocuments(
          filter
        ),
      ]);

    return NextResponse.json({
      success: true,

      data:
        rows.map(
          serializeRequest
        ),

      pagination: {
        page,
        limit,
        total,

        totalPages:
          Math.max(
            1,
            Math.ceil(
              total / limit
            )
          ),

        hasNextPage:
          skip +
            rows.length <
          total,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/vendor-requests error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Failed to load vendor requests",
      },
      {
        status: 500,
      }
    );
  }
}