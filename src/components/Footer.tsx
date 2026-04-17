"use client";

const footerLinks = {
  column1: [
    { label: "About Us", href: "/about-us" },
    { label: "Delivery & Refund Policy", href: "/delivery-and-refund-policy" },
    { label: "Terms and Conditions", href: "/terms-and-conditions" },
    { label: "Privacy Policy", href: "/privacy-policy" },
  ],
  column2: [
    { label: "Blog", href: "/blog" },
    { label: "Quotes", href: "/quotes" },
    { label: "Coupons & Deals", href: "/offers" },
    { label: "Sitemap", href: "/sitemap.html" },
    { label: "Retail Stores", href: "https://share.google/aQtmjIlTnncsUqGmJ" },
  ],
  column3: [
    { label: "Corporate Gifts", href: "/corporate-gifts" },
    { label: "FAQ", href: "/faq" },
    { label: "Contact Us", href: "/contact-us" },
  ],
  deliveryCities: [
    { label: "Flowers in Mumbai", href: "/flowers/" },
    { label: "Flowers in Thane", href: "/send-flowers-thane/" },
    { label: "Flowers in Navi Mumbai", href: "/send-flowers-navi-mumbai/" },
  ],
};

export default function Footer() {
  return (
    <footer className="mt-6 md:mt-8" style={{ backgroundColor: "var(--bg-section)" }}>
      <div className="max-w-[1440px] mx-auto px-4 py-8 md:py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-8">
          {/* Column 1 */}
          <ul className="space-y-2.5">
            {footerLinks.column1.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-[13px] text-[#464646] hover:text-[#737530] transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Column 2 */}
          <ul className="space-y-2.5">
            {footerLinks.column2.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-[13px] text-[#464646] hover:text-[#737530] transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>

          {/* Column 3 */}
          <ul className="space-y-2.5">
            {footerLinks.column3.map((link) => (
              <li key={link.label}>
                <a href={link.href} className="text-[13px] text-[#464646] hover:text-[#737530] transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
            {/* Delivery Cities */}
            <li className="pt-3">
              <p className="text-xs font-semibold text-[#1C2120] uppercase tracking-wider mb-2">Delivery Cities</p>
              <ul className="space-y-2">
                {footerLinks.deliveryCities.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-[13px] text-[#464646] hover:text-[#737530] transition-colors">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </li>
          </ul>

          {/* Brand & Social */}
          <div className="col-span-2">
            {/* Pretty Petals Logo */}
            <a href="/" className="inline-block mb-5">
              <img src="/logo11.webp" alt="Pretty Petals" className="h-12 md:h-14 w-auto" />
            </a>
            <p className="text-[13px] text-[#555] leading-relaxed mb-5 max-w-xs">
              Mumbai&apos;s trusted florist for same-day flower delivery. Fresh blooms, handcrafted bouquets, and meaningful gifting.
            </p>

            {/* Social Media */}
            <h3 className="text-sm font-semibold text-[#1C2120] mb-3">
              Spread The Love On Social Media
            </h3>
            <div className="flex gap-2.5 flex-wrap">
              {[
                {
                  name: "Facebook",
                  color: "#1877F2",
                  href: "https://www.facebook.com/prettypetalsmumbai/",
                  path: "M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z",
                },
                {
                  name: "Instagram",
                  color: "#E1306C",
                  href: "https://www.instagram.com/prettypetalsmumbai/",
                  path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
                },
                {
                  name: "WhatsApp",
                  color: "#25D366",
                  href: "https://api.whatsapp.com/send?phone=919833100194",
                  path: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
                },
              ].map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-transform hover:scale-110"
                  style={{ backgroundColor: social.color }}
                  title={social.name}
                  aria-label={social.name}
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
        <div className="max-w-[1440px] mx-auto px-4 py-3 md:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#737530] tracking-wider">
              PRETTY PETALS
            </span>
            <span className="text-xs text-[#999]">
              Copyright. 2026. Pretty Petals Pvt. Ltd.
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
