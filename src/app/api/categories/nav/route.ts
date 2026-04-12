import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    await connectDB();

    const categories = await Category.find({ isActive: true })
      .select("name slug parent order productCount")
      .sort({ order: 1 })
      .lean();

    // Build parent-child map
    const parents = categories.filter((c) => !c.parent);
    const result = parents
      .filter((p) => p.productCount > 0 || categories.some((c) => c.parent?.toString() === p._id.toString()))
      .map((p) => ({
        _id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        productCount: p.productCount,
        children: categories
          .filter((c) => c.parent?.toString() === p._id.toString())
          .map((c) => ({
            _id: c._id.toString(),
            name: c.name,
            slug: c.slug,
            productCount: c.productCount,
          })),
      }));

    return Response.json(result, {
      headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=600" },
    });
  } catch (err) {
    console.error("GET /api/categories/nav error:", err);
    return Response.json([], { status: 500 });
  }
}
