import { NextResponse } from "next/server";

import connectDB from "../../lib/mongodb";
import Vendor from "../../models/Vendor";
import { requireAuth } from "../../lib/routeAuth";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

/*
 * --------------------------------------------------
 * GET /api/vendors
 * --------------------------------------------------
 *
 * Public vendor listing.
 *
 * Bounded and paginated so the response does not
 * grow forever as MN-Mart gains more vendors.
 */
export async function GET(req) {
  try {
    await connectDB();

    const { searchParams } = new URL(req.url);

    const rawPage = Number.parseInt(
      searchParams.get("page") || "1",
      10
    );

    const rawLimit = Number.parseInt(
      searchParams.get("limit") || String(DEFAULT_LIMIT),
      10
    );

    const page =
      Number.isFinite(rawPage) && rawPage > 0
        ? rawPage
        : 1;

    const limit =
      Number.isFinite(rawLimit) && rawLimit > 0
        ? Math.min(rawLimit, MAX_LIMIT)
        : DEFAULT_LIMIT;

    const skip = (page - 1) * limit;

    const [vendors, total] = await Promise.all([
      Vendor.find({})
        /*
         * Only expose fields appropriate for a
         * public vendor listing.
         *
         * Do not expose userId or other internal
         * relationship/system fields.
         */
        .select(
          [
            "_id",
            "vendorName",
            "serviceType",
            "contactPerson",
            "phone",
            "createdAt",
            "updatedAt",
          ].join(" ")
        )
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit)
        .lean(),

      Vendor.countDocuments({}),
    ]);

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(total / limit);

    return NextResponse.json(
      {
        success: true,

        /*
         * Keep data as the vendor array so
         * existing callers using data.data
         * continue to work.
         */
        data: vendors,

        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage:
            page < totalPages,
          hasPreviousPage:
            page > 1,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "GET /api/vendors error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * --------------------------------------------------
 * POST /api/vendors
 * --------------------------------------------------
 *
 * Admin only.
 */
export async function POST(req) {
  try {
    const auth = requireAuth(
      req,
      ["admin"]
    );

    if (!auth.ok) {
      return auth.response;
    }

    await connectDB();

    const body = await req.json();

    const {
      vendorName,
      serviceType,
      contactPerson,
      phone,
      email,
      address,
    } = body;

    if (
      !vendorName ||
      !serviceType ||
      !contactPerson ||
      !phone ||
      !email ||
      !address
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing required fields",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Normalize email before checking duplicates.
     */
    const normalizedEmail =
      String(email)
        .trim()
        .toLowerCase();

    const exists =
      await Vendor.findOne({
        email: normalizedEmail,
      })
        .select("_id")
        .lean();

    if (exists) {
      return NextResponse.json(
        {
          success: false,
          message: "Vendor exists",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Explicit creation fields instead of
     * Vendor.create(body).
     *
     * This prevents callers from supplying
     * arbitrary schema/system fields.
     */
    const vendor =
      await Vendor.create({
        vendorName:
          String(vendorName).trim(),

        serviceType:
          String(serviceType).trim(),

        contactPerson:
          String(contactPerson).trim(),

        phone:
          String(phone).trim(),

        email:
          normalizedEmail,

        address:
          String(address).trim(),
      });

    return NextResponse.json(
      {
        success: true,
        data: vendor,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/vendors error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      {
        status: 500,
      }
    );
  }
}