import type { Metadata } from "next";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import Blog from "@/models/Blog";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("blog", {
    title: "Blog | Pretty Petals",
    description:
      "Read the latest tips on flower care, gifting ideas, and floral inspiration from Pretty Petals, Mumbai's trusted florist.",
  });
}

export const revalidate = 3600;

export default async function BlogListingPage() {
  await connectDB();
  const blogs = await Blog.find({ isPublished: true })
    .select("title slug excerpt image createdAt")
    .sort({ createdAt: -1 })
    .lean();

  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Blog</h1>
          <p className="text-sm md:text-base text-white/60 mt-2">
            Tips, inspiration, and stories from our florists
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">
              Home
            </Link>
            <span>/</span>
            <span className="text-white/80">Blog</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        {blogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-lg text-[#939393]">No blog posts yet. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {blogs.map((blog) => (
              <Link
                key={String(blog._id)}
                href={`/${blog.slug}`}
                className="group rounded-xl border border-[#E8E8E8] overflow-hidden block hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow"
              >
                <div className="aspect-[16/9] overflow-hidden">
                  <img
                    src={blog.image || "/images/blog/placeholder.jpg"}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-[14px] font-semibold text-[#1C2120] leading-snug line-clamp-2 group-hover:text-[#737530] transition-colors">
                    {blog.title}
                  </h3>
                  <p className="mt-1.5 text-[12px] text-[#939393] leading-relaxed line-clamp-2">
                    {blog.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[13px] font-medium text-[#737530]">
                      Read More &rarr;
                    </span>
                    <time className="text-[11px] text-[#B0B0B0]">
                      {new Date(blog.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </time>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
