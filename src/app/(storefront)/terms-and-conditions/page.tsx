import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("terms-and-conditions", {
    title: "Terms and Conditions | Pretty Petals",
    description:
      "Read the Pretty Petals terms and conditions for online shopping, delivery, payment, cancellations, and more.",
  });
}

export default function TermsAndConditionsPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Terms and Conditions</h1>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <a href="/" className="hover:text-white/80 transition-colors">Home</a>
            <span>/</span>
            <span className="text-white/80">Terms and Conditions</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="w-full prose-container">

          <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-6">
            These online shopping terms and conditions apply to all orders that you, the customer, place using this website.
          </p>
          <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-6">
            By selecting the &ldquo;I Accept The Terms &amp; Conditions And Privacy Policy&rdquo; checkbox you accept and agree to be bound by these online shopping terms and conditions, the Privacy Statement, and such other policies as we notify you of from time to time, which together constitute the entire agreement between us. Nothing in these online shopping terms and conditions affects your statutory rights, either as a consumer or otherwise.
          </p>
          <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-8 pb-6 border-b border-[#EEEEEE]">
            By selecting the &ldquo;I Accept The Terms &amp; Conditions And Privacy Policy&rdquo; checkbox you agree to receive registration, order status, email marketing, and other communication from prettypetals.com site.
          </p>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Orders for Delivery Outside Mumbai</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Unless otherwise specified the materials on this website are directed for delivery only within Mumbai. We do not represent that any item referred to on this website is appropriate for use or available in locations outside India. If you choose to access this website from locations outside India you are responsible for compliance with local laws if and to the extent local laws apply.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Children</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              We only sell items to adults (i.e. those aged 18 or over). If you are under 18, you may use this website only with the involvement of a parent or guardian.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Colors, Specifications, and Dimensions of Products</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              We have made every effort to display the colors, specifications, and dimensions of items on the website as accurately as possible. The colors you see will depend on the resolution of your monitor, we cannot guarantee that your monitor&apos;s display of any color will reflect accurately the color of the item delivered. We may from time to time vary the dimensions, specifications, and quantities of items displayed on our website without prior notice. For example, the bouquets are subject to the seasonal availability of flowers.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Availability of Items and Substitution</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              We accept orders for items subject to availability. If for any reason the items you ordered are no longer available, we will contact you using the contact details you supplied when placing your order.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              We may offer you an alternative item of equivalent quality and price if this is possible, or cancel the item from your order and give you a full refund in respect of that item. If we are unable to contact you or do not receive a response from you, we will process any remaining items on your order and refund you for the items we were unable to supply.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Your Profile</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              You are responsible for maintaining the confidentiality of your account username and password and for preventing unauthorized access to your profile. You agree to accept responsibility for all activities that occur under your account or password. Please take all necessary steps to ensure that the username and password are kept confidential and secure. Please inform us immediately if you have any reason to believe that your username and/or password has become known to anyone else, or are being, or are likely to be, used in an unauthorized manner.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              Please ensure the details you provide us with on registration are correct and complete and inform us immediately of any changes to those details (e.g. change of email or postal address). You can access and update your registration details using the &ldquo;My Account&rdquo; area of the website.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              We reserve the right to refuse access to the website, terminate accounts, remove or edit content, or cancel orders at our discretion. If we cancel an order, it will be without charge to you.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Privacy and Communications</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              When you place your order, we collect certain personal and transactional information (e.g. name, address, email address). For details on how we use this information, please read our{" "}
              <a href="/privacy-policy/" className="text-[#737530] font-medium hover:underline">Privacy Policy</a>.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              To fulfill our obligations to you under these online shopping terms and conditions we communicate with you by e-mail and by posting notices on the website. You agree to receive communications from us electronically and that electronic communications will satisfy any legal requirement for communications that need to be in writing.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">The Contract Between Us</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              When you place an order to purchase items using our website this is an offer by you to us to purchase those items. We will confirm receipt of your order by sending you an email summarizing the details of your order (&ldquo;Order Confirmation E-mail&rdquo;).
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Prices</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Products are invoiced in INR at the prevailing price as of the time you place your order. Although we try to ensure that all prices on the website are accurate, errors may occur. If we discover an error in the price of the items you have ordered, we will contact you as soon as possible. You will have the option of either confirming your order at the correct price or canceling it. If we are unable to contact you, we will treat your order in respect of the incorrectly priced item as canceled.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Payment</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              You may pay for the items which you order online by supplying your credit/debit card details on the secure online order form. We regret that we cannot accept cheques.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              Please note that we cannot guarantee the security of data when you send us by email. Accordingly, please do not send us payment information using email. For details of the security measures we employ please read our{" "}
              <a href="/privacy-policy/" className="text-[#737530] font-medium hover:underline">Privacy Policy</a>.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Unless we are fraudulent or negligent we will not be liable to you for any losses caused as a result of unauthorized access to the personal and transactional information you provide to us when placing an order.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Delivery</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              Deliveries are made seven days a week.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              We make every effort to dispatch items on time. If we are unable to deliver the items within your chosen date, you are entitled to cancel the order and we will refund in full any charges which have been debited in respect of that order.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              If the items are not delivered within the time period we specify in the Confirmation Email, please contact our Customer Service online quoting the order reference contained in your Order Confirmation Email.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Delivery occurs when the items are delivered to the delivery address you specified when placing your order. At this point, responsibility for loss, breakage, and damage passes to you. Ownership of items purchased does not pass to you until payment is received by us in full. You will be asked to sign for acceptance of the goods which makes it understood that the goods were received in good condition. However, if upon opening the package you find something missing or broken, please contact us immediately.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Cancellations</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              If you wish to cancel your order, please contact our Customer Services online, one day before the delivery date. Same-day orders cannot be canceled. As we try to process orders immediately it may not always be possible to prevent an order from being dispatched. If your order has already been dispatched you will be charged for the delivery.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              If there is any complaint regarding the quality of the product being delivered, we will inquire about the same and if it is found to be true, the customer will get a full refund or the product will be replaced.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Please note that once we have dispatched items to you, you will not be able to cancel any contract you have with us for additional services carried out by us.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Incorrect Items</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              If we have sent you an incorrect item, please notify our Customer Services as soon as possible and they will arrange for a redelivery. If you would like us to replace the incorrect item with the item you ordered we will send you the correct item as soon as possible.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Costs</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-3">
              We will reimburse any reasonable costs you incur in returning the following items to us:
            </p>
            <ul className="space-y-2 mb-4">
              <li className="flex items-start gap-2 text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
                <span className="text-[#737530] mt-1 shrink-0">1.</span>
                <span>Items we delivered to you in error;</span>
              </li>
              <li className="flex items-start gap-2 text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
                <span className="text-[#737530] mt-1 shrink-0">2.</span>
                <span>Items that were damaged upon delivery or are defective or incorrect;</span>
              </li>
              <li className="flex items-start gap-2 text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
                <span className="text-[#737530] mt-1 shrink-0">3.</span>
                <span>Items that are substitutes for items originally ordered that we were unable to supply.</span>
              </li>
            </ul>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Until you return such items to us you are responsible for their safekeeping and taking reasonable care of them.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Losses</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              We will be responsible for any losses you suffer as a direct result of us breaching these online shopping terms and conditions if those losses were reasonably foreseeable to both you and us at the time the contract for the sale of items by us to you was formed. We will not be responsible to you or any third party for any business loss (including loss of revenue, profits, contracts, anticipated savings, wasted expenditure, data, or goodwill) or any other loss or damage which does not result directly from our actions or the actions of our sub-contractors or agents, is consequential or was not reasonably foreseeable to both you and us when the contract between us was formed.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-4">
              Our liability to you under these online shopping terms and conditions will not exceed the total price charged for the items purchased. Nothing in these online shopping terms and conditions excludes our liability to you for personal injury or death caused by our negligence.
            </p>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              We will not be responsible to you for any delay or failure to comply with our obligations under these online shopping terms and conditions if the delay or failure arises from any cause beyond our reasonable control.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Alterations to This Website and Terms and Conditions</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              We reserve the right at any time to make changes to this website, these online shopping terms and conditions, Privacy Statement, and such other policies as we may notify you of. You will be subject to the policies and terms and conditions in force at the time you use the website or order items from the website. Changes that we are required to make by law could apply to orders which you have already made. If any of the online shopping terms and conditions forming the contract between us are deemed invalid, void, or unenforceable for any reason, it will be deemed severable and not affect the validity and enforceability of the remaining terms and conditions.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
