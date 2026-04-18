"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useUser, useClerk, UserButton, Show } from "@clerk/nextjs";
import { getCartCount } from "@/lib/cart";
import { getWishlist } from "@/lib/wishlist";

const searchTerms = ["flowers", "cakes", "plants", "gifts", "combos"];

function MobileSignOutButton() {
  const { signOut } = useClerk();
  return (
    <button
      onClick={() => signOut({ redirectUrl: "/" })}
      className="block w-full text-left py-3 text-sm text-[#464646] border-b border-gray-50 hover:text-[#737530] transition-colors cursor-pointer"
    >
      Sign Out
    </button>
  );
}

export default function Header() {
  const [termIdx, setTermIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    setCartCount(getCartCount());
    setWishlistCount(getWishlist().length);
    const cartHandler = () => setCartCount(getCartCount());
    const wishlistHandler = () => setWishlistCount(getWishlist().length);
    window.addEventListener("cart-updated", cartHandler);
    window.addEventListener("wishlist-updated", wishlistHandler);
    return () => {
      window.removeEventListener("cart-updated", cartHandler);
      window.removeEventListener("wishlist-updated", wishlistHandler);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTermIdx((prev) => (prev + 1) % searchTerms.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100" style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div className="max-w-[1440px] mx-auto flex items-center justify-between px-4 h-[60px] md:h-[66px]">
          {/* Logo */}
          <a href="/" className="shrink-0">
            <Image
              src="/logo11.webp"
              alt="Pretty Petals"
              width={160}
              height={50}
              className="h-[38px] md:h-[44px] w-auto"
              priority
            />
          </a>

          {/* Search - desktop */}
          <form
            action="/search"
            method="get"
            role="search"
            className="flex-1 max-w-[420px] mx-4 hidden md:block"
          >
            <div className="flex items-center border border-gray-200 rounded-full px-4 py-2 bg-[#f8f8f8] focus-within:border-gray-300 focus-within:bg-white hover:border-gray-300 hover:bg-white transition-all">
              <input
                type="search"
                name="q"
                aria-label="Search products"
                placeholder={`Search for ${searchTerms[termIdx]}`}
                className="flex-1 bg-transparent outline-none text-[13px] text-[#1C2120] placeholder:text-[#999]"
              />
              <button
                type="submit"
                aria-label="Search"
                className="ml-2 shrink-0 cursor-pointer p-0.5 hover:opacity-70 transition-opacity"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                  <circle cx="11" cy="11" r="8" />
                  <path d="M21 21l-4.35-4.35" />
                </svg>
              </button>
            </div>
          </form>

          {/* Right Icons */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Search icon - mobile */}
            <a href="/search" aria-label="Search" className="md:hidden p-1.5 cursor-pointer">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </a>

            <a href="/cart" className="flex flex-col items-center gap-0.5 cursor-pointer group min-w-[36px] relative">
              <div className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="1.5" className="group-hover:stroke-[#737530] transition-colors">
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <path d="M3 6h18" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                {cartCount > 0 && <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold text-white rounded-full w-[16px] h-[16px] flex items-center justify-center bg-[#EA3761]">{cartCount}</span>}
              </div>
              <span className="text-[10px] text-[#464646] group-hover:text-[#737530] transition-colors hidden md:block">Cart</span>
            </a>

            <a href="/wishlist/" className="hidden md:flex flex-col items-center gap-0.5 cursor-pointer group min-w-[28px] relative">
              <div className="relative">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="1.5" className="group-hover:stroke-[#737530] transition-colors">
                  <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                </svg>
                {wishlistCount > 0 && <span className="absolute -top-1.5 -right-2 text-[9px] font-bold text-white rounded-full w-4 h-4 flex items-center justify-center bg-[#EA3761]">{wishlistCount}</span>}
              </div>
              <span className="text-[10px] text-[#464646] group-hover:text-[#737530] transition-colors">Wishlist</span>
            </a>

            <Show when="signed-in">
              <div className="hidden md:flex flex-col items-center gap-0.5 min-w-[36px]">
                <UserButton
                  appearance={{
                    elements: {
                      organizationSwitcherTrigger: { display: "none" },
                    },
                  }}
                />
              </div>
            </Show>
            <Show when="signed-out">
              <a href="/sign-in" className="hidden md:flex flex-col items-center gap-0.5 cursor-pointer group min-w-[36px]">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="1.5" className="group-hover:stroke-[#737530] transition-colors">
                  <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <span className="text-[10px] text-[#464646] group-hover:text-[#737530] transition-colors">Sign In</span>
              </a>
            </Show>

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

          </div>
        </div>

        {/* Mobile Search Bar */}
        <form action="/search" method="get" role="search" className="md:hidden px-4 pb-3">
          <div className="flex items-center border border-gray-200 rounded-full px-3 py-2 bg-[#f8f8f8] focus-within:bg-white focus-within:border-gray-300 transition-all">
            <button type="submit" aria-label="Search" className="shrink-0 mr-2 cursor-pointer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </button>
            <input
              type="search"
              name="q"
              aria-label="Search products"
              placeholder={`Search for ${searchTerms[termIdx]}`}
              className="flex-1 bg-transparent outline-none text-[13px] text-[#1C2120] placeholder:text-[#999]"
            />
          </div>
        </form>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-[280px] bg-white shadow-xl overflow-y-auto">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-semibold text-[#737530]">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 cursor-pointer">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#464646" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-4">
              <a href="/wishlist/" className="flex items-center gap-2 py-3 text-sm text-[#464646] border-b border-gray-50 hover:text-[#737530] transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" /></svg>
                Wishlist {wishlistCount > 0 && <span className="text-[10px] font-bold text-white bg-[#EA3761] rounded-full w-4 h-4 flex items-center justify-center">{wishlistCount}</span>}
              </a>
              <a href="/trackorder" className="block py-3 text-sm text-[#464646] border-b border-gray-50 hover:text-[#737530] transition-colors">Track Order</a>
              <Show when="signed-in">
                <a href="/account" className="block py-3 text-sm text-[#464646] border-b border-gray-50 hover:text-[#737530] transition-colors">My Account</a>
                <MobileSignOutButton />
              </Show>
              <Show when="signed-out">
                <a href="/sign-in" className="block py-3 text-sm text-[#464646] border-b border-gray-50 hover:text-[#737530] transition-colors">Sign In</a>
              </Show>
              {[
                { label: "Flowers", href: "/flowers/" },
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
                  className="block py-3 text-sm text-[#464646] border-b border-gray-50 hover:text-[#737530] transition-colors"
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
