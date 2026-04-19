import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("delivery-and-refund-policy", {
    title: "Delivery & Refund Policy | Pretty Petals",
    description:
      "Learn about Pretty Petals delivery timelines, refund process, cancellation policy, and substitution guidelines.",
  });
}

export default function DeliveryAndRefundPolicyPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Delivery &amp; Refund Policy</h1>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <a href="/" className="hover:text-white/80 transition-colors">Home</a>
            <span>/</span>
            <span className="text-white/80">Delivery &amp; Refund Policy</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="w-full prose-container">

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Delivery Time</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Pretty Petals is generally unable to guarantee a specific delivery time. Delivery varies based on personnel schedules, though morning or afternoon delivery may sometimes be available.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Late Deliveries</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Full refunds apply if Pretty Petals cannot deliver on the selected date due to circumstances within their control. No refund is issued for delays caused by external factors like recipient unavailability or incorrect addresses provided by customers.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Incorrect Delivery Information</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Customers may adjust delivery information up to two business days before delivery. If wrong address information causes delivery failure, no refund will be issued, and Pretty Petals bears no liability.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Undeliverable Locations</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Pretty Petals attempts delivery per facility procedures but cannot guarantee success at hospitals or ICUs, which often restrict flower delivery. Pretty Petals cannot issue a refund if unable to make a delivery due to these issues.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Refused Deliveries</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Recipients refusing delivery are ineligible for refunds.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Products and Images</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Arrangements contain only listed items. Vases are display-only unless specified. Product photos of Flower Bouquets always represent the medium size and may vary slightly.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Refund Requests</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Unsatisfactory orders require claims within two business days post-delivery. Quality issues need photographic documentation. Refund requests can take up to 5-6 business days to reflect in the bank account.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Order Changes</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Contact{" "}
              <a href="mailto:support@prettypetals.com" className="text-[#737530] font-medium hover:underline">support@prettypetals.com</a>{" "}
              to modify orders at least two business days before delivery.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Quality Policy</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Handmade arrangements vary naturally. Every effort is made to match orders as closely as possible to the product photos and descriptions.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Cancellations</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Full refunds allowed if cancelled two or more business days before delivery. Less than one business day notice results in no refund.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Duplicate Orders</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Full refunds issued for duplicate orders if the florist hasn&apos;t completed production.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Substitution Policy</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Local florists may substitute unavailable items with equal or greater value products. Roses are never substituted without explicit customer confirmation.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
