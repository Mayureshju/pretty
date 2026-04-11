import type { Metadata } from "next";
import ContactForm from "@/components/ContactForm";

export const metadata: Metadata = {
  title: "Contact Us | Pretty Petals",
  description:
    "Get in touch with Pretty Petals. Contact us for order inquiries, custom bouquet requests, or feedback. Call +91 98331 00194 or email support@prettypetals.com.",
  alternates: { canonical: "https://www.prettypetals.com/contact-us/" },
};

export default function ContactUsPage() {
  return <ContactForm />;
}
