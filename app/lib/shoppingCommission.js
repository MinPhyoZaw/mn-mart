import CommissionSetting from "../models/CommissionSetting";

export const DEFAULT_SHOPPING_COMMISSION_RATE = 1.5;

export async function getShoppingCommissionRate() {
  const setting = await CommissionSetting.findOne({ serviceType: "shopping" }).lean();
  const rate = Number(setting?.rate);
  return Number.isFinite(rate) && rate >= 0 ? rate : DEFAULT_SHOPPING_COMMISSION_RATE;
}
