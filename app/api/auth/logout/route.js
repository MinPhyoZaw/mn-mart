// app/api/auth/logout/route.js
import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ success: true, message: "Logged out" });
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    maxAge: 0,
    path: "/",
  });
  return response;
}