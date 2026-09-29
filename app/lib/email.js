import { Resend } from "resend";

export const EMAIL_FROM = "MN Mart <noreply@mn-mart.store>";

let resendClient;

export function getResendClient() {
  if (!process.env.RESEND_API_KEY) return null;

  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }

  return resendClient;
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || "https://www.mn-mart.store").replace(
    /\/$/,
    ""
  );
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendVendorApprovalEmail({ email, name }) {
  const resend = getResendClient();
  if (!resend) {
    throw new Error("Email service is not configured");
  }

  const dashboardUrl = `${getSiteUrl()}/vendordashboard`;
  const greeting = name?.trim() ? `Hello ${escapeHtml(name.trim())},` : "Hello,";

  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: "Your MN-Mart Vendor Request Has Been Approved",
    html: `
      <div style="margin:0;background:#f5f5f5;padding:24px 12px;font-family:Arial,sans-serif;color:#171717;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:10px;padding:28px;box-sizing:border-box;">
          <h2 style="margin:0 0 20px;line-height:1.3;">Your vendor request is approved</h2>
          <p style="line-height:1.6;">${greeting}</p>
          <p style="line-height:1.6;">Great news! Your vendor request has been approved.</p>
          <p style="line-height:1.6;">You can now access your Vendor Dashboard and start setting up your shop on MN-Mart.</p>
          <p style="line-height:1.6;">Sign in using your existing MN-Mart account to get started.</p>
          
          <p style="margin-bottom:8px;line-height:1.6;"><strong>Next steps:</strong></p>
          <ul style="padding-left:22px;line-height:1.8;">
            <li>Open your Vendor Dashboard</li>
            <li>Complete your shop information</li>
            <li>Add your products</li>
            <li>Keep your shop information up to date</li>
          </ul>
          <p style="line-height:1.6;">Welcome to MN-Mart. We're happy to have your business with us.</p>
          <p style="margin-bottom:0;line-height:1.6;">MN-Mart Team</p>
        </div>
      </div>
    `,
  });

  if (error) {
    throw new Error("Approval email could not be sent");
  }
}
