"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, ChevronRight, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";

import { useAuth } from "../context/AuthContext";

export default function DeleteAccountPage() {
  const { user, loading } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  const submitRequest = async () => {
    if (submitting || result?.success) return;
    setSubmitting(true);
    setResult(null);

    try {
      const response = await fetch("/api/account/delete-request", {
        method: "POST",
        credentials: "include",
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      setResult({
        success: response.ok && data.success,
        message: data.message || "Unable to submit the request right now.",
      });
      if (response.ok) setConfirming(false);
    } catch {
      setResult({ success: false, message: "Unable to submit the request right now." });
    } finally {
      setSubmitting(false);
    }
  };

  const eligible = user && ["customer", "vendor"].includes(user.role);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-emerald-900/10 bg-emerald-950 text-white">
        <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
          <Link href="/" className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-100 hover:text-white">
            ManawMart <ChevronRight aria-hidden="true" size={15} /> Account deletion
          </Link>
          <div className="mt-7 max-w-3xl">
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15">
              <Trash2 aria-hidden="true" size={25} />
            </div>
            <h1 className="font-[family-name:var(--font-raleway)] text-4xl font-extrabold tracking-tight sm:text-5xl">
              Request account deletion
            </h1>
            <p className="mt-5 text-base leading-7 text-emerald-50/85 sm:text-lg">
              Use this page to request deletion of your ManawMart account and associated personal account data. Submitting a request starts a review; it does not immediately delete your account.
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-bold text-slate-950">Request from inside ManawMart</h2>
          <p className="mt-3 leading-7 text-slate-600">
            Sign in, open <strong>My Account</strong>, and choose <strong>Delete Account</strong>. You can also complete the same request below while signed in. We may contact you if verification or transaction review is required.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            {loading ? (
              <p className="text-sm text-slate-600">Checking your account…</p>
            ) : !user ? (
              <div>
                <p className="font-semibold text-slate-900">Sign in to submit securely</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Your signed-in identity is used automatically. ManawMart will never ask you to choose another account for deletion.</p>
                <Link href="/login" className="mt-4 inline-flex rounded-xl bg-emerald-700 px-5 py-3 text-sm font-bold text-white hover:bg-emerald-800">
                  Sign in to continue
                </Link>
              </div>
            ) : user.role === "admin" ? (
              <div className="flex gap-3 text-amber-900">
                <AlertTriangle className="mt-0.5 shrink-0" size={20} />
                <p className="text-sm leading-6">Administrator accounts cannot use this consumer self-service workflow. Use the established administrative account-review process to protect platform access and audit integrity.</p>
              </div>
            ) : eligible ? (
              <div>
                <p className="font-semibold text-slate-900">Signed in as {user.email}</p>
                <p className="mt-1 text-sm leading-6 text-slate-600">Only this authenticated account will be included in the request.</p>

                {result && (
                  <div role="status" className={`mt-4 flex gap-3 rounded-xl border p-4 text-sm leading-6 ${result.success ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-red-200 bg-red-50 text-red-800"}`}>
                    {result.success ? <CheckCircle2 className="mt-0.5 shrink-0" size={20} /> : <AlertTriangle className="mt-0.5 shrink-0" size={20} />}
                    <p>{result.message}{result.success ? " ManawMart will review it before any account data is deleted or anonymized." : ""}</p>
                  </div>
                )}

                {!result?.success && !confirming && (
                  <button type="button" onClick={() => setConfirming(true)} className="mt-4 rounded-xl border border-red-300 bg-red-50 px-5 py-3 text-sm font-bold text-red-700 hover:bg-red-100">
                    Request account deletion
                  </button>
                )}

                {confirming && !result?.success && (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                    <h3 className="font-bold text-red-950">Confirm your request</h3>
                    <p className="mt-2 text-sm leading-6 text-red-900">Your request will be sent for review. Account profile data may be deleted or anonymized when processing is complete. Transaction and business records may be retained as described below.</p>
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                      <button type="button" disabled={submitting} onClick={submitRequest} className="rounded-xl bg-red-700 px-5 py-3 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-60">
                        {submitting ? "Submitting request…" : "Yes, submit my request"}
                      </button>
                      <button type="button" disabled={submitting} onClick={() => setConfirming(false)} className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-red-700">This account is not eligible for the deletion-request workflow.</p>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">If you cannot sign in</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Use the current official ManawMart customer-support contact shown in the ManawMart Google Play listing and ask for an account deletion request. Include your account email, but never send your password or payment credentials. Identity verification may be required before the request is processed.
            </p>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-slate-950">What the review covers</h2>
            <p className="mt-3 leading-7 text-slate-600">
              Personal account details such as your name, email, phone number, profile image, credentials, reset records, reviews, and registered push-notification devices will normally be deleted or anonymized where appropriate when processing is completed.
            </p>
          </div>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 sm:p-8">
          <div className="flex gap-3">
            <ShieldCheck className="mt-0.5 shrink-0 text-amber-800" size={23} />
            <div>
              <h2 className="text-xl font-bold text-amber-950">Some records may be preserved</h2>
              <p className="mt-3 leading-7 text-amber-900">
                Order, booking, payment, receipt, vendor, shop, commission, settlement, and other legitimate transaction records may need to be retained for fraud prevention, accounting, dispute resolution, legal obligations, or marketplace transaction integrity. Personal fields may be anonymized where appropriate without corrupting those records. Vendor requests receive administrative review so shops, active orders, subscriptions, and financial records are not blindly deleted.
              </p>
            </div>
          </div>
        </section>

        <p className="text-center text-sm text-slate-600">
          For more information, read the <Link href="/privacy" className="font-semibold text-emerald-700 underline underline-offset-4">ManawMart Privacy Policy</Link>.
        </p>
      </main>
    </div>
  );
}
