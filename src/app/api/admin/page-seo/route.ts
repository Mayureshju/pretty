import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import PageSeo from "@/models/PageSeo";
import { STATIC_PAGES } from "@/lib/seo";

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    // Ensure all static pages have a record
    const existing = await PageSeo.find().lean();
    const existingSlugs = new Set(existing.map((e) => e.pageSlug));

    const toInsert = STATIC_PAGES.filter(
      (p) => !existingSlugs.has(p.pageSlug)
    ).map((p) => ({
      pageSlug: p.pageSlug,
      pageLabel: p.pageLabel,
      metaTitle: "",
      metaDescription: "",
      ogTitle: "",
      ogDescription: "",
    }));

    if (toInsert.length > 0) {
      await PageSeo.insertMany(toInsert);
    }

    const pages = await PageSeo.find()
      .sort({ pageSlug: 1 })
      .lean();

    return Response.json({ pages });
  } catch (err) {
    console.error("GET /api/admin/page-seo error:", err);
    return errorResponse("Failed to fetch page SEO data");
  }
}
