"use client";

const footerLinks = {
  column1: [
    { label: "About Us", href: "/about-us" },
    { label: "Sell With Us", href: "/sell-with-us" },
    { label: "Coupons & Deals", href: "/coupon-deals" },
    { label: "Cancellation & Refund", href: "/cancellation-and-refund" },
    { label: "Terms and Conditions", href: "/termcondition" },
    { label: "Retail Stores", href: "/retail-stores" },
    { label: "Career", href: "/career-page" },
  ],
  column2: [
    { label: "Media", href: "/show-media" },
    { label: "Privacy Policy", href: "/privacy-page" },
    { label: "Reviews", href: "/reviews" },
    { label: "Blog", href: "/blog" },
    { label: "Sitemap", href: "/sitemap.html" },
    { label: "Quotes", href: "/quotes" },
  ],
  column3: [
    { label: "Corporate Gifts", href: "/corporate-gifts" },
    { label: "Franchise", href: "/franchise" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact Us", href: "/contact-us" },
    { label: "Download App", href: "/download-app" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-6 md:mt-8 bg-[#f8f8f8]">
      <div className="max-w-[1320px] mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8">
          {/* Column 1 */}
          <ul className="space-y-2.5">
            {footerLinks.column1.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-[13px] text-[#464646] hover:text-[#0E4D65] transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Column 2 */}
          <ul className="space-y-2.5">
            {footerLinks.column2.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-[13px] text-[#464646] hover:text-[#0E4D65] transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Column 3 */}
          <ul className="space-y-2.5">
            {footerLinks.column3.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-[13px] text-[#464646] hover:text-[#0E4D65] transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* App Download & Social */}
          <div className="col-span-2">
            <p className="text-sm font-medium text-[#1C2120] mb-3">
              Simplify your gifting experience with our app.
            </p>

            {/* App Store Buttons */}
            <div className="flex gap-3 mb-5">
              <div className="flex items-center gap-2 bg-black text-white rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-800 transition-colors">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.89 14.5L15.39 12L17.89 9.5L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" />
                </svg>
                <div>
                  <div className="text-[8px] uppercase tracking-wider opacity-80">Get it on</div>
                  <div className="text-[13px] font-medium -mt-0.5">Google Play</div>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-black text-white rounded-lg px-3 py-2 cursor-pointer hover:bg-gray-800 transition-colors">
                <svg width="16" height="18" viewBox="0 0 24 24" fill="white">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 16.56 2.93 11.3 4.7 7.72C5.57 5.94 7.36 4.86 9.28 4.84C10.56 4.81 11.78 5.72 12.56 5.72C13.34 5.72 14.83 4.62 16.39 4.8C17.07 4.83 18.94 5.09 20.13 6.86C20.04 6.92 17.77 8.27 17.8 11.06C17.83 14.36 20.67 15.45 20.7 15.46C20.67 15.55 20.23 17.09 19.12 18.68L18.71 19.5ZM13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" />
                </svg>
                <div>
                  <div className="text-[8px] uppercase tracking-wider opacity-80">Download on the</div>
                  <div className="text-[13px] font-medium -mt-0.5">App Store</div>
                </div>
              </div>
            </div>

            {/* Social Media */}
            <h3 className="text-sm font-semibold text-[#1C2120] mb-3">
              Spread The Love On Social Media
            </h3>
            <div className="flex gap-2.5 flex-wrap">
              {[
                { name: "Facebook", color: "#1877F2", path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" },
                { name: "Twitter", color: "#000", path: "M4 4l6.5 8L4 20h2l5-6 4 6h5l-6.8-8.5L20 4h-2l-4.6 5.5L9.5 4H4z" },
                { name: "YouTube", color: "#FF0000", path: "M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29.94 29.94 0 001 12a29.94 29.94 0 00.46 5.58 2.78 2.78 0 001.94 2C5.12 20 12 20 12 20s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29.94 29.94 0 0023 12a29.94 29.94 0 00-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" },
                { name: "Pinterest", color: "#E60023", path: "M12 2C6.477 2 2 6.477 2 12c0 4.236 2.636 7.855 6.356 9.312-.088-.791-.167-2.005.035-2.868.181-.78 1.172-4.97 1.172-4.97s-.299-.598-.299-1.482c0-1.388.806-2.425 1.808-2.425.853 0 1.265.64 1.265 1.408 0 .858-.546 2.14-.828 3.33-.236.995.499 1.806 1.481 1.806 1.778 0 3.144-1.874 3.144-4.58 0-2.393-1.72-4.068-4.177-4.068-2.845 0-4.515 2.135-4.515 4.34 0 .859.331 1.781.745 2.281a.3.3 0 01.069.288l-.278 1.133c-.044.183-.145.222-.335.134-1.249-.581-2.03-2.407-2.03-3.874 0-3.154 2.292-6.052 6.608-6.052 3.469 0 6.165 2.473 6.165 5.776 0 3.447-2.173 6.22-5.19 6.22-1.013 0-1.965-.527-2.291-1.148l-.623 2.378c-.226.869-.835 1.958-1.244 2.621.936.29 1.929.446 2.96.446 5.522 0 10-4.477 10-10S17.523 2 12 2z" },
                { name: "Instagram", color: "#E1306C", path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" },
                { name: "LinkedIn", color: "#0A66C2", path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" },
              ].map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                  style={{ backgroundColor: social.color }}
                  title={social.name}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#e5e7eb]">
        <div className="max-w-[1320px] mx-auto px-4 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#0E4D65] tracking-wider">
              FLOWER AURA
            </span>
            <span className="text-xs text-[#999]">
              Copyright. 2026. FA GIFTS PVT. LTD
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <span className="text-xs text-[#999] mr-1">We Accept:</span>
            {[
              { name: "Visa", bg: "#1A1F71" },
              { name: "MC", bg: "#EB001B" },
              { name: "Amex", bg: "#006FCF" },
              { name: "UPI", bg: "#4CAF50" },
              { name: "PayPal", bg: "#003087" },
              { name: "Paytm", bg: "#00BAF2" },
            ].map((pay) => (
              <span
                key={pay.name}
                className="text-[10px] bg-white border border-gray-200 rounded px-2 py-0.5 text-[#666] font-semibold"
              >
                {pay.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
