import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../lib/mongodb";
import { verifyToken } from "../../lib/jwt";

import Review from "../../models/Review";
import Order from "../../models/Order";
import Item from "../../models/Item";

// TEMPORARY:
// true  = any logged-in user can review
// false = only confirmed purchasers can review
const ALLOW_ALL_REVIEWS_FOR_TESTING = true;

function getLoggedInUser(req) {
  const token = req.cookies.get("token")?.value;

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

/*
|--------------------------------------------------------------------------
| GET REVIEWS
|--------------------------------------------------------------------------
|
| Example:
| /api/reviews?productId=68xxxx
|
*/

export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Get reviews
    |--------------------------------------------------------------------------
    */

    const reviews = await Review.find({
      productId,
    })
      .populate("userId", "name profileImage")
      .sort({ createdAt: -1 })
      .lean();

    const totalReviews = reviews.length;

    /*
    |--------------------------------------------------------------------------
    | Check logged-in customer
    |--------------------------------------------------------------------------
    */

    const decoded = getLoggedInUser(req);

    let canReview = false;
    let hasPurchased = false;
    let currentUserReview = null;

    if (decoded?.userId) {
      /*
      |--------------------------------------------------------------------------
      | Check if current user already reviewed
      |--------------------------------------------------------------------------
      */

      currentUserReview = await Review.findOne({
        productId,
        userId: decoded.userId,
      })
        .populate("userId", "name profileImage")
        .lean();

      /*
      |--------------------------------------------------------------------------
      | TEST MODE
      |--------------------------------------------------------------------------
      |
      | During UI testing:
      | Any logged-in user can review.
      |
      */

      if (ALLOW_ALL_REVIEWS_FOR_TESTING) {
        hasPurchased = true;
        canReview = !currentUserReview;
      } else {
        /*
        |--------------------------------------------------------------------------
        | Production purchase verification
        |--------------------------------------------------------------------------
        */

        const purchasedOrder = await Order.findOne({
          customerId: decoded.userId,
          serviceType: "shopping",
          orderStatus: "confirmed",
          "items.itemId": productId,
        }).lean();

        hasPurchased = Boolean(purchasedOrder);

        canReview =
          Boolean(purchasedOrder) &&
          !currentUserReview;
      }
    }

    return NextResponse.json({
      success: true,

      summary: {
        totalReviews,
      },

      reviews,

      eligibility: {
        loggedIn: Boolean(decoded?.userId),
        hasPurchased,
        canReview,
        hasReviewed: Boolean(currentUserReview),
      },

      currentUserReview,
    });
  } catch (error) {
    console.error("GET REVIEWS ERROR:", error);

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
| POST REVIEW
|--------------------------------------------------------------------------
*/

export async function POST(req) {
  try {
    await connectDB();

    /*
    |--------------------------------------------------------------------------
    | Authentication
    |--------------------------------------------------------------------------
    */

    const decoded = getLoggedInUser(req);

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          success: false,
          message: "Please login to write a review.",
        },
        { status: 401 }
      );
    }

    const userId = decoded.userId;

    /*
    |--------------------------------------------------------------------------
    | Request body
    |--------------------------------------------------------------------------
    */

    const body = await req.json();

    const {
      productId,
      comment,
    } = body;

    /*
    |--------------------------------------------------------------------------
    | Validate product ID
    |--------------------------------------------------------------------------
    */

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          message: "Product ID is required.",
        },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid product ID.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Validate comment
    |--------------------------------------------------------------------------
    */

    if (!comment?.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: "Please write your review.",
        },
        { status: 400 }
      );
    }

    if (comment.trim().length > 1000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Review cannot be longer than 1000 characters.",
        },
        { status: 400 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Check product exists
    |--------------------------------------------------------------------------
    */

    const product = await Item.findById(productId);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: "Product not found.",
        },
        { status: 404 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Prevent duplicate review
    |--------------------------------------------------------------------------
    */

    const existingReview = await Review.findOne({
      productId,
      userId,
    });

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You have already reviewed this product.",
        },
        { status: 409 }
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Purchase verification
    |--------------------------------------------------------------------------
    */

    let purchasedOrder = null;

    if (!ALLOW_ALL_REVIEWS_FOR_TESTING) {
      purchasedOrder = await Order.findOne({
        customerId: userId,
        serviceType: "shopping",
        orderStatus: "confirmed",
        "items.itemId": productId,
      });

      if (!purchasedOrder) {
        return NextResponse.json(
          {
            success: false,
            message:
              "You can only review products you have purchased.",
          },
          { status: 403 }
        );
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Save review
    |--------------------------------------------------------------------------
    */

    const review = await Review.create({
      productId,
      userId,

      // During testing this can be null
      orderId: purchasedOrder?._id || null,

      comment: comment.trim(),
    });

    /*
    |--------------------------------------------------------------------------
    | Add user name/profile image to response
    |--------------------------------------------------------------------------
    */

    await review.populate(
      "userId",
      "name profileImage"
    );

    return NextResponse.json(
      {
        success: true,
        message: "Review submitted successfully.",
        review,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);

    /*
    |--------------------------------------------------------------------------
    | Duplicate index protection
    |--------------------------------------------------------------------------
    */

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You have already reviewed this product.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Server error.",
      },
      { status: 500 }
    );
  }
}