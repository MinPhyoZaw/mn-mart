import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://yypxmsjyzplvtnkmnvgp.supabase.co";

const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_ANON_KEY is missing."
  );
}

export const ITEM_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_ITEM_IMAGE_BUCKET ||
  "mn-mart-image";

export const RECEIPT_IMAGE_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_RECEIPT_IMAGE_BUCKET ||
  "receipt-upload";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

const sanitizeStorageSegment = (value) =>
  String(value || "items")
    .trim()
    .replace(/[^a-zA-Z0-9/_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-/]+|[-/]+$/g, "") || "items";

const createImagePath = (folder, file) => {
  const cleanFolder =
    sanitizeStorageSegment(folder);

  const extension =
    file?.type
      ?.split("/")?.[1]
      ?.replace("jpeg", "jpg") || "webp";

  const uniqueId =
    typeof crypto !== "undefined" &&
    crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  return `${cleanFolder}/${uniqueId}.${extension}`;
};

export const uploadImageToSupabaseStorage =
  async (file, options = {}) => {
    if (!file) {
      throw new Error(
        "Please select an image before uploading."
      );
    }

    const bucket =
      options.bucket || ITEM_IMAGE_BUCKET;

    const path = createImagePath(
      options.folder || "items",
      file
    );

    console.log("Uploading to bucket:", bucket);
    console.log("Uploading path:", path);

    const { data, error } =
      await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: "3600",
          contentType:
            file.type || "image/webp",
          upsert: false,
        });

    if (error) {
      console.error(
        "SUPABASE UPLOAD ERROR:",
        error
      );

      throw new Error(
        error.message ||
          "Failed to upload image to Supabase."
      );
    }

    const { data: publicUrlData } =
      supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      throw new Error(
        "Supabase did not return an image URL."
      );
    }

    console.log(
      "Uploaded image URL:",
      publicUrlData.publicUrl
    );

    return publicUrlData.publicUrl;
  };