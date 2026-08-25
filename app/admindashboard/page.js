import connectDB from "../lib/mongodb";

import Shop from "../models/Shop";
import Vendor from "../models/Vendor";
import VendorRequest from "../models/VendorRequest";
import User from "../models/User";
import Order from "../models/Order";
import CommissionSetting from "../models/CommissionSetting";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyToken } from "../lib/jwt";
import AdminDashboardClient from "../components/AdminDashboardClient";

import { DEFAULT_SHOPPING_COMMISSION_RATE } from "../lib/shoppingCommission";

const getTodayRange = () => {
  const now = new Date();

  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  return { start, end };
};

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    redirect("/login");
  }

  let decoded;

  try {
    decoded = verifyToken(token);
  } catch {
    redirect("/login");
  }

  await connectDB();

  const currentUser = decoded?.userId
    ? await User.findById(decoded.userId)
        .select("_id role")
        .lean()
    : null;

  if (!currentUser || currentUser.role !== "admin") {
    redirect("/");
  }

  const requestPageSize = 20;
  const userPageSize = 20;

  const { start, end } = getTodayRange();

  /*
   * First small batch
   */
  const [
    shopsCount,
    vendorsCount,
    vendorRequestResult,
  ] = await Promise.all([
    Shop.countDocuments({}),

    Vendor.countDocuments({}),

    VendorRequest.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $facet: {
          requests: [
            {
              $limit: requestPageSize,
            },

            {
              $project: {
                _id: 1,
                userId: 1,
                decidedBy: 1,

                businessName: 1,
                vendorName: 1,
                vendorType: 1,

                phone: 1,
                description: 1,

                shopImage: {
                  $cond: [
                    {
                      $regexMatch: {
                        input: {
                          $ifNull: ["$shopImage", ""],
                        },
                        regex: "^https?://",
                      },
                    },
                    "$shopImage",
                    null,
                  ],
                },

                status: 1,

                createdAt: 1,
                updatedAt: 1,
                reviewedAt: 1,
              },
            },
          ],

          stats: [
            {
              $group: {
                _id: null,

                total: {
                  $sum: 1,
                },

                pending: {
                  $sum: {
                    $cond: [
                      {
                        $eq: [
                          "$status",
                          "pending",
                        ],
                      },
                      1,
                      0,
                    ],
                  },
                },
              },
            },
          ],
        },
      },
    ]),
  ]);

  const vendorRequestFacet =
    vendorRequestResult?.[0] || {};

  const vendorRequestsRaw =
    vendorRequestFacet.requests || [];

  const vendorRequestStats =
    vendorRequestFacet.stats?.[0] || {};

  const pendingRequestsCount =
    vendorRequestStats.pending || 0;

  const totalRequestsCount =
    vendorRequestStats.total || 0;

  /*
   * Second small batch
   */
  const [
    userResult,
    orderProfitResult,
    shoppingCommissionRaw,
  ] = await Promise.all([
    User.aggregate([
      {
        $sort: {
          createdAt: -1,
        },
      },

      {
        $facet: {
          users: [
            {
              $limit: userPageSize,
            },

            {
              $project: {
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                createdAt: 1,
                updatedAt: 1,
              },
            },
          ],

          stats: [
            {
              $count: "total",
            },
          ],
        },
      },
    ]),

    Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: start,
            $lte: end,
          },

          orderStatus: "confirmed",
          vendorStatus: "accepted",
        },
      },

      {
        $group: {
          _id: "$vendorId",

          amount: {
            $sum: {
              $ifNull: [
                "$commissionAmount",
                0,
              ],
            },
          },

          orderCount: {
            $sum: 1,
          },
        },
      },

      {
        $lookup: {
          from: Vendor.collection.name,

          localField: "_id",
          foreignField: "_id",

          as: "vendor",
        },
      },

      {
        $unwind: {
          path: "$vendor",
          preserveNullAndEmptyArrays: true,
        },
      },

      {
        $project: {
          _id: 0,

          vendorName: {
            $ifNull: [
              "$vendor.vendorName",
              "Unknown Vendor",
            ],
          },

          amount: 1,
          orderCount: 1,
        },
      },

      {
        $sort: {
          amount: -1,
        },
      },
    ]),

    CommissionSetting.findOne({
      serviceType: "shopping",
    })
      .select("_id serviceType rate updatedAt")
      .lean(),
  ]);

  /*
   * Users
   */
  const userFacet =
    userResult?.[0] || {};

  const usersRaw =
    userFacet.users || [];

  const totalUsersCount =
    userFacet.stats?.[0]?.total || 0;

  /*
   * Today's profit
   */
  const todayProfitByVendor =
    orderProfitResult.map((row) => ({
      vendorName:
        row.vendorName ||
        "Unknown Vendor",

      amount:
        Number(row.amount) || 0,
    }));

  const totalTodayProfit =
    todayProfitByVendor.reduce(
      (sum, row) =>
        sum + Number(row.amount || 0),
      0
    );

  const todayOrdersCount =
    orderProfitResult.reduce(
      (sum, row) =>
        sum +
        Number(row.orderCount || 0),
      0
    );

  /*
   * Commission setting
   */
  const shoppingCommissionSetting = {
    _id:
      shoppingCommissionRaw?._id
        ? String(
            shoppingCommissionRaw._id
          )
        : null,

    serviceType: "shopping",

    rate:
      shoppingCommissionRaw?.rate ??
      DEFAULT_SHOPPING_COMMISSION_RATE,

    isDefault:
      !shoppingCommissionRaw,

    updatedAt:
      shoppingCommissionRaw?.updatedAt
        ? shoppingCommissionRaw.updatedAt.toISOString()
        : null,
  };

  /*
  * Serialize vendor requests. The aggregation already removes
  * legacy Base64 images; keep the URL check here as a second boundary.
   */
  const vendorRequests =
    vendorRequestsRaw.map(
      (request) => ({
        _id:
          request._id
            ? String(request._id)
            : null,

        userId:
          request.userId
            ? String(request.userId)
            : null,

        decidedBy:
          request.decidedBy
            ? String(request.decidedBy)
            : null,

        businessName:
          request.businessName || "",

        vendorName:
          request.vendorName || "",

        vendorType:
          request.vendorType || "",

        phone:
          request.phone || "",

        description:
          request.description || "",

        shopImage:
          typeof request.shopImage === "string" &&
          /^https?:\/\//i.test(request.shopImage)
            ? request.shopImage
            : null,

        status:
          request.status ||
          "pending",

        createdAt:
          request.createdAt
            ? new Date(
                request.createdAt
              ).toISOString()
            : null,

        updatedAt:
          request.updatedAt
            ? new Date(
                request.updatedAt
              ).toISOString()
            : null,

        reviewedAt:
          request.reviewedAt
            ? new Date(
                request.reviewedAt
              ).toISOString()
            : null,
      })
    );

  /*
   * Serialize users
   */
  const users =
    usersRaw.map((user) => ({
      _id:
        user._id
          ? String(user._id)
          : null,

      name:
        user.name || "",

      email:
        user.email || "",

      role:
        user.role || "customer",

      createdAt:
        user.createdAt
          ? new Date(
              user.createdAt
            ).toISOString()
          : null,

      updatedAt:
        user.updatedAt
          ? new Date(
              user.updatedAt
            ).toISOString()
          : null,
    }));

  return (
    <AdminDashboardClient
      shopsCount={shopsCount}
      vendorsCount={vendorsCount}

      pendingRequestsCount={
        pendingRequestsCount
      }

      todayOrdersCount={
        todayOrdersCount
      }

      todayProfitByVendor={
        todayProfitByVendor
      }

      totalTodayProfit={
        totalTodayProfit
      }

      vendorRequests={
        vendorRequests
      }

      requestPageSize={
        requestPageSize
      }

      totalRequestsCount={
        totalRequestsCount
      }

      users={users}

      userPageSize={
        userPageSize
      }

      totalUsersCount={
        totalUsersCount
      }

      shoppingCommissionSetting={
        shoppingCommissionSetting
      }
    />
  );
}