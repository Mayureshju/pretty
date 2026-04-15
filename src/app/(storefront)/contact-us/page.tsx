import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";
import { getPageMetadata } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  return getPageMetadata("contact-us", {
    title: "Contact Us | Pretty Petals",
    description:
      "Get in touch with Pretty Petals. Contact us for order inquiries, custom bouquet requests, or feedback. Call +91 98331 00194 or email support@prettypetals.com.",
  });
}

export default function ContactUsPage() {
  return <ContactForm />;
}
