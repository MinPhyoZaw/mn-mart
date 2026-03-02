// src/app/api/shops/route.js
import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import User from "../../models/User";

export async function POST(req) {
  await connectDB();

  const body = await req.json();

  const user = await User.create(body);

  return NextResponse.json({ message: "User created!", user });
}