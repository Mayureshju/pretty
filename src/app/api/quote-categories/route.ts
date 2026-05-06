import { connectDB } from "@/lib/db";
import QuoteCategory from "@/models/QuoteCategory";

export async function GET() {
  try {
    await connectDB();

    const categories = await QuoteCategory.find({ isActive: true })
      .select("name slug color order")
      .sort({ order: 1, name: 1 })
      .lean();

    return Response.json({ categories });
  } catch (err) {
    console.error("GET /api/quote-categories error:", err);
    return Response.json(
      { error: "Failed to fetch quote categories" },
      { status: 500 }
    );
  }
}
