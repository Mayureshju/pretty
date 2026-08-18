import Link from "next/link";

export default function NotFound() {
  return (
    <section className="max-w-[720px] mx-auto px-4 py-16 md:py-24 text-center">
      <p className="text-sm font-semibold tracking-wide text-[#737530] uppercase">
        404
      </p>
      <h1 className="mt-3 text-3xl md:text-4xl font-bold text-[#1C2120]">
        Page not found
      </h1>
      <p className="mt-3 text-[15px] text-[#939393] leading-relaxed">
        This link is gone or never existed. Search the shop or jump to a live
        collection.
      </p>

      <form
        action="/search/"
        method="get"
        role="search"
        className="mt-8 max-w-md mx-auto"
      >
        <div className="flex items-center border border-[#E0E0E0] rounded-full px-4 py-2.5 bg-[#f8f8f8] focus-within:border-[#737530] focus-within:bg-white">
          <input
            type="search"
            name="q"
            aria-label="Search products"
            placeholder="Search flowers, cakes, gifts"
            className="flex-1 bg-transparent outline-none text-[14px] text-[#1C2120] placeholder:text-[#999]"
          />
          <button
            type="submit"
            className="text-sm font-medium text-[#737530] hover:text-[#4C4D27] pl-3"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
        {[
          { label: "Flowers", href: "/flowers/" },
          { label: "Cakes", href: "/cakes/" },
          { label: "Gifts", href: "/gifts/" },
          { label: "Combos", href: "/combos-gifts/" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-[#737530] text-sm font-medium text-[#737530] hover:bg-[#737530] hover:text-white transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      <p className="mt-6">
        <Link
          href="/"
          className="text-sm font-medium text-[#1C2120] hover:text-[#737530] underline underline-offset-4"
        >
          Back to homepage
        </Link>
      </p>
    </section>
  );
}
