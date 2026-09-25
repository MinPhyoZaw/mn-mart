import { NextResponse } from "next/server";

import { sendPushToUser } from "../../../../lib/pushNotifications";
import { requireAuth } from "../../../../lib/routeAuth";

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

export async function POST(req) {
  const auth = requireAuth(req, ["admin"]);
  if (!auth.ok) {
    auth.response.headers.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);
    return auth.response;
  }

  const result = await sendPushToUser({
    userId: auth.user.userId,
    title: "MN-Mart Notifications",
    body: "Push notifications are working.",
    url: "/admindashboard",
    type: "push_test",
  });

  return json({
    success: true,
    attempted: result.attempted,
    sent: result.sent,
    failed: result.failed,
  });
}
