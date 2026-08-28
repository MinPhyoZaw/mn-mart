import { NextResponse } from "next/server";
import bcrypt from "bcrypt";

import connectDB from "../../lib/mongodb";
import User from "../../models/User";
import { requireAuth } from "../../lib/routeAuth";

const ALLOWED_ROLES = [
  "customer",
  "vendor",
  "admin",
];

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(req) {
  try {
    const auth = requireAuth(
      req,
      ["admin"]
    );

    if (!auth.ok) {
      return auth.response;
    }

    await connectDB();

    const { searchParams } =
      new URL(req.url);

    const rawPage =
      Number.parseInt(
        searchParams.get("page") ||
          "1",
        10
      );

    const rawLimit =
      Number.parseInt(
        searchParams.get("limit") ||
          String(DEFAULT_LIMIT),
        10
      );

    const role =
      searchParams.get("role");

    const page =
      Number.isFinite(rawPage) &&
      rawPage > 0
        ? rawPage
        : 1;

    const limit =
      Number.isFinite(rawLimit) &&
      rawLimit > 0
        ? Math.min(
            rawLimit,
            MAX_LIMIT
          )
        : DEFAULT_LIMIT;

    const skip =
      (page - 1) * limit;

    const filter = {};

    if (
      role &&
      ALLOWED_ROLES.includes(role)
    ) {
      filter.role = role;
    }

    const [users, total] =
      await Promise.all([
        User.find(filter)
          /*
           * Explicit projection is safer
           * than only excluding password.
           */
          .select(
            [
              "_id",
              "name",
              "email",
              "phone",
              "role",
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

        User.countDocuments(filter),
      ]);

    const totalPages =
      total === 0
        ? 0
        : Math.ceil(
            total / limit
          );

    return NextResponse.json(
      {
        success: true,
        data: users,

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
      "GET /api/users error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}

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

    const {
      name,
      email,
      password,
      phone,
      role,
    } = await req.json();

    const normalizedName =
      String(name || "").trim();

    const normalizedEmail =
      String(email || "")
        .trim()
        .toLowerCase();

    const normalizedPhone =
      String(phone || "").trim();

    if (
      !normalizedName ||
      !normalizedEmail ||
      !password
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing fields",
        },
        {
          status: 400,
        }
      );
    }

    const existing =
      await User.findOne({
        email:
          normalizedEmail,
      })
        .select("_id")
        .lean();

    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Email exists",
        },
        {
          status: 400,
        }
      );
    }

    const hashed =
      await bcrypt.hash(
        password,
        10
      );

    const safeRole =
      ALLOWED_ROLES.includes(role)
        ? role
        : "customer";

    const user =
      await User.create({
        name:
          normalizedName,
        email:
          normalizedEmail,
        phone:
          normalizedPhone,
        password:
          hashed,
        role:
          safeRole,
      });

    const userObj =
      user.toObject
        ? user.toObject()
        : user;

    delete userObj.password;

    return NextResponse.json(
      {
        success: true,
        data: userObj,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/users error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}