import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Flower Quotes & Wishes | Pretty Petals",
  description:
    "Beautiful flower quotes, love messages, birthday wishes, and anniversary messages. Find the perfect words to pair with your Pretty Petals bouquet.",
  alternates: { canonical: "https://www.prettypetals.com/quotes/" },
};

const quoteCategories = [
  {
    title: "Flower Quotes",
    color: "#737530",
    quotes: [
      { text: "Where flowers bloom, so does hope.", author: "Lady Bird Johnson" },
      { text: "Every flower is a soul blossoming in nature.", author: "Gerard De Nerval" },
      { text: "The earth laughs in flowers.", author: "Ralph Waldo Emerson" },
      { text: "A flower does not think of competing with the flower next to it. It just blooms.", author: "Zen Shin" },
      { text: "Flowers are the music of the ground. From earth\u2019s lips spoken without sound.", author: "Edwin Curran" },
      { text: "If we could see the miracle of a single flower clearly, our whole life would change.", author: "Buddha" },
    ],
  },
  {
    title: "Love & Romance",
    color: "#EA1E61",
    quotes: [
      { text: "I\u2019d rather have roses on my table than diamonds on my neck.", author: "Emma Goldman" },
      { text: "Love is the flower you\u2019ve got to let grow.", author: "John Lennon" },
      { text: "A flower cannot blossom without sunshine, and a man cannot live without love.", author: "Max Muller" },
      { text: "Love planted a rose, and the world turned sweet.", author: "Katharine Lee Bates" },
      { text: "The rose speaks of love silently, in a language known only to the heart.", author: "Unknown" },
      { text: "In joy or sadness, flowers are our constant friends.", author: "Kozuko Okakura" },
    ],
  },
  {
    title: "Birthday Wishes",
    color: "#E8A04C",
    quotes: [
      { text: "May your birthday bloom with happiness, just like a garden full of flowers.", author: "" },
      { text: "Wishing you a birthday as beautiful and vibrant as a fresh bouquet of roses.", author: "" },
      { text: "Another year older, another year more wonderful. Happy Birthday!", author: "" },
      { text: "May your special day be surrounded by the fragrance of love and joy.", author: "" },
      { text: "Like flowers that brighten any room, you brighten every life you touch. Happy Birthday!", author: "" },
      { text: "Sending you a bouquet of love and warm wishes on your birthday.", author: "" },
    ],
  },
  {
    title: "Anniversary Messages",
    color: "#C6A869",
    quotes: [
      { text: "Love grows more tremendously full, swift, poignant, as the years multiply.", author: "Zane Grey" },
      { text: "A successful marriage requires falling in love many times, always with the same person.", author: "Mignon McLaughlin" },
      { text: "The best thing to hold onto in life is each other. Happy Anniversary!", author: "Audrey Hepburn" },
      { text: "Together is a wonderful place to be. Cheers to another beautiful year!", author: "" },
      { text: "Your love story is my favorite. Wishing you a blooming anniversary!", author: "" },
      { text: "Like a garden tended with care, your love only grows more beautiful with time.", author: "" },
    ],
  },
  {
    title: "Get Well Soon",
    color: "#009D43",
    quotes: [
      { text: "Sending healing thoughts and a virtual bouquet to brighten your day.", author: "" },
      { text: "Flowers may not cure, but they can certainly make the heart smile. Get well soon!", author: "" },
      { text: "Wishing you a speedy recovery. May these flowers bring warmth and cheer.", author: "" },
      { text: "Rest, heal, and bloom again. We\u2019re rooting for you!", author: "" },
      { text: "A little sunshine and flowers to remind you that brighter days are ahead.", author: "" },
      { text: "Take your time to heal. Sending you love wrapped in petals.", author: "" },
    ],
  },
  {
    title: "Congratulations",
    color: "#006FCF",
    quotes: [
      { text: "Success is a flower that blooms from the seed of hard work. Congratulations!", author: "" },
      { text: "You did it! Celebrating your achievement with the brightest blooms.", author: "" },
      { text: "Every accomplishment starts with the decision to try. Well done!", author: "" },
      { text: "Here\u2019s to new beginnings and beautiful milestones. Congratulations!", author: "" },
      { text: "Your hard work has paid off beautifully. Time to stop and smell the roses!", author: "" },
      { text: "Like a flower reaching for the sun, you\u2019ve risen to the occasion. Bravo!", author: "" },
    ],
  },
];

export default function QuotesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Flower Quotes &amp; Wishes</h1>
          <p className="text-sm md:text-base text-white/60 mt-2">Find the perfect words to pair with your bouquet</p>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Quotes</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="space-y-12 md:space-y-16">
          {quoteCategories.map((category) => (
            <div key={category.title}>
              {/* Category Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-7 rounded-full" style={{ backgroundColor: category.color }} />
                <h2 className="text-xl md:text-2xl font-bold text-[#1C2120]">{category.title}</h2>
              </div>

              {/* Quotes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                {category.quotes.map((quote, i) => (
                  <div
                    key={i}
                    className="bg-white border border-[#EEEEEE] rounded-xl p-5 md:p-6 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] transition-shadow relative"
                  >
                    {/* Quote mark */}
                    <span
                      className="absolute top-3 right-4 text-4xl md:text-5xl font-serif leading-none opacity-10 select-none"
                      style={{ color: category.color }}
                    >
                      &ldquo;
                    </span>

                    <p className="text-[14px] md:text-[15px] text-[#444] leading-[1.8] relative z-10">
                      &ldquo;{quote.text}&rdquo;
                    </p>
                    {quote.author && (
                      <p className="mt-3 text-[13px] font-medium" style={{ color: category.color }}>
                        &mdash; {quote.author}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 bg-[#F7F8F1] rounded-2xl px-6 md:px-10 py-8 md:py-10 text-center">
          <h3 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-2">
            Pair Your Words With Fresh Flowers
          </h3>
          <p className="text-[14px] md:text-[15px] text-[#555] mb-5 max-w-lg mx-auto">
            Add a personalized message with any of these quotes when you order from Pretty Petals.
          </p>
          <Link
            href="/flowers/"
            className="inline-flex px-8 py-3.5 text-[14px] font-semibold text-white bg-[#737530] rounded-xl hover:bg-[#4C4D27] transition-colors"
          >
            Shop Flowers Now
          </Link>
        </div>
      </section>
    </main>
  );
}
