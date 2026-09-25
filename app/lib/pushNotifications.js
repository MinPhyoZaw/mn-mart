import "server-only";

import mongoose from "mongoose";

import connectDB from "./mongodb";
import { getFirebaseAdminMessaging } from "./firebaseAdmin";
import PushDevice from "../models/PushDevice";

const MAX_MULTICAST_TOKENS = 500;
const PERMANENT_TOKEN_ERRORS = new Set([
  "messaging/invalid-registration-token",
  "messaging/registration-token-not-registered",
]);

const emptyResult = () => ({ attempted: 0, sent: 0, failed: 0 });

function stringValue(value, maxLength) {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, maxLength);
}

function createDataPayload({ title, body, url, type, eventId, orderId }) {
  return {
    type: stringValue(type, 64),
    eventId: stringValue(eventId, 128),
    title: stringValue(title, 120),
    body: stringValue(body, 240),
    url: stringValue(url, 512),
    orderId: stringValue(orderId, 128),
  };
}

function chunks(values, size) {
  const result = [];
  for (let index = 0; index < values.length; index += size) {
    result.push(values.slice(index, index + size));
  }
  return result;
}

export async function sendPushToUser({
  userId,
  title,
  body,
  url,
  type,
  eventId,
  orderId,
} = {}) {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return { ...emptyResult(), error: "invalid-user-id" };
  }

  let devices;
  try {
    await connectDB();
    devices = await PushDevice.find({ userId }).select({ token: 1, _id: 0 }).lean();
  } catch {
    return { ...emptyResult(), error: "database-query-failed" };
  }

  const tokens = devices.map(({ token }) => token).filter(Boolean);
  if (tokens.length === 0) return emptyResult();

  const result = { attempted: tokens.length, sent: 0, failed: 0 };
  const invalidTokens = [];
  let messaging;

  try {
    messaging = getFirebaseAdminMessaging();
  } catch {
    return { ...result, failed: tokens.length, error: "firebase-configuration-failed" };
  }

  for (const tokenBatch of chunks(tokens, MAX_MULTICAST_TOKENS)) {
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: tokenBatch,
        data: createDataPayload({ title, body, url, type, eventId, orderId }),
      });
      result.sent += response.successCount;
      result.failed += response.failureCount;

      response.responses.forEach((item, index) => {
        if (!item.success && PERMANENT_TOKEN_ERRORS.has(item.error?.code)) {
          invalidTokens.push(tokenBatch[index]);
        }
      });
    } catch {
      result.failed += tokenBatch.length;
      result.error = "firebase-send-failed";
    }
  }

  if (invalidTokens.length > 0) {
    try {
      const cleanup = await PushDevice.deleteMany({ token: { $in: invalidTokens } });
      result.removedInvalidTokens = cleanup.deletedCount;
    } catch {
      result.cleanupError = "database-cleanup-failed";
    }
  }

  return result;
}
