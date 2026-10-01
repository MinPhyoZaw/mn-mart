import Link from "next/link";
import {
  BellRing,
  Building2,
  ChevronRight,
  Database,
  FileCheck2,
  LockKeyhole,
  Mail,
  ShieldCheck,
  SlidersHorizontal,
  UserRoundCheck,
} from "lucide-react";

export const metadata = {
  title: "Privacy Policy | ManawMart",
  description:
    "Learn how ManawMart collects, uses, shares, and protects information when you shop, book services, or operate a shop.",
  alternates: {
    canonical: "https://www.mn-mart.store/privacy",
  },
};

const sections = [
  { id: "information", label: "Information we collect" },
  { id: "use", label: "How we use information" },
  { id: "sharing", label: "How information is shared" },
  { id: "retention", label: "Retention" },
  { id: "choices", label: "Your choices and rights" },
  { id: "security", label: "Security" },
  { id: "children", label: "Children’s privacy" },
  { id: "changes", label: "Changes to this policy" },
  { id: "contact", label: "Contact ManawMart" },
];

function PolicySection({ id, number, title, icon: Icon, children }) {
  return (
    <section id={id} className="scroll-mt-36 border-t border-slate-200 py-8 first:border-0 first:pt-0 sm:py-10">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
          <Icon aria-hidden="true" size={20} />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Section {number}</p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950 sm:text-2xl">{title}</h2>
        </div>
      </div>
      <div className="space-y-4 text-[15px] leading-7 text-slate-600 sm:text-base">{children}</div>
    </section>
  );
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="relative overflow-hidden border-b border-emerald-900/10 bg-emerald-950 text-white">
        <div aria-hidden="true" className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-emerald-500/20 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-36 left-1/4 h-72 w-72 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-100 transition hover:text-white">
            ManawMart <ChevronRight aria-hidden="true" size={15} /> Legal
          </Link>
          <div className="mt-7 max-w-3xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <ShieldCheck aria-hidden="true" size={27} />
            </div>
            <h1 className="font-[family-name:var(--font-raleway)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              Privacy Policy
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-emerald-50/85 sm:text-lg">
              This policy explains how ManawMart handles information when you use our marketplace to shop, make a hotel, spa, or transportation booking, or operate a vendor shop.
            </p>
            <p className="mt-6 inline-flex rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white ring-1 ring-white/15">
              Last updated: October 2026
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-8 px-5 py-8 sm:px-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:py-12">
        <aside className="lg:sticky lg:top-32 lg:self-start" aria-label="Privacy policy contents">
          <nav className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="px-2 pb-3 text-xs font-bold uppercase tracking-[0.16em] text-slate-500">On this page</p>
            <ol className="space-y-1">
              {sections.map((section, index) => (
                <li key={section.id}>
                  <a href={`#${section.id}`} className="flex rounded-lg px-2 py-2 text-sm leading-5 text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800">
                    <span className="mr-2 text-slate-400">{index + 1}.</span>{section.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>

        <main className="rounded-3xl border border-slate-200 bg-white px-5 py-8 shadow-sm sm:px-10 sm:py-10 lg:px-12">
          <div className="mb-8 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 text-[15px] leading-7 text-emerald-950 sm:p-6">
            <p className="font-semibold">Who this policy applies to</p>
            <p className="mt-1 text-emerald-900/80">
              This policy applies to customers, vendors, and administrators using the ManawMart website, progressive web app, and Android experience at <a className="font-semibold underline decoration-emerald-400 underline-offset-4" href="https://www.mn-mart.store">www.mn-mart.store</a>. “ManawMart,” “we,” and “our” refer to the ManawMart marketplace.
            </p>
          </div>

          <PolicySection id="information" number="1" title="Information we collect" icon={Database}>
            <p>We collect information you provide and limited information generated when the service operates:</p>
            <ul className="list-disc space-y-3 pl-5 marker:text-emerald-600">
              <li><strong className="text-slate-800">Account information:</strong> your name, email address, phone number if supplied, password in hashed form, account role, profile image if added, and password-reset records.</li>
              <li><strong className="text-slate-800">Orders and delivery:</strong> products, quantities, shop, order totals and status, your name, phone number, delivery address and ward, and any order or booking note.</li>
              <li><strong className="text-slate-800">Bookings:</strong> for applicable hotel, spa, and transportation services, details such as the selected service or room, guest count, date and time, route, departure details, and amounts paid or left to pay.</li>
              <li><strong className="text-slate-800">Payment records:</strong> the payment method you select, transaction amounts and status, and the receipt or proof-of-payment image you upload. ManawMart uses this information to verify payment; the current service does not collect payment-card numbers.</li>
              <li><strong className="text-slate-800">Vendor and shop information:</strong> vendor or business name, business type, contact person, phone, email, address, description, shop image, payout phone numbers you submit, products and services, commission and settlement records, and vendor-request status.</li>
              <li><strong className="text-slate-800">Reviews and communications:</strong> product-review text, the account associated with a review, and operational messages and notification-read status.</li>
              <li><strong className="text-slate-800">Push notification information:</strong> when you choose to enable notifications, a Firebase Cloud Messaging registration token, your account identifier, platform type (web, PWA, or Android trusted web activity), and the time the device was last seen.</li>
              <li><strong className="text-slate-800">Image search:</strong> if you choose the camera/image-search feature, the selected image is sent for visual analysis to return labels and relevant products.</li>
              <li><strong className="text-slate-800">Technical and usage information:</strong> information reasonably generated by browsers, servers, and hosting services, such as IP address, browser or device type, requested pages, timestamps, error and performance information, and aggregated website-usage measurements. Authentication cookies keep you signed in, and local browser storage may keep your cart or notification preferences.</li>
            </ul>
          </PolicySection>

          <PolicySection id="use" number="2" title="How we use information" icon={FileCheck2}>
            <p>ManawMart uses information to:</p>
            <ul className="list-disc space-y-2 pl-5 marker:text-emerald-600">
              <li>create and secure accounts, authenticate users, assign authorized roles, and support password resets;</li>
              <li>display shops, products, services, reviews, and relevant image-search results;</li>
              <li>submit, verify, process, fulfill, and keep records of shopping orders and hotel, spa, or transportation bookings;</li>
              <li>calculate order totals, commissions, vendor earnings, and settlement status;</li>
              <li>allow customers, vendors, and administrators to receive and manage operational order or booking updates;</li>
              <li>send push notifications you have enabled and service emails such as password-reset or vendor-approval messages;</li>
              <li>provide customer and vendor support, investigate errors, maintain service performance, and improve the marketplace; and</li>
              <li>protect accounts, prevent duplicate or fraudulent transactions, enforce access controls, and comply with applicable obligations.</li>
            </ul>
          </PolicySection>

          <PolicySection id="sharing" number="3" title="How information is shared" icon={Building2}>
            <p>We do not claim to sell personal information. We disclose information only as needed to operate ManawMart, fulfill a request, protect the service, or meet a legal obligation.</p>
            <ul className="list-disc space-y-3 pl-5 marker:text-emerald-600">
              <li><strong className="text-slate-800">Vendors and fulfillment parties:</strong> the vendor or shop responsible for an order or booking may receive the customer, contact, delivery, order, booking, payment-status, and proof-of-payment details needed to fulfill it. A transportation, hotel, or spa provider receives the booking details relevant to its service.</li>
              <li><strong className="text-slate-800">ManawMart administrators:</strong> authorized administrators may review accounts, vendor requests, orders, bookings, payment receipts, commissions, and status information to operate and support the marketplace.</li>
              <li><strong className="text-slate-800">Service infrastructure:</strong> ManawMart uses MongoDB-backed data storage; Supabase for uploaded receipt, product, and shop images; Firebase Cloud Messaging for optional push notifications; Resend for account and vendor emails; Vercel hosting, Analytics, and Speed Insights for delivery and service measurements; and Google Cloud Vision when you voluntarily submit an image search. These providers process relevant information on ManawMart’s behalf under their own security and privacy terms.</li>
              <li><strong className="text-slate-800">Legal and safety reasons:</strong> information may be disclosed when reasonably necessary to comply with law or a valid legal request, investigate fraud or security issues, protect users or the public, or establish and defend legal claims.</li>
              <li><strong className="text-slate-800">Business changes:</strong> information may be transferred as part of a merger, financing, reorganization, or sale of all or part of ManawMart, subject to appropriate safeguards and notice where required.</li>
            </ul>
            <p>Public shop listings may show vendor-provided business information. Reviews may display the reviewer’s name and profile image alongside the review.</p>
          </PolicySection>

          <PolicySection id="retention" number="4" title="Data retention" icon={Database}>
            <p>We retain account information while an account remains active and as needed to provide ManawMart. Order, booking, payment, commission, vendor, and settlement records may be retained after fulfillment for operational records, dispute handling, fraud prevention, and applicable legal or accounting requirements.</p>
            <p>Retention periods vary with the record and purpose. We delete or de-identify information when it is no longer reasonably needed, unless continued retention is required or permitted by law. Disabling notifications removes the registered push token through the service where supported; server backups and logs may remain for a limited period before routine deletion.</p>
          </PolicySection>

          <PolicySection id="choices" number="5" title="Your choices and rights" icon={SlidersHorizontal}>
            <ul className="list-disc space-y-3 pl-5 marker:text-emerald-600">
              <li>You can choose whether to supply optional information and whether to enable browser or app push notifications. You can disable notifications in the account panel and in your device or browser settings.</li>
              <li>You can remove locally stored cart information by clearing the cart or your browser/app data. You may choose not to use optional image search or upload a profile image.</li>
              <li>You may ask to access, correct, or delete your account information, or object to or restrict certain processing where applicable. We may need to verify your identity before acting on a request.</li>
              <li>To request account and personal-data deletion, use the contact method in Section 9 and include the email address associated with your account. Some transaction records may be retained where reasonably required for legal, security, accounting, or dispute-resolution purposes; we will explain any applicable limitation.</li>
            </ul>
          </PolicySection>

          <PolicySection id="security" number="6" title="How we protect information" icon={LockKeyhole}>
            <p>ManawMart uses reasonable technical and organizational safeguards appropriate to the service, including hashed account passwords, authenticated and role-restricted routes, secure session cookies, input validation, limited upload types and sizes, and access controls for customer, vendor, and administrator functions.</p>
            <p>No online service or storage system can guarantee absolute security. Keep your password confidential, use a unique password, and contact ManawMart promptly if you believe your account has been compromised.</p>
          </PolicySection>

          <PolicySection id="children" number="7" title="Children’s privacy" icon={UserRoundCheck}>
            <p>ManawMart is a general marketplace and is not directed to children under 13. We do not knowingly request personal information from a child under 13. If you believe a child has provided personal information without appropriate permission, contact us so we can review and delete it where required.</p>
          </PolicySection>

          <PolicySection id="changes" number="8" title="Changes to this policy" icon={BellRing}>
            <p>We may update this policy when ManawMart’s services, practices, or legal obligations change. We will publish the revised policy at this URL and update the “Last updated” date. If a change materially affects how we handle information, we will provide additional notice through the service when appropriate.</p>
          </PolicySection>

          <PolicySection id="contact" number="9" title="Contact ManawMart" icon={Mail}>
            <p>For privacy questions or requests to access, correct, or delete your account or data, contact the <strong className="text-slate-800">ManawMart Privacy Team</strong> through the current ManawMart customer-support contact shown in the marketplace or in the ManawMart Google Play listing.</p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <p><strong className="text-slate-800">Service:</strong> ManawMart — Myanmar Digital Marketplace</p>
              <p><strong className="text-slate-800">Website:</strong> <a href="https://www.mn-mart.store" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4">https://www.mn-mart.store</a></p>
              <p><strong className="text-slate-800">Privacy policy:</strong> <a href="https://www.mn-mart.store/privacy" className="font-semibold text-emerald-700 underline decoration-emerald-300 underline-offset-4">https://www.mn-mart.store/privacy</a></p>
            </div>
            <p>Include “Privacy Request” and your account email in your message. Do not include your password or unnecessary payment information.</p>
          </PolicySection>
        </main>
      </div>
    </div>
  );
}
