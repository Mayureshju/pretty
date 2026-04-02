"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const blogs = [
  {
    id: 1,
    title: "The Ultimate Flower Guide for Mumbai: Popular Markets, Favourite Blooms & Gifting Tips",
    excerpt:
      "Mumbai moves fast. People are always on the go, plans change quickly, and celebrations often happen in the middle of a packed schedule. Yet, one thing never feels rushed here:",
    href: "#",
    image: "/images/blog/flower-guide.jpg",
  },
  {
    id: 2,
    title: "The Hidden Power of Colors: How Flower Color Influences Their Symbolic Meaning",
    excerpt:
      "Flowers have always been a symbol of beauty, nature, and love, but did you know that the meaning behind different flower colors is just as important? Each hue carries its",
    href: "#",
    image: "/images/blog/flower-colors.jpg",
  },
  {
    id: 3,
    title: "Why Marigolds are the Heart of Indian Festivals - Tradition, Symbolism & Science",
    excerpt:
      "The first thing you notice during Diwali is the glow. Diyas flicker. Rangoli colours burst across the floor. And everywhere you look, strings of bright orange and yellow marigolds frame",
    href: "#",
    image: "/images/blog/marigolds.jpg",
  },
];

export default function BlogSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    const cards = cardsRef.current.filter(Boolean);
    gsap.fromTo(
      cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1,
        y: 0,
        duration: 0.55,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%",
        },
      }
    );

    // Image zoom on hover
    cards.forEach((card) => {
      if (!card) return;
      const img = card.querySelector("img");
      if (!img) return;

      card.addEventListener("mouseenter", () => {
        gsap.to(img, { scale: 1.06, duration: 0.5, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(img, { scale: 1, duration: 0.5, ease: "power2.inOut" });
      });
    });

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  return (
    <section ref={sectionRef} className="max-w-[1320px] mx-auto px-4 py-6 md:py-10">
      <h2 className="text-xl md:text-2xl font-semibold text-[#1C2120] mb-5 md:mb-6">
        Related Blog
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-6">
        {blogs.map((blog, i) => (
          <a
            key={blog.id}
            href={blog.href}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="bg-white rounded-xl border border-[#eee] overflow-hidden transition-shadow hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] group block"
          >
            {/* Blog Image */}
            <div className="w-full h-[180px] md:h-[200px] overflow-hidden">
              <img
                src={blog.image}
                alt={blog.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Blog Content */}
            <div className="p-4">
              <h3 className="text-sm font-semibold text-[#1C2120] leading-snug mb-2 line-clamp-2 group-hover:text-[#0E4D65] transition-colors">
                {blog.title}
              </h3>
              <p className="text-xs text-[#888] leading-relaxed mb-3 line-clamp-3">
                {blog.excerpt}
              </p>
              <span className="text-xs font-medium text-[#0E4D65]">
                Read More...
              </span>
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
