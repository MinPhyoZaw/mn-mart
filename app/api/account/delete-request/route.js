import mongoose from "mongoose";
import { NextResponse } from "next/server";

import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import AccountDeletionRequest from "../../../models/AccountDeletionRequest";
import User from "../../../models/User";

const NO_STORE_HEADERS = { "Cache-Control": "private, no-store" };

export async function POST(req) {
  const auth = requireAuth(req);
  if (!auth.ok) return auth.response;

  if (!mongoose.Types.ObjectId.isValid(auth.user.userId)) {
    return NextResponse.json(
      { success: false, message: "Invalid authenticated account." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  try {
    await connectDB();

    // Read the current role from the database; JWT or browser-supplied role data
    // must not decide whether this account can enter the consumer workflow.
    const user = await User.findById(auth.user.userId).select("_id role").lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Authenticated account was not found." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    if (user.role === "admin") {
      return NextResponse.json(
        {
          success: false,
          message: "Administrator accounts require a separate administrative review.",
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    if (!["customer", "vendor"].includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "This account is not eligible for this workflow." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const deletionRequest = await AccountDeletionRequest.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          role: user.role,
          status: "pending",
          requestedAt: new Date(),
        },
      },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
    ).lean();

    return NextResponse.json(
      {
        success: true,
        status: deletionRequest.status,
        message:
          deletionRequest.status === "pending"
            ? "Your account deletion request has been received."
            : "Your account deletion request already exists.",
      },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  } catch (error) {
    // A concurrent first request can lose the unique-index race. Reading the
    // existing record preserves idempotency without exposing account details.
    if (error?.code === 11000) {
      const existing = await AccountDeletionRequest.findOne({
        userId: auth.user.userId,
      })
        .select("status")
        .lean();

      if (existing) {
        return NextResponse.json(
          {
            success: true,
            status: existing.status,
            message: "Your account deletion request already exists.",
          },
          { status: 200, headers: NO_STORE_HEADERS }
        );
      }
    }

    console.error("POST /api/account/delete-request failed");
    return NextResponse.json(
      { success: false, message: "Unable to submit the request right now." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
