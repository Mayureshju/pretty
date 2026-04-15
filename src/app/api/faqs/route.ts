import { connectDB } from "@/lib/db";
import FAQ from "@/models/FAQ";

export async function GET() {
  try {
    await connectDB();

    const faqs = await FAQ.find({ isActive: true })
      .select("question answer category order")
      .sort({ category: 1, order: 1 })
      .lean();

    return Response.json({ faqs });
  } catch (err) {
    console.error("GET /api/faqs error:", err);
    return Response.json({ error: "Failed to fetch FAQs" }, { status: 500 });
  }
}
