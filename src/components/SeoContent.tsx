"use client";

import { useState } from "react";

export default function SeoContent() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="max-w-[1440px] mx-auto px-4 py-6 md:py-8">
      <h1 className="text-base md:text-lg font-semibold text-[#1C2120] mb-3">
        Pretty Petals: Send Flowers, Cakes, Gifts &amp; Plants Online Across India
      </h1>
      <div className={`text-[13px] md:text-sm text-[#464646] leading-relaxed text-justify ${!expanded ? "line-clamp-4" : ""}`}>
        <p>
          At Pretty Petals, we take pride in delivering the highest quality flowers, cakes, plants, and gifts to your loved ones. Our diverse range ensures there&apos;s something perfect for every occasion. From romantic roses to delightful chocolate cakes and vibrant indoor plants, we have it all. As India&apos;s most trusted gifting brand, we guarantee fresh and beautiful flowers, delicious cakes, vibrant plants, and unique gifts that bring joy and smiles. Enjoy the convenience of doorstep delivery with our safe and secure packaging, ensuring your order arrives in pristine condition.
        </p>
        {expanded && (
          <>
            <p className="mt-3">
              <strong>Flowers</strong>: At Pretty Petals, we offer a stunning range of flower bouquets and arrangements. Choose from a variety of flowers like roses, carnations, sunflowers, orchids, and gerberas. Our reliable flower delivery in India service ensures your flowers are handled with care and arrive fresh and beautiful.
            </p>
            <p className="mt-3">
              <strong>Cakes</strong>: Our freshly baked &amp; delicious cakes are FSSAI-certified, ensuring safety and quality. We offer a wide range of flavours, such as chocolate, black forest, red velvet, tiramisu, and various cake types, including designer cakes, theme cakes, photo cakes, and bento cakes.
            </p>
            <p className="mt-3">
              <strong>Plants</strong>: We understand the need of plants for home and offer an extensive range of plants to brighten your indoor spaces. Our plants come potted in beautiful planters that add a touch of elegance to any space.
            </p>
            <p className="mt-3">
              <strong>Gifts</strong>: Finding new and trendy gift ideas can be challenging, but we cater to that need with an amazing gift range including home decor, jewellery, showpieces, candles, soft toys, and perfumes.
            </p>
          </>
        )}
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-sm font-medium mt-2 cursor-pointer text-[#737530] hover:underline"
      >
        {expanded ? "Read Less" : "Read More"}
      </button>
    </section>
  );
}
