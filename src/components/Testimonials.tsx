"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    id: 1,
    text: "Awesome flowers and beautifully arranged. Had ordered for my Gurumaa and she appreciated the thoughtful collection. God bless each of you in sourcing, putting all together and delivering it. Thank you",
    name: "Sanjay Diwan",
    rating: 5,
    date: "24/01/2026",
  },
  {
    id: 2,
    text: "Thanks a lot to FlowerAura for making my moms birthday special she was very happy thanks a lot",
    name: "Aaditya Singhal",
    rating: 5,
    date: "14/01/2026",
  },
  {
    id: 3,
    text: "This cake was much better than I had imagined. It was very fresh and tasted great. Thank you Flower Aura.",
    name: "Samiksha",
    rating: 5,
    date: "09/01/2026",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill={star <= rating ? "#FDCB6E" : "#E5E7EB"}
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 30, rotateX: 8 },
      {
        opacity: 1,
        y: 0,
        rotateX: 0,
        duration: 0.6,
        stagger: 0.12,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1320px] mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <h2 className="text-xl md:text-2xl font-semibold text-[#1C2120]">
          Customer Testimonial
        </h2>
        <a
          href="/reviews"
          className="px-5 py-2 text-sm font-medium border-2 border-[#0E4D65] text-[#0E4D65] rounded-lg transition-colors hover:bg-[#0E4D65] hover:text-white"
        >
          View All
        </a>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6" style={{ perspective: "800px" }}>
        {testimonials.map((testimonial, i) => (
          <div
            key={testimonial.id}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="relative bg-white rounded-xl border border-[#eee] p-5 md:p-6 transition-all duration-300 hover:shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
          >
            {/* Quote mark */}
            <div className="text-4xl text-[#0E4D65]/15 leading-none mb-2 font-serif">&ldquo;</div>

            {/* Review text */}
            <p className="text-[13px] md:text-sm text-[#464646] leading-relaxed mb-4 line-clamp-4">
              {testimonial.text}
            </p>

            {/* Stars */}
            <StarRating rating={testimonial.rating} />

            {/* Author */}
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#0E4D65]/10 flex items-center justify-center text-xs font-bold text-[#0E4D65]">
                  {testimonial.name.charAt(0)}
                </div>
                <span className="text-sm font-semibold text-[#1C2120]">
                  {testimonial.name}
                </span>
              </div>
              <span className="text-[11px] text-[#999]">
                {testimonial.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
