"use client";

import { useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

interface BlogItem {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
}

export default function BlogSection({ blogs }: { blogs: BlogItem[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<(HTMLAnchorElement | null)[]>([]);

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

  if (!blogs || blogs.length === 0) return null;

  return (
    <section ref={sectionRef} className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
      <h2 className="text-lg md:text-xl font-semibold text-[#1C2120] mb-5">
        From Our Blog
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
        {blogs.map((blog, i) => (
          <Link
            key={blog._id}
            href={`/blog/${blog.slug}`}
            ref={(el) => { cardsRef.current[i] = el; }}
            className="group rounded-xl border border-[#E8E8E8] overflow-hidden block"
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
              <span className="inline-block mt-3 text-[13px] font-medium text-[#737530]">
                Read More &rarr;
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
