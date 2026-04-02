"use client";

import { useState, useEffect } from "react";

const searchTerms = ["flowers", "cakes", "plants", "gifts", "combos"];

export default function Header() {
  const [termIdx, setTermIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTermIdx((prev) => (prev + 1) % searchTerms.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="max-w-[1320px] mx-auto flex items-center justify-between px-4 h-[60px] md:h-[66px]">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <svg width="36" height="36" viewBox="0 0 120 120" fill="none" className="md:w-[40px] md:h-[40px]">
              <ellipse cx="60" cy="28" rx="16" ry="22" fill="#C0392B" />
              <ellipse cx="60" cy="92" rx="16" ry="22" fill="#E74C3C" />
              <ellipse cx="28" cy="60" rx="22" ry="16" fill="#C0392B" />
              <ellipse cx="92" cy="60" rx="22" ry="16" fill="#E74C3C" />
              <ellipse cx="37" cy="37" rx="16" ry="22" fill="#E74C3C" transform="rotate(-45 37 37)" />
              <ellipse cx="83" cy="37" rx="16" ry="22" fill="#C0392B" transform="rotate(45 83 37)" />
              <ellipse cx="37" cy="83" rx="16" ry="22" fill="#C0392B" transform="rotate(45 37 83)" />
              <ellipse cx="83" cy="83" rx="16" ry="22" fill="#E74C3C" transform="rotate(-45 83 83)" />
              <circle cx="60" cy="60" r="14" fill="#F1C40F" />
              <circle cx="60" cy="60" r="6" fill="#E67E22" />
            </svg>
            <span className="text-[16px] md:text-[18px] font-bold tracking-[0.06em] uppercase" style={{ color: "#0E4D65" }}>
              Flower Aura
            </span>
          </a>

          {/* Location - desktop */}
          <div className="hidden md:flex items-center gap-1.5 ml-3 cursor-pointer border border-gray-200 rounded-full px-3 py-1.5 hover:border-gray-400 transition-colors">
            <span className="text-sm">🇮🇳</span>
            <span className="text-[13px] text-[#464646] truncate max-w-[70px]">Delhi...</span>
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1L5 5L9 1" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Search - desktop */}
          <div className="flex-1 max-w-[420px] mx-4 hidden md:block">
            <div className="flex items-center border border-gray-200 rounded-full px-4 py-2 bg-[#f8f8f8] hover:border-gray-300 hover:bg-white transition-all cursor-pointer">
              <span className="text-[13px] text-[#999]">Search for</span>
              <span className="text-[13px] font-medium text-[#1C2120] ml-1.5 animate-fadeIn" key={termIdx}>
                {searchTerms[termIdx]}
              </span>
              <svg className="ml-auto shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
          </div>

          {/* Right Icons */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search icon - mobile */}
            <button className="md:hidden p-1.5 cursor-pointer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>

            <a href="/trackorder" className="hidden md:flex flex-col items-center gap-0.5 cursor-pointer group min-w-[52px]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="1.5" className="group-hover:stroke-[#0E4D65] transition-colors">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M16 13H8M16 17H8M10 9H8" />
              </svg>
              <span className="text-[10px] text-[#464646] group-hover:text-[#0E4D65] transition-colors">Track Order</span>
            </a>

            <a href="/cart" className="flex flex-col items-center gap-0.5 cursor-pointer group min-w-[36px] relative">
              <div className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="1.5" className="group-hover:stroke-[#0E4D65] transition-colors">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold text-white rounded-full w-[16px] h-[16px] flex items-center justify-center bg-[#EA3761]">0</span>
              </div>
              <span className="text-[10px] text-[#464646] group-hover:text-[#0E4D65] transition-colors hidden md:block">Cart</span>
            </a>

            <div className="hidden md:flex flex-col items-center gap-0.5 cursor-pointer group min-w-[28px]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="1.5" className="group-hover:stroke-[#0E4D65] transition-colors">
                <circle cx="12" cy="12" r="10" />
                <path d="M7 9h10M7 12h6M9.5 15l3-6" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] text-[#464646] group-hover:text-[#0E4D65] transition-colors">INR</span>
            </div>

            <div className="hidden md:flex flex-col items-center gap-0.5 cursor-pointer group min-w-[36px]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="1.5" className="group-hover:stroke-[#0E4D65] transition-colors">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <span className="text-[10px] text-[#464646] group-hover:text-[#0E4D65] transition-colors">Sign In</span>
            </div>

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 cursor-pointer"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2" strokeLinecap="round">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>

            {/* Desktop more */}
            <div className="hidden md:flex flex-col items-center gap-0.5 cursor-pointer group min-w-[28px]">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2" className="group-hover:stroke-[#0E4D65] transition-colors">
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              </svg>
              <span className="text-[10px] text-[#464646] group-hover:text-[#0E4D65] transition-colors">More</span>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center border border-gray-200 rounded-full px-3 py-2 bg-[#f8f8f8]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round" className="shrink-0 mr-2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <span className="text-[13px] text-[#999]">Search for </span>
            <span className="text-[13px] font-medium text-[#1C2120] ml-1 animate-fadeIn" key={`m-${termIdx}`}>
              {searchTerms[termIdx]}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[280px] bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-[#0E4D65]">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-4">
              {[
                { label: "Track Order", href: "/trackorder" },
                { label: "Sign In", href: "#" },
                { label: "Flowers", href: "/all-flowers" },
                { label: "Cakes", href: "/all-cakes" },
                { label: "Combos", href: "/gift-hampers" },
                { label: "Birthday", href: "/birthday" },
                { label: "Anniversary", href: "/anniversary" },
                { label: "Gifts", href: "/gifts" },
                { label: "Personalised", href: "/personalised-gifts" },
                { label: "Plants", href: "/plants" },
                { label: "Chocolates", href: "/chocolates" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block py-3 text-sm text-[#464646] border-b border-gray-50 hover:text-[#0E4D65] transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
