import Shop from "../models/Shop";

export async function resolveVendorShop(auth, requestedShopId) {
  if (auth.user.role === "vendor") {
    return Shop.findOne({ vendorId: auth.vendor._id })
      .select("_id category vendorId")
      .lean();
  }

  if (!requestedShopId) return null;
  return Shop.findById(requestedShopId)
    .select("_id category vendorId")
    .lean();
}
