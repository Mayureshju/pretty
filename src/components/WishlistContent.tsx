"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { getWishlist, removeFromWishlist } from "@/lib/wishlist";
import { addToCart } from "@/lib/cart";
import toast from "react-hot-toast";

interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  pricing: { regularPrice: number; salePrice?: number; currentPrice: number };
  images: { url: string; alt?: string }[];
  metrics: { averageRating: number; ratingCount: number };
}

export default function WishlistContent() {
  const [products, setProducts] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const ids = getWishlist();
      if (ids.length === 0) { setLoading(false); return; }

      try {
        const res = await fetch(`/api/products?ids=${ids.join(",")}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.products || []);
        }
      } catch { /* ignore */ }
      setLoading(false);
    }
    load();
  }, []);

  function handleRemove(id: string) {
    removeFromWishlist(id);
    setProducts((prev) => prev.filter((p) => p._id !== id));
    toast.success("Removed from wishlist");
  }

  function handleAddToCart(product: WishlistProduct) {
    addToCart({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      price: product.pricing.currentPrice,
      originalPrice: product.pricing.regularPrice,
      image: product.images?.[0]?.url || "/images/products/placeholder.jpg",
    });
    toast.success("Added to cart!");
  }

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-12">
        <h1 className="text-xl md:text-2xl font-semibold text-[#1C2120] mb-6">My Wishlist</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[4/5] bg-gray-100 rounded-xl" />
              <div className="h-4 bg-gray-100 rounded mt-3 w-3/4" />
              <div className="h-4 bg-gray-100 rounded mt-2 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-16 text-center">
        <div className="mb-4">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" className="mx-auto">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
        <h1 className="text-xl font-semibold text-[#1C2120]">Your wishlist is empty</h1>
        <p className="text-sm text-[#888] mt-2">Save your favorite items to see them here</p>
        <Link href="/" className="inline-block mt-6 px-6 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#4C4D27] transition-colors">
          Browse Products
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
      <h1 className="text-xl md:text-2xl font-semibold text-[#1C2120] mb-1">My Wishlist</h1>
      <p className="text-sm text-[#888] mb-6">{products.length} item{products.length !== 1 ? "s" : ""}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {products.map((product) => {
          const img = product.images?.[0]?.url || "/images/products/placeholder.jpg";
          const disc = product.pricing.salePrice
            ? Math.round(((product.pricing.regularPrice - product.pricing.salePrice) / product.pricing.regularPrice) * 100)
            : 0;

          return (
            <div key={product._id} className="relative bg-white rounded-xl overflow-hidden group" style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
              {/* Remove button */}
              <button onClick={() => handleRemove(product._id)}
                className="absolute top-2.5 right-2.5 z-10 bg-white/80 backdrop-blur-sm rounded-full p-1.5 hover:bg-red-50 transition-colors cursor-pointer">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              <Link href={`/product/${product.slug}/`} className="block">
                <div className="relative w-full aspect-[4/5] overflow-hidden bg-[#f5f5f5]">
                  <Image src={img} alt={product.name} fill unoptimized
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 20vw" loading="lazy" />
                </div>
              </Link>

              <div className="p-3">
                <Link href={`/product/${product.slug}/`}>
                  <h3 className="text-[13px] font-medium text-[#1C2120] leading-snug line-clamp-2 min-h-[34px]">{product.name}</h3>
                </Link>

                <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                  {disc > 0 && <span className="text-[11px] text-[#999] line-through">&#8377;{product.pricing.regularPrice.toLocaleString()}</span>}
                  <span className="text-sm font-bold text-[#1C2120]">&#8377;{product.pricing.currentPrice.toLocaleString()}</span>
                  {disc > 0 && <span className="text-[10px] font-semibold text-[#FFA500]">{disc}% OFF</span>}
                </div>

                {product.metrics.averageRating > 0 && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <span className="text-[11px]">&#9733;</span>
                    <span className="text-[11px] text-[#1C2120]">{product.metrics.averageRating}{product.metrics.ratingCount > 0 && ` | ${product.metrics.ratingCount}`}</span>
                  </div>
                )}

                <button onClick={() => handleAddToCart(product)}
                  className="w-full mt-2.5 py-2 text-xs font-semibold border border-[#737530] text-[#737530] rounded-lg hover:bg-[#737530] hover:text-white transition-colors cursor-pointer">
                  Add to Cart
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
