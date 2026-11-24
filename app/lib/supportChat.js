import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "./mongodb";
import { requireAuth } from "./routeAuth";
import User from "../models/User";
import SupportMessage from "../models/SupportMessage";

export function chatResponse(data, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
}

export function supportRoute(role, handler) {
  return async (req) => {
    const auth = requireAuth(req);
    if (!auth.ok) return auth.response;

    try {
      await connectDB();
      const user = await User.findById(auth.user.userId).select("role").lean();
      if (!user) return chatResponse({ message: "Please sign in again." }, 401);
      if (user.role !== role) return chatResponse({ message: "Forbidden" }, 403);
      return await handler(req, user, new URL(req.url).searchParams);
    } catch (error) {
      console.error("Support chat request failed", error.name);
      return chatResponse({ message: "Support chat is temporarily unavailable." }, 503);
    }
  };
}

const messageFields = "senderRole body createdAt";
const pageSize = 40;

export function chatHandlers(role) {
  const incomingRole = role === "admin" ? "customer" : "admin";

  function withThread(handler) {
    return supportRoute(role, async (req, user, params) => {
      const customerId = role === "customer" ? user._id : params.get("customerId");
      if (!mongoose.isObjectIdOrHexString(customerId)) {
        return chatResponse({ message: "Invalid conversation." }, 400);
      }
      if (role === "admin" && !(await SupportMessage.exists({ customerId }))) {
        return chatResponse({ message: "Conversation not found." }, 404);
      }
      return handler(req, user, params, { customerId });
    });
  }

  return {
    GET: withThread(async (_req, _user, params, thread) => {
      const incoming = { ...thread, senderRole: incomingRole, read: false };
      if (params.get("unread") === "1") {
        return chatResponse({ unread: await SupportMessage.countDocuments(incoming) });
      }

      const before = params.get("before");
      const filter = { ...thread };
      if (before) {
        if (!mongoose.isObjectIdOrHexString(before)) {
          return chatResponse({ message: "Invalid history cursor." }, 400);
        }
        const cursor = await SupportMessage.findOne({ ...thread, _id: before }).select("createdAt").lean();
        if (!cursor) return chatResponse({ message: "History cursor not found." }, 404);
        filter.$or = [
          { createdAt: { $lt: cursor.createdAt } },
          { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
        ];
      }

      const rows = await SupportMessage.find(filter).select(messageFields)
        .sort({ createdAt: -1, _id: -1 }).limit(pageSize + 1).lean();
      return chatResponse({
        messages: rows.slice(0, pageSize).reverse(),
        hasOlder: rows.length > pageSize,
      });
    }),

    POST: withThread(async (req, user, _params, thread) => {
      const payload = await req.json().catch(() => null);
      const body = typeof payload?.body === "string" ? payload.body.trim() : "";
      const requestId = payload?.requestId;
      if (!body || body.length > 2000 || typeof requestId !== "string" ||
          !/^[0-9a-f-]{36}$/i.test(requestId)) {
        return chatResponse({ message: "Enter a message of 1 to 2,000 characters." }, 400);
      }

      const key = { senderId: user._id, requestId };
      let saved;
      try {
        saved = await SupportMessage.findOneAndUpdate(
          { ...key, ...thread },
          { $setOnInsert: { ...key, ...thread, senderRole: role, body } },
          { upsert: true, returnDocument: "after", runValidators: true },
        ).select(messageFields).lean();
      } catch (error) {
        if (error.code !== 11000) throw error;
        saved = await SupportMessage.findOne({ ...key, ...thread }).select(messageFields).lean();
        if (!saved) return chatResponse({ message: "Send the message again." }, 409);
      }
      if (saved.body !== body) return chatResponse({ message: "Send the message again." }, 409);
      return chatResponse({ message: saved });
    }),

    PATCH: withThread(async (req, _user, _params, thread) => {
      const payload = await req.json().catch(() => null);
      if (!mongoose.isObjectIdOrHexString(payload?.through)) {
        return chatResponse({ message: "Invalid read position." }, 400);
      }
      const cursor = await SupportMessage.findOne({ ...thread, _id: payload.through }).select("createdAt").lean();
      if (cursor) {
        await SupportMessage.updateMany({
          ...thread,
          senderRole: incomingRole,
          read: false,
          $or: [
            { createdAt: { $lt: cursor.createdAt } },
            { createdAt: cursor.createdAt, _id: { $lte: cursor._id } },
          ],
        }, { $set: { read: true } });
      }
      return chatResponse({ ok: true });
    }),
  };
}
