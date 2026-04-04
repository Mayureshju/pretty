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
    text: "Thanks a lot to Pretty Petals for making my moms birthday special she was very happy thanks a lot",
    name: "Aaditya Singhal",
    rating: 5,
    date: "14/01/2026",
  },
  {
    id: 3,
    text: "This cake was much better than I had imagined. It was very fresh and tasted great. Thank you Pretty Petals.",
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
      { opacity: 0, y: 24 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 78%" },
      }
    );

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1320px] mx-auto px-4 py-10 md:py-16">
      <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-5">
        What Our Customers Say
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
        {testimonials.map((testimonial, i) => (
          <div
            key={testimonial.id}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="bg-white rounded-xl border border-[#E8E8E8] p-5"
          >
            <StarRating rating={testimonial.rating} />

            <p className="mt-3 text-[14px] text-[#444] leading-relaxed line-clamp-4">
              {testimonial.text}
            </p>

            <div className="mt-4 flex items-center justify-between">
              <span className="text-[14px] font-semibold text-[#1C2120]">
                {testimonial.name}
              </span>
              <span className="text-[12px] text-[#939393]">
                {testimonial.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
