"use client";

import { useRef, useEffect, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

export default function NewsletterCTA() {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!sectionRef.current || !contentRef.current) return;
    gsap.fromTo(
      contentRef.current.children,
      { opacity: 0, y: 16 },
      {
        opacity: 1,
        y: 0,
        duration: 0.45,
        stagger: 0.08,
        ease: "power2.out",
        scrollTrigger: { trigger: sectionRef.current, start: "top 82%" },
      }
    );
    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
    };
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section ref={sectionRef} className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
      <div className="bg-[#F7F8F1] rounded-xl px-4 py-10 md:py-14">
        <div className="max-w-md mx-auto text-center" ref={contentRef}>
          <h2 className="text-lg md:text-xl font-semibold text-[#1C2120]">
            Stay Updated
          </h2>
          <p className="text-sm text-[#939393] mt-2 mb-6">
            Get exclusive offers and flower care tips
          </p>

          {submitted ? (
            <div className="inline-flex items-center gap-2 text-sm font-medium text-[#737530] px-5 py-2.5 bg-[#737530]/10 rounded-full">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Thank you for subscribing!
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="flex-1 px-4 py-3 text-sm rounded-full border border-[#E0E0E0] bg-white text-[#1C2120] outline-none transition-colors focus:border-[#737530]"
              />
              <button
                type="submit"
                className="px-6 py-3 text-sm font-medium text-white bg-[#737530] rounded-full hover:bg-[#4C4D27] transition-colors shrink-0 cursor-pointer"
              >
                Subscribe
              </button>
            </form>
          )}

          <p className="text-[11px] text-[#939393] mt-4">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </div>
    </section>
  );
}
