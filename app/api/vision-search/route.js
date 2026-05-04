import { NextResponse } from "next/server";
import connectDB from "../../lib/mongodb";
import Item from "../../models/Item";
import { mapLabelsToCategory } from "../../lib/visionCategoryMap";

const MAX_LABELS = 5;

export async function POST(req) {
  try {
    const apiKey = process.env.GOOGLE_VISION_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ success: false, message: "Vision API key is not configured" }, { status: 500 });
    }

    const formData = await req.formData();
    const imageFile = formData.get("image");

    if (!imageFile || typeof imageFile === "string") {
      return NextResponse.json({ success: false, message: "Image is required" }, { status: 400 });
    }

    const buffer = Buffer.from(await imageFile.arrayBuffer());
    const base64Image = buffer.toString("base64");

    const visionRes = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "LABEL_DETECTION", maxResults: MAX_LABELS }],
          },
        ],
      }),
    });

    if (!visionRes.ok) {
      const errorText = await visionRes.text();
      console.error("Google Vision API error:", errorText);
      return NextResponse.json({ success: false, message: "Vision API request failed" }, { status: 502 });
    }

    const visionData = await visionRes.json();
    const labels = (visionData?.responses?.[0]?.labelAnnotations || [])
      .map((entry) => entry?.description)
      .filter(Boolean)
      .slice(0, MAX_LABELS);

    const mappedCategory = mapLabelsToCategory(labels);

    await connectDB();

    const products = mappedCategory
      ? await Item.find({ type: "product", isAvailable: true, category: mappedCategory })
          .limit(16)
          .populate("shopId", "name")
          .lean()
      : [];

    return NextResponse.json(
      {
        success: true,
        data: {
          labels,
          mappedCategory,
          products,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/vision-search error:", error);
    return NextResponse.json({ success: false, message: "Vision search failed" }, { status: 500 });
  }
}
