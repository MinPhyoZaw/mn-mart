import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Item from "../../models/Item";
import { mapLabelsToCategory } from "../../lib/visionCategoryMap";

const MAX_LABELS = 5;

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export async function POST(req) {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          message: "Vision API key is not configured",
        },
        {
          status: 500,
        }
      );
    }

    const formData = await req.formData();
    const imageFile = formData.get("image");

    if (!imageFile || typeof imageFile === "string") {
      return NextResponse.json(
        {
          success: false,
          message: "Image is required",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate MIME type before reading the file
     * into memory.
     */
    if (!ALLOWED_IMAGE_TYPES.has(imageFile.type)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Unsupported image type. Please upload JPG, PNG, or WEBP.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Reject empty images.
     */
    if (!imageFile.size || imageFile.size <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "The uploaded image is empty.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * IMPORTANT:
     * Reject oversized files BEFORE arrayBuffer().
     */
    if (imageFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          message: "Image must be 5 MB or smaller.",
        },
        {
          status: 413,
        }
      );
    }

    const buffer = Buffer.from(
      await imageFile.arrayBuffer()
    );

    const base64Image =
      buffer.toString("base64");

    /*
     * Google Vision request.
     */
    const visionRes = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                {
                  type: "LABEL_DETECTION",
                  maxResults: MAX_LABELS,
                },
              ],
            },
          ],
        }),
        cache: "no-store",
      }
    );

    if (!visionRes.ok) {
      const errorText =
        await visionRes.text();

      console.error(
        "Google Vision API error:",
        visionRes.status,
        errorText.slice(0, 500)
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Vision API request failed",
        },
        {
          status: 502,
        }
      );
    }

    const visionData =
      await visionRes.json();

    /*
     * Google may return an error inside the
     * successful API response body.
     */
    const visionError =
      visionData?.responses?.[0]?.error;

    if (visionError) {
      console.error(
        "Google Vision response error:",
        visionError
      );

      return NextResponse.json(
        {
          success: false,
          message:
            "Unable to analyze this image.",
        },
        {
          status: 502,
        }
      );
    }

    const labels = (
      visionData?.responses?.[0]
        ?.labelAnnotations || []
    )
      .map(
        (entry) =>
          entry?.description
      )
      .filter(Boolean)
      .slice(0, MAX_LABELS);

    const mappedCategory =
      mapLabelsToCategory(labels);

    /*
     * Don't hit MongoDB when Vision did not
     * map the image to a category.
     */
    if (!mappedCategory) {
      return NextResponse.json(
        {
          success: true,
          data: {
            labels,
            mappedCategory: null,
            products: [],
          },
        },
        {
          status: 200,
        }
      );
    }

    await connectDB();

    /*
     * Keep the result bounded.
     *
     * Explicit projection also prevents this
     * endpoint from accidentally returning large
     * item documents later.
     */
    const products = await Item.find({
      type: "product",
      isAvailable: true,
      category: mappedCategory,
    })
      .select(
        [
          "_id",
          "shopId",
          "name",
          "price",
          "retailPrice",
          "image",
          "category",
          "tagName",
          "isAvailable",
        ].join(" ")
      )
      .limit(16)
      .populate({
        path: "shopId",
        select: "_id name",
      })
      .lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          labels,
          mappedCategory,
          products,
        },
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/vision-search error:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Vision search failed",
      },
      {
        status: 500,
      }
    );
  }
}