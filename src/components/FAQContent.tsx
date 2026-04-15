"use client";

import { useState } from "react";
import Link from "next/link";

interface FAQItem {
  _id: string;
  question: string;
  answer: string;
  category: string;
}

interface FAQGroup {
  category: string;
  items: FAQItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
  General: "#737530",
  Delivery: "#009D43",
  Payment: "#006FCF",
  Orders: "#E8A04C",
  Products: "#EA1E61",
  Returns: "#C6A869",
};

export default function FAQContent({ groups }: { groups: FAQGroup[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  function toggle(id: string) {
    setOpenId(openId === id ? null : id);
  }

  return (
    <div>
      {groups.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-lg text-[#939393]">
            No FAQs available yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="space-y-10 md:space-y-14">
          {groups.map((group) => {
            const color = CATEGORY_COLORS[group.category] || "#737530";

            return (
              <div key={group.category}>
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-5">
                  <div
                    className="w-1 h-7 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <h2 className="text-xl md:text-2xl font-bold text-[#1C2120]">
                    {group.category}
                  </h2>
                </div>

                {/* Accordion */}
                <div className="space-y-2">
                  {group.items.map((faq) => {
                    const isOpen = openId === faq._id;

                    return (
                      <div
                        key={faq._id}
                        className="bg-white border border-[#EEEEEE] rounded-xl overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-shadow"
                      >
                        <button
                          onClick={() => toggle(faq._id)}
                          className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left"
                        >
                          <span className="text-[14px] md:text-[15px] font-medium text-[#1C2120] leading-snug">
                            {faq.question}
                          </span>
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`shrink-0 transition-transform duration-200 ${
                              isOpen ? "rotate-180" : ""
                            }`}
                          >
                            <polyline points="6 9 12 15 18 9" />
                          </svg>
                        </button>

                        {isOpen && (
                          <div className="px-5 pb-4 -mt-1">
                            <p className="text-[13px] md:text-[14px] text-[#555] leading-relaxed whitespace-pre-line">
                              {faq.answer}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      <div className="mt-14 bg-[#F7F8F1] rounded-2xl px-6 md:px-10 py-8 md:py-10 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-2">
          Still Have Questions?
        </h3>
        <p className="text-[14px] md:text-[15px] text-[#555] mb-5 max-w-lg mx-auto">
          Our team is happy to help. Reach out to us and we&apos;ll get back to you as soon as possible.
        </p>
        <Link
          href="/contact-us"
          className="inline-flex px-8 py-3.5 text-[14px] font-semibold text-white bg-[#737530] rounded-xl hover:bg-[#4C4D27] transition-colors"
        >
          Contact Us
        </Link>
      </div>
    </div>
  );
}
