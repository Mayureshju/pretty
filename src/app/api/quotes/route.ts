import { connectDB } from "@/lib/db";
import Quote from "@/models/Quote";

export async function GET() {
  try {
    await connectDB();

    const quotes = await Quote.find({ isActive: true })
      .select("text author category color order")
      .sort({ category: 1, order: 1 })
      .lean();

    return Response.json({ quotes });
  } catch (err) {
    console.error("GET /api/quotes error:", err);
    return Response.json({ error: "Failed to fetch quotes" }, { status: 500 });
  }
}
