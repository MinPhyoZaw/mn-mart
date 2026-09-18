import Image from "next/image";

const PAYMENT_QR = {
  label: "KBZPay",
  src: "/images/payment/kbzpay-2.jpg",
  width: 853,
  height: 1280,
};

export default function PaymentQrCard({ amount, className = "" }) {
  return (
    <div className={`mx-auto w-full max-w-sm ${className}`}>
      {typeof amount === "number" ? (
        <div className="mb-4 rounded-2xl bg-emerald-700 px-4 py-3 text-center text-white">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-100">
            Payment amount
          </p>
          <p className="mt-1 text-xl font-bold">
            {amount.toLocaleString()} MMK
          </p>
        </div>
      ) : null}

      <figure className="overflow-hidden rounded-3xl border border-emerald-200 bg-emerald-50/60 p-3 shadow-sm sm:p-4">
        <div className="rounded-2xl bg-white p-2 ring-1 ring-emerald-100 sm:p-3">
          <Image
            src={PAYMENT_QR.src}
            alt={`${PAYMENT_QR.label} payment QR code`}
            width={PAYMENT_QR.width}
            height={PAYMENT_QR.height}
            sizes="(max-width: 640px) calc(100vw - 72px), 352px"
            priority
            className="h-auto w-full"
          />
        </div>
        <figcaption className="px-2 pb-1 pt-3 text-center">
          <span className="block font-semibold text-emerald-900">
            Pay with {PAYMENT_QR.label}
          </span>
          <span className="mt-1 block text-xs leading-5 text-emerald-700">
            Scan the QR code, then upload your payment receipt.
          </span>
        </figcaption>
      </figure>
    </div>
  );
}
