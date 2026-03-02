// app/api/addvendor/route.js

import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Vendor from "../../models/Vendor";

export async function POST(req) {
  try {
    await connectDB();

    const body = await req.json();

    const {
      vendorName,
      serviceType,
      contactPerson,
      phone,
      email,
      address,
      commissionRate
    } = body;

    // ✅ Basic Validation
    if (
      !vendorName ||
      !serviceType ||
      !contactPerson ||
      !phone ||
      !email ||
      !address
    ) {
      return NextResponse.json(
        { success: false, message: "All required fields must be filled." },
        { status: 400 }
      );
    }

    // ✅ Check if vendor email already exists
    const existingVendor = await Vendor.findOne({ email });

    if (existingVendor) {
      return NextResponse.json(
        { success: false, message: "Vendor with this email already exists." },
        { status: 400 }
      );
    }

    // ✅ Create Vendor
    const newVendor = await Vendor.create({
      vendorName,
      serviceType,
      contactPerson,
      phone,
      email,
      address,
      commissionRate
    });

    return NextResponse.json(
      {
        success: true,
        message: "Vendor created successfully",
        vendor: newVendor
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("Add Vendor Error:", error);

    return NextResponse.json(
      { success: false, message: "Server Error" },
      { status: 500 }
    );
  }
}