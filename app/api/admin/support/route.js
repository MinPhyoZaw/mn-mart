import { chatHandlers, chatResponse, supportRoute } from "../../../lib/supportChat";
import SupportMessage from "../../../models/SupportMessage";
import User from "../../../models/User";

export const dynamic = "force-dynamic";
const thread = chatHandlers("admin");
export const { POST, PATCH } = thread;

const inbox = supportRoute("admin", async (_req, _user, params) => {
  const page = Number(params.get("page") || 1);
  if (!Number.isSafeInteger(page) || page < 1 || page > 10000) {
    return chatResponse({ message: "Invalid inbox page." }, 400);
  }

  const pageSize = 25;
  const rows = await SupportMessage.aggregate([
    { $sort: { createdAt: -1, _id: -1 } },
    { $group: {
      _id: "$customerId",
      latest: { $first: "$body" },
      updatedAt: { $first: "$createdAt" },
      unread: { $sum: { $cond: [
        { $and: [{ $eq: ["$senderRole", "customer"] }, { $eq: ["$read", false] }] },
        1,
        0,
      ] } },
    } },
    { $set: { hasUnread: { $gt: ["$unread", 0] } } },
    { $sort: { hasUnread: -1, updatedAt: -1, _id: -1 } },
    { $skip: (page - 1) * pageSize },
    { $limit: pageSize + 1 },
  ]);
  const conversations = rows.slice(0, pageSize);
  const customers = await User.find({ _id: { $in: conversations.map((row) => row._id) } })
    .select("name").lean();
  const names = new Map(customers.map((customer) => [String(customer._id), customer.name]));

  return chatResponse({
    conversations: conversations.map((row) => ({
      ...row,
      name: names.get(String(row._id)) || "Customer",
    })),
    hasNext: rows.length > pageSize,
  });
});

export function GET(req) {
  return req.nextUrl.searchParams.has("customerId") ? thread.GET(req) : inbox(req);
}
