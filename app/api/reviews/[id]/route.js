import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../lib/mongodb";
import { verifyToken } from "../../../lib/jwt";
import Review from "../../../models/Review";

function getLoggedInUser(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| PATCH - Edit Review
|--------------------------------------------------------------------------
*/

export async function PATCH(req, { params }) {
  try {
    await connectDB();

    const decoded = getLoggedInUser(req);

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login.",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid review ID.",
        },
        { status: 400 }
      );
    }

    const {
      rating,
      comment,
    } = await req.json();

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Rating must be between 1 and 5.",
        },
        { status: 400 }
      );
    }

    if (!comment?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Review comment is required.",
        },
        { status: 400 }
      );
    }

    const review = await Review.findOne({
      _id: id,
      userId: decoded.userId,
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Review not found or you cannot edit it.",
        },
        { status: 404 }
      );
    }

    review.rating = numericRating;
    review.comment = comment.trim();

    await review.save();

    await review.populate(
      "userId",
      "name profileImage"
    );

    return NextResponse.json({
      success: true,
      message: "Review updated successfully.",
      review,
    });
  } catch (error) {
    console.error("UPDATE REVIEW ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error.",
      },
      { status: 500 }
    );
  }
}

/*
|--------------------------------------------------------------------------
| DELETE - Delete Review
|--------------------------------------------------------------------------
*/

export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const decoded = getLoggedInUser(req);

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login.",
        },
        { status: 401 }
      );
    }

    const { id } = await params;

    const review = await Review.findOneAndDelete({
      _id: id,
      userId: decoded.userId,
    });

    if (!review) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Review not found or you cannot delete it.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error.",
      },
      { status: 500 }
    );
  }
}