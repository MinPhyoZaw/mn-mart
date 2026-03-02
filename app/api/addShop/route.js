// src/app/api/shops/route.js
import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Shop from "../../models/Shop";

export async function POST(req) {
  await connectDB();

  const body = await req.json();

  const shop = await Shop.create(body);

  return NextResponse.json({ message: "Shop created!", shop });
}