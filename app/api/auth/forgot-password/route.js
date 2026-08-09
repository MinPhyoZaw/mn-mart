import { NextResponse } from "next/server";
import crypto from "crypto";
import { Resend } from "resend";

import User from "../../../models/User";
import connectDB from "../../../lib/mongodb";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req) {
  try {
    await connectDB();

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "Email is required",
        },
        { status: 400 }
      );
    }

    console.log("Forgot password request:", email);

    const user = await User.findOne({
      email: email.toLowerCase(),
    });

    console.log("USER FOUND:", !!user);

    // Do not reveal whether the account exists
    if (!user) {
      console.log("NO USER FOUND - EMAIL NOT SENT");

      return NextResponse.json({
        success: true,
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Store only hashed token in database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(
      Date.now() + 15 * 60 * 1000
    );

    await user.save();

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000";

    const resetUrl =
      `${baseUrl}/reset-password?token=${resetToken}`;

    console.log("RESET PASSWORD URL:", resetUrl);

    // Send email with Resend
    const { data, error } = await resend.emails.send({
      from: "MN Mart <noreply@mn-mart.store>",
      to: email,
      subject: "Reset your MN Mart password",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Reset your MN Mart password</h2>

          <p>
            We received a request to reset your password.
          </p>

          <p>
            Click the button below to create a new password.
          </p>

          <a
            href="${resetUrl}"
            style="
              display:inline-block;
              background:#000;
              color:#fff;
              padding:12px 20px;
              text-decoration:none;
              border-radius:6px;
              margin:10px 0;
            "
          >
            Reset Password
          </a>

          <p>
            This link will expire in 15 minutes.
          </p>

          <p>
            If you didn't request this, you can ignore this email.
          </p>
        </div>
      `,
    });

    console.log("RESEND DATA:", data);
    console.log("RESEND ERROR:", error);

    // Handle Resend error
    if (error) {
      console.error("FAILED TO SEND RESET EMAIL:", error);

      return NextResponse.json(
        {
          success: false,
          message: "Unable to send password reset email.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });

  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Server error",
      },
      { status: 500 }
    );
  }
}