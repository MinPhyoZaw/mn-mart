import connectDB from "../../lib/mongodb";
import Shop from "../../models/Shop";

export async function GET() {
	try {
		await connectDB();
		const shops = await Shop.find({}).lean();
		return new Response(JSON.stringify({ success: true, shops }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	} catch (error) {
		console.error("getShops error:", error);
		return new Response(
			JSON.stringify({ success: false, message: "Failed to fetch shops" }),
			{ status: 500, headers: { "Content-Type": "application/json" } }
		);
	}
}

