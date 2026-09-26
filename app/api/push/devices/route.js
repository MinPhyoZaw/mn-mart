import { NextResponse } from "next/server";
import mongoose from "mongoose";

import connectDB from "../../../lib/mongodb";
import { requireAuth } from "../../../lib/routeAuth";
import PushDevice from "../../../models/PushDevice";

const ALLOWED_ROLES = ["customer", "vendor", "admin"];
const ALLOWED_PLATFORMS = new Set(["web", "pwa", "twa"]);
const MAX_TOKEN_LENGTH = 4096;
const MAX_REQUEST_BYTES = 16 * 1024;
const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, must-revalidate",
};

function json(body, init = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...init.headers,
      ...NO_STORE_HEADERS,
    },
  });
}

function authenticated(req) {
  const auth = requireAuth(req, ALLOWED_ROLES);

  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);
    return auth;
  }

  if (!mongoose.Types.ObjectId.isValid(auth.user.userId)) {
    return {
      ok: false,
      response: json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return auth;
}

async function readBody(req) {
  const contentLength = Number(req.headers.get("content-length"));
  if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
    return { error: "Request body is too large", status: 413 };
  }

  const text = await req.text();
  if (new TextEncoder().encode(text).byteLength > MAX_REQUEST_BYTES) {
    return { error: "Request body is too large", status: 413 };
  }

  try {
    const body = JSON.parse(text);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { error: "Request body must be a JSON object", status: 400 };
    }
    return { body };
  } catch {
    return { error: "Invalid JSON body", status: 400 };
  }
}

function validateToken(value) {
  if (typeof value !== "string") {
    return { error: "Token must be a string" };
  }

  const token = value.trim();
  if (!token) return { error: "Token is required" };
  if (token.length > MAX_TOKEN_LENGTH) {
    return { error: `Token must not exceed ${MAX_TOKEN_LENGTH} characters` };
  }

  return { token };
}

async function registerToken(token, values) {
  try {
    await PushDevice.findOneAndUpdate(
      { token },
      { $set: values },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
        runValidators: true,
      }
    );
  } catch (error) {
    if (error?.code !== 11000) throw error;

    // A concurrent upsert may have inserted the globally unique token first.
    // Updating that winner completes this request and transfers ownership safely.
    const device = await PushDevice.findOneAndUpdate(
      { token },
      { $set: values },
      { new: true, runValidators: true }
    );
    if (!device) throw error;
  }
}

export async function GET(req) {
  const auth = authenticated(req);
  if (!auth.ok) return auth.response;

  try {
    const validated = validateToken(req.headers.get("x-push-device-token"));
    if (validated.error) {
      return json(
        { success: false, message: validated.error },
        { status: 400 }
      );
    }

    await connectDB();
    const registered = await PushDevice.exists({
      token: validated.token,
      userId: auth.user.userId,
    });

    return json({ success: true, registered: Boolean(registered) });
  } catch (error) {
    console.error("GET /api/push/devices error:", error);
    return json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  const auth = authenticated(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = await readBody(req);
    if (parsed.error) {
      return json(
        { success: false, message: parsed.error },
        { status: parsed.status }
      );
    }

    const validated = validateToken(parsed.body.token);
    if (validated.error) {
      return json(
        { success: false, message: validated.error },
        { status: 400 }
      );
    }

    const platform = parsed.body.platform ?? "web";
    if (typeof platform !== "string" || !ALLOWED_PLATFORMS.has(platform)) {
      return json(
        { success: false, message: "Invalid platform" },
        { status: 400 }
      );
    }

    await connectDB();
    await registerToken(validated.token, {
      userId: auth.user.userId,
      platform,
      lastSeenAt: new Date(),
    });

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/push/devices error:", error);
    return json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(req) {
  const auth = authenticated(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = await readBody(req);
    if (parsed.error) {
      return json(
        { success: false, message: parsed.error },
        { status: parsed.status }
      );
    }

    const validated = validateToken(parsed.body.token);
    if (validated.error) {
      return json(
        { success: false, message: validated.error },
        { status: 400 }
      );
    }

    await connectDB();
    await PushDevice.deleteOne({
      token: validated.token,
      userId: auth.user.userId,
    });

    return json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/push/devices error:", error);
    return json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
