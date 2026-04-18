import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { connectDB } from "@/lib/db";
import Product from "@/models/Product";
import { getActiveSales, applyActiveSale } from "@/lib/sale-utils";

export const metadata: Metadata = {
  title: "Search | Pretty Petals",
  description: "Search flowers, cakes, gifts and more at Pretty Petals.",
  robots: { index: false, follow: true },
};

type Props = {
  searchParams: Promise<{ q?: string; page?: string }>;
};

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const PAGE_SIZE = 24;

export default async function SearchPage({ searchParams }: Props) {
  const sp = await searchParams;
  const q = (sp.q || "").trim();
  const page = Math.max(1, parseInt(sp.page || "1", 10));

  let products: Awaited<ReturnType<typeof fetchResults>>["products"] = [];
  let total = 0;

  if (q) {
    const result = await fetchResults(q, page);
    products = result.products;
    total = result.total;
  }

  const pages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="max-w-[1440px] mx-auto px-4 py-6 md:py-10">
      <form action="/search" method="get" role="search" className="max-w-[640px] mb-6">
        <div className="flex items-center border border-gray-200 rounded-full px-4 py-2.5 bg-[#f8f8f8] focus-within:bg-white focus-within:border-gray-300 transition-all">
          <input
            type="search"
            name="q"
            defaultValue={q}
            autoFocus
            aria-label="Search products"
            placeholder="Search for flowers, cakes, gifts..."
            className="flex-1 bg-transparent outline-none text-sm text-[#1C2120] placeholder:text-[#999]"
          />
          <button type="submit" aria-label="Search" className="ml-2 shrink-0 cursor-pointer p-0.5 hover:opacity-70 transition-opacity">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </button>
        </div>
      </form>

      {q ? (
        <>
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1C2120] mb-1">
            Search results for &ldquo;{q}&rdquo;
          </h1>
          <p className="text-[13px] text-[#666] mb-6">
            {total === 0
              ? "No products found."
              : `${total} product${total === 1 ? "" : "s"} found`}
          </p>

          {products.length > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                {products.map((p) => {
                  const effectivePrice = p._saleInfo?.effectivePrice ?? p.pricing.currentPrice;
                  const discountPercent =
                    p._saleInfo?.discountPercent ??
                    (p.pricing.salePrice
                      ? Math.round(
                          ((p.pricing.regularPrice - p.pricing.currentPrice) / p.pricing.regularPrice) * 100
                        )
                      : 0);
                  const mainImage = p.images?.[0]?.url || "/images/products/placeholder.jpg";
                  return (
                    <Link
                      key={p._id}
                      href={`/product/${p.slug}/`}
                      className="group relative bg-white rounded-xl overflow-hidden border border-[var(--border-card)] hover:border-[var(--accent-sage)] transition-all duration-300 hover:-translate-y-1"
                      style={{ boxShadow: "var(--shadow-card)" }}
                    >
                      {discountPercent > 0 && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="block px-1.5 py-[3px] text-[10px] font-bold bg-[var(--accent-rose)] text-white rounded-[4px] leading-none shadow-sm">
                            -{discountPercent}%
                          </span>
                        </div>
                      )}
                      <div className="relative w-full aspect-[4/5] overflow-hidden bg-[var(--bg-lighter)]">
                        <Image
                          src={mainImage}
                          alt={p.images?.[0]?.alt || p.name}
                          fill
                          unoptimized
                          className="object-cover transition-transform duration-500 group-hover:scale-[1.05]"
                          sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
                          loading="lazy"
                        />
                      </div>
                      <div className="px-3 pt-3 pb-3.5 md:px-3.5 md:pt-3.5 md:pb-4 flex flex-col gap-1.5">
                        <h3 className="text-[12.5px] md:text-[13px] font-medium text-[var(--text-dark)] leading-[1.4] line-clamp-2 min-h-[36px] group-hover:text-[var(--primary)] transition-colors">
                          {p.name}
                        </h3>
                        <div className="flex items-baseline gap-1.5 flex-wrap">
                          <span className="text-[15px] md:text-base font-bold text-[var(--text-dark)] tracking-tight">
                            &#8377;{effectivePrice.toLocaleString()}
                          </span>
                          {discountPercent > 0 && (
                            <span className="text-[11px] text-[var(--text-light)] line-through">
                              &#8377;{p.pricing.regularPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {pages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-10" aria-label="Pagination">
                  {page > 1 && (
                    <Link
                      href={`/search?q=${encodeURIComponent(q)}&page=${page - 1}`}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      Previous
                    </Link>
                  )}
                  <span className="px-4 py-2 text-sm text-[#666]">
                    Page {page} of {pages}
                  </span>
                  {page < pages && (
                    <Link
                      href={`/search?q=${encodeURIComponent(q)}&page=${page + 1}`}
                      className="px-4 py-2 text-sm border border-gray-200 rounded-full hover:bg-gray-50 transition-colors"
                    >
                      Next
                    </Link>
                  )}
                </nav>
              )}
            </>
          ) : (
            <div className="py-16 text-center">
              <p className="text-[15px] text-[#666] mb-2">
                We couldn&rsquo;t find anything matching &ldquo;{q}&rdquo;.
              </p>
              <p className="text-[13px] text-[#999]">
                Try a different keyword or browse our <Link href="/flowers/" className="text-[#737530] underline">flowers</Link>,{" "}
                <Link href="/all-cakes" className="text-[#737530] underline">cakes</Link>, or{" "}
                <Link href="/gifts" className="text-[#737530] underline">gifts</Link>.
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="py-10">
          <h1 className="text-[20px] md:text-[24px] font-semibold text-[#1C2120] mb-2">Search</h1>
          <p className="text-[13px] text-[#666]">Type a keyword above to find flowers, cakes, gifts, and more.</p>
        </div>
      )}
    </main>
  );
}

type SearchProduct = {
  _id: string;
  name: string;
  slug: string;
  pricing: { regularPrice: number; salePrice?: number | null; currentPrice: number };
  images: { url: string; alt?: string; order: number }[];
  metrics: { ratingCount: number; averageRating: number; totalSales: number };
  isFeatured: boolean;
  categories?: unknown[];
  _saleInfo?: { effectivePrice: number; discountPercent: number; saleLabel: string | null } | null;
};

async function fetchResults(q: string, page: number): Promise<{ products: SearchProduct[]; total: number }> {
  await connectDB();

  const regex = new RegExp(escapeRegex(q), "i");
  const filter = {
    isActive: true,
    $or: [{ name: regex }, { shortDescription: regex }, { tags: regex }],
  };

  const skip = (page - 1) * PAGE_SIZE;

  const [rawProducts, total, activeSales] = await Promise.all([
    Product.find(filter)
      .select("name slug pricing images metrics isFeatured categories")
      .sort({ "metrics.totalSales": -1, isFeatured: -1 })
      .skip(skip)
      .limit(PAGE_SIZE)
      .lean(),
    Product.countDocuments(filter),
    getActiveSales(),
  ]);

  const products: SearchProduct[] = rawProducts.map((p) => {
    const sale = applyActiveSale(
      { pricing: p.pricing, categories: p.categories?.map((c: unknown) => String(c)) },
      activeSales as Parameters<typeof applyActiveSale>[1]
    );
    return {
      ...JSON.parse(JSON.stringify(p)),
      _saleInfo: sale.hasSale
        ? { effectivePrice: sale.effectivePrice, discountPercent: sale.discountPercent, saleLabel: sale.saleLabel }
        : null,
    };
  });

  return { products, total };
}
