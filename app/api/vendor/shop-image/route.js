import { NextResponse } from "next/server";

import connectDB from "../../../lib/mongodb";
import { requireVendorAuth } from "../../../lib/routeAuth";
import {
  ITEM_IMAGE_BUCKET,
  removeImageFromSupabaseStorage,
  uploadImageToSupabaseStorage,
} from "../../../lib/supabase";
import Shop from "../../../models/Shop";

const MAX_UPLOAD_BYTES = 1024 * 1024;
const MAX_REQUEST_BYTES = MAX_UPLOAD_BYTES + 64 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasSupportedSignature(bytes, type) {
  if (type === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (type === "image/png") {
    return bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  }
  return (
    type === "image/webp" &&
    String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
    String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
  );
}

function getManagedShopImagePath(imageUrl, shopId) {
  if (!imageUrl) return null;

  try {
    const configuredHost = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yypxmsjyzplvtnkmnvgp.supabase.co").host;
    const parsed = new URL(imageUrl);
    const marker = `/storage/v1/object/public/${ITEM_IMAGE_BUCKET}/`;
    if (parsed.host !== configuredHost || !parsed.pathname.startsWith(marker)) return null;

    const path = decodeURIComponent(parsed.pathname.slice(marker.length));
    return path.startsWith(`shops/${shopId}/`) ? path : null;
  } catch {
    return null;
  }
}

export async function POST(req) {
  const auth = await requireVendorAuth(req);
  if (!auth.ok) return auth.response;
  if (auth.user.role !== "vendor") {
    return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
  }

  let uploadedPath = null;

  try {
    await connectDB();
    const currentShop = await Shop.findOne({ vendorId: auth.vendor._id }).select("_id image").lean();
    if (!currentShop) {
      return NextResponse.json({ success: false, message: "Vendor shop not found" }, { status: 404 });
    }

    const contentLength = Number(req.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_REQUEST_BYTES) {
      return NextResponse.json({ success: false, message: "Processed image must be 1 MB or less." }, { status: 413 });
    }

    const formData = await req.formData();
    const image = formData.get("image");
    if (!(image instanceof Blob)) {
      return NextResponse.json({ success: false, message: "Please select an image." }, { status: 400 });
    }
    if (!ALLOWED_TYPES.has(image.type)) {
      return NextResponse.json({ success: false, message: "Use a JPG, PNG, or WebP image." }, { status: 400 });
    }
    if (image.size === 0 || image.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ success: false, message: "Processed image must be 1 MB or less." }, { status: 400 });
    }

    const signature = new Uint8Array(await image.slice(0, 12).arrayBuffer());
    if (!hasSupportedSignature(signature, image.type)) {
      return NextResponse.json({ success: false, message: "The selected file is not a valid supported image." }, { status: 400 });
    }

    const upload = await uploadImageToSupabaseStorage(image, {
      bucket: ITEM_IMAGE_BUCKET,
      folder: `shops/${currentShop._id}`,
      includePath: true,
    });
    uploadedPath = upload.path;

    const shop = await Shop.findOneAndUpdate(
      { _id: currentShop._id, vendorId: auth.vendor._id },
      { $set: { image: upload.publicUrl } },
      { new: true, runValidators: true },
    ).lean();

    if (!shop) throw new Error("Shop update failed");

    const oldPath = getManagedShopImagePath(currentShop.image, currentShop._id.toString());
    if (oldPath && oldPath !== uploadedPath) {
      try {
        await removeImageFromSupabaseStorage(ITEM_IMAGE_BUCKET, oldPath);
      } catch (error) {
        console.error("Unable to remove replaced shop image:", error);
      }
    }

    return NextResponse.json({ success: true, data: { shop } });
  } catch (error) {
    if (uploadedPath) {
      try {
        await removeImageFromSupabaseStorage(ITEM_IMAGE_BUCKET, uploadedPath);
      } catch (cleanupError) {
        console.error("Unable to clean up unused shop image:", cleanupError);
      }
    }
    console.error("POST /api/vendor/shop-image error:", error);
    return NextResponse.json({ success: false, message: "Unable to update shop image." }, { status: 500 });
  }
}
