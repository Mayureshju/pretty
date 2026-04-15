import type { Metadata } from "next";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("privacy-policy", {
    title: "Privacy Policy | Pretty Petals",
    description:
      "Read the Pretty Petals privacy policy. Learn how we collect, use, and protect your personal information.",
  });
}

export default function PrivacyPolicyPage() {
  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Privacy Policy</h1>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <a href="/" className="hover:text-white/80 transition-colors">Home</a>
            <span>/</span>
            <span className="text-white/80">Privacy Policy</span>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="max-w-3xl prose-container">

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Copyright Information</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Copyright &copy; 2023 Pretty Petals. All Rights Reserved.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Trademarks</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              The Pretty Petals logo and all taglines are trademarks or copyrights of Pretty Petals. Any reproduction or distribution of Pretty Petals trademarks, copyrights, software, or website content without written permission is strictly prohibited. All other products and company names are trademarks or copyrights of their respective owners.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Information Collected by Pretty Petals</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              When you visit the Pretty Petals site, you may provide two types of information: personal information you knowingly disclose on an individual basis and website usage information collected on an aggregate basis as you and others browse the website.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Personal Information You Choose To Provide</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              If you submit information requesting more details from Pretty Petals, the company will not share submitted information with third parties. Our lists are private and are not sold or exchanged with outside entities. Pretty Petals may share information with strategic partners to help provide solutions.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Sharing Information With Strategic Partners</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Pretty Petals may enter strategic marketing alliances where third parties receive access to personal information including name, address, telephone number, and email to provide information about products and services of potential interest. The company retains all ownership rights to this information.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Website Use Information</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              The Pretty Petals website utilizes server logs to collect information about usage patterns including dates, times, pages viewed, and time spent on the site. This information is collected on an aggregate basis. None of this information is associated with you as an individual.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Use Of Website Information</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Content may be used solely for personal, informational, and non-commercial purposes and cannot be modified or altered. You may not use, download, copy, print, display, reproduce, publish, or distribute website information without prior written consent.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Employee Access, Training, And Expectations</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Corporate values, ethical standards, policies, and practices are committed to protecting customer and visitor information privacy.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Legal Disclosure Of Information</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Pretty Petals may disclose information when legally required or for protection of legal rights.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">External Links</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              The website may contain hyperlinks to sites controlled by other parties. Pretty Petals is not responsible for and does not endorse or accept any responsibility for the content or use of these websites.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Consent</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              By using Pretty Petals&apos; website, you consent to information collection and use as described in this policy. Changes to privacy policies will be posted on the website. If you disagree, discontinue website use.
            </p>
          </div>

          <div className="mb-8 pb-6 border-b border-[#EEEEEE]">
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Notice Of New Services And Changes</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              Pretty Petals may use collected information to notify you about website changes, new services, and special offers. You can opt out by clicking response boxes or emailing support@prettypetals.com.
            </p>
          </div>

          <div>
            <h2 className="text-lg md:text-xl font-bold text-[#1C2120] mb-3">Contact Information</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8]">
              For questions about Pretty Petals&apos; privacy policy, email{" "}
              <a href="mailto:support@prettypetals.com" className="text-[#737530] font-medium hover:underline">support@prettypetals.com</a>{" "}
              or call{" "}
              <a href="tel:+919833100194" className="text-[#737530] font-medium hover:underline">+91 98331 00194</a>.
            </p>
          </div>

        </div>
      </section>
    </main>
  );
}
