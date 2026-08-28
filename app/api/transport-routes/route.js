import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../lib/mongodb";
import TransportationRoute from "../../models/TransportationRoute";
import Vendor from "../../models/Vendor";
import { requireVendorAuth } from "../../lib/routeAuth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const parseList = (value) =>
  String(value || "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);

export async function POST(req) {
  try {
    const auth = await requireVendorAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    const body = await req.json();

    const required = [
      "companyName",
      "fromCity",
      "toCity",
      "duration",
    ];

    const missing = required.filter(
      (key) => !String(body?.[key] || "").trim()
    );

    if (missing.length) {
      return NextResponse.json(
        {
          success: false,
          message: `Missing required field(s): ${missing.join(", ")}`,
        },
        { status: 400 }
      );
    }

    await connectDB();

    let companyId = body.companyId;

    // Vendors cannot choose another vendor/company.
    if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({
        userId: auth.user.userId,
      })
        .select("_id")
        .lean();

      if (!vendor) {
        return NextResponse.json(
          {
            success: false,
            message: "Vendor profile not found",
          },
          { status: 404 }
        );
      }

      companyId = vendor._id;
    }

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid companyId format",
        },
        { status: 400 }
      );
    }

    const route = await TransportationRoute.create({
      companyId,
      companyName: body.companyName.trim(),
      fromCity: body.fromCity.trim(),
      toCity: body.toCity.trim(),

      boardingPoints: Array.isArray(body.boardingPoints)
        ? body.boardingPoints
        : parseList(body.boardingPoints),

      droppingPoints: Array.isArray(body.droppingPoints)
        ? body.droppingPoints
        : parseList(body.droppingPoints),

      duration: body.duration.trim(),
    });

    return NextResponse.json(
      {
        success: true,
        data: route,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/transport-routes error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(req) {
  try {
    const auth = await requireVendorAuth(req);

    if (!auth.ok) {
      return auth.response;
    }

    await connectDB();

    const { searchParams } = new URL(req.url);

    let companyId = searchParams.get("companyId");

    /*
     * ----------------------------------------
     * Pagination
     * ----------------------------------------
     */

    const rawPage = Number(searchParams.get("page"));
    const rawLimit = Number(searchParams.get("limit"));

    const page =
      Number.isInteger(rawPage) && rawPage > 0
        ? rawPage
        : 1;

    const limit =
      Number.isInteger(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    /*
     * ----------------------------------------
     * Vendor ownership
     * ----------------------------------------
     */

    if (auth.user.role === "vendor") {
      const vendor = await Vendor.findOne({
        userId: auth.user.userId,
      })
        .select("_id")
        .lean();

      if (!vendor) {
        return NextResponse.json(
          {
            success: false,
            message: "Vendor profile not found",
          },
          { status: 404 }
        );
      }

      // Ignore client-supplied companyId for vendors.
      companyId = String(vendor._id);
    }

    /*
     * ----------------------------------------
     * Query filter
     * ----------------------------------------
     */

    const filter = {};

    if (companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        return NextResponse.json(
          {
            success: false,
            message: "Invalid companyId format",
          },
          { status: 400 }
        );
      }

      filter.companyId = companyId;
    }

    /*
     * ----------------------------------------
     * Bounded query
     * ----------------------------------------
     */

    const skip = (page - 1) * limit;

    const [routes, total] = await Promise.all([
      TransportationRoute.find(filter)
  .select(
    [
      "_id",
      "companyId",
      "companyName",
      "fromCity",
      "toCity",
      "boardingPoints",
      "droppingPoints",
      "duration",
      "createdAt",
      "updatedAt",
    ].join(" ")
  )
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit)
  .lean(),

      TransportationRoute.countDocuments(filter),
    ]);

    const totalPages =
      total === 0 ? 0 : Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,
        data: routes,

        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET /api/transport-routes error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}