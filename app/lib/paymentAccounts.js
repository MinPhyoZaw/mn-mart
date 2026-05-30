export const ADMIN_PAYMENT_ACCOUNTS = [
  { id: "kbzpay_1", label: "KBZ Pay (1)", number: "09-880000001", qr: "/images/payment/kbzpay-1.svg", theme: "yellow" },
  { id: "kbzpay_2", label: "KBZ Pay (2)", number: "09-880000002", qr: "/images/payment/kbzpay-2.svg", theme: "yellow" },
  { id: "mmqr_1", label: "MMQR (1)", number: "09-770000001", qr: "/images/payment/mmqr-1.svg", theme: "emerald" },
  { id: "mmqr_2", label: "MMQR (2)", number: "09-770000002", qr: "/images/payment/mmqr-2.svg", theme: "emerald" },
];

export const DEFAULT_PAYMENT_PROVIDER = ADMIN_PAYMENT_ACCOUNTS[0].id;
