"use client";

import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function ContactForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("Message sent! We'll get back to you soon.");
        setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      } else {
        toast.error("Failed to send message. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main>
      {/* Hero */}
      <section className="bg-[#1C2120] py-12 md:py-16">
        <div className="max-w-[1440px] mx-auto px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-white">Contact Us</h1>
          <p className="text-sm md:text-base text-white/60 mt-2">We&apos;d love to hear from you</p>
          <div className="flex items-center gap-2 mt-3 text-xs text-white/50">
            <Link href="/" className="hover:text-white/80 transition-colors">Home</Link>
            <span>/</span>
            <span className="text-white/80">Contact Us</span>
          </div>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">

          {/* Contact Info */}
          <div className="lg:col-span-1">
            <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-6">Get In Touch</h2>
            <p className="text-[14px] md:text-[15px] text-[#555] leading-[1.8] mb-8">
              Have a question about your order, need help choosing the perfect bouquet, or want to share feedback? Reach out to us anytime.
            </p>

            {/* Phone */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#737530]/10 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-[#939393] font-medium mb-0.5">Phone</p>
                <a href="tel:+919833100194" className="text-[15px] font-semibold text-[#1C2120] hover:text-[#737530] transition-colors">+91 98331 00194</a>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-4 mb-6">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#737530]/10 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-[#939393] font-medium mb-0.5">Email</p>
                <a href="mailto:support@prettypetals.com" className="text-[15px] font-semibold text-[#1C2120] hover:text-[#737530] transition-colors">support@prettypetals.com</a>
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-4 mb-8">
              <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-[#737530]/10 shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#737530" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div>
                <p className="text-[13px] text-[#939393] font-medium mb-0.5">Address</p>
                <p className="text-[15px] font-semibold text-[#1C2120] leading-relaxed">
                  Shop No. 3, 15A, Bhalerao Bhuvan, 15A,<br />
                  Off Carter Rd Union Park, Khar West, Mumbai,<br />
                  Maharashtra 400052
                </p>
              </div>
            </div>

            {/* Hours */}
            <div className="bg-[#F7F8F1] rounded-xl p-5">
              <p className="text-[13px] text-[#939393] font-medium mb-1">Business Hours</p>
              <p className="text-[14px] text-[#1C2120] font-medium">Monday - Sunday: 9:00 AM - 8:00 PM</p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-white border border-[#EEEEEE] rounded-2xl p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-[#1C2120] mb-2">Send Us a Message</h2>
              <p className="text-[14px] text-[#939393] mb-6">Fill out the form below and we&apos;ll get back to you as soon as possible.</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-[13px] font-medium text-[#1C2120] mb-1.5">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      value={form.name}
                      onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      placeholder="Your full name"
                      className="w-full px-4 py-3 text-[14px] border border-[#E0E0E0] rounded-xl focus:outline-none focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-[13px] font-medium text-[#1C2120] mb-1.5">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="your@email.com"
                      className="w-full px-4 py-3 text-[14px] border border-[#E0E0E0] rounded-xl focus:outline-none focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="phone" className="block text-[13px] font-medium text-[#1C2120] mb-1.5">
                      Phone Number
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="+91 98331 00194"
                      className="w-full px-4 py-3 text-[14px] border border-[#E0E0E0] rounded-xl focus:outline-none focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-[13px] font-medium text-[#1C2120] mb-1.5">
                      Subject
                    </label>
                    <select
                      id="subject"
                      value={form.subject}
                      onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
                      className="w-full px-4 py-3 text-[14px] border border-[#E0E0E0] rounded-xl focus:outline-none focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 transition-colors bg-white"
                    >
                      <option value="">Select a subject</option>
                      <option value="Order Inquiry">Order Inquiry</option>
                      <option value="Delivery Issue">Delivery Issue</option>
                      <option value="Custom Bouquet Request">Custom Bouquet Request</option>
                      <option value="Corporate Orders">Corporate Orders</option>
                      <option value="Feedback">Feedback</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="message" className="block text-[13px] font-medium text-[#1C2120] mb-1.5">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={form.message}
                    onChange={(e) => setForm((p) => ({ ...p, message: e.target.value }))}
                    placeholder="How can we help you?"
                    className="w-full px-4 py-3 text-[14px] border border-[#E0E0E0] rounded-xl focus:outline-none focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto px-8 py-3.5 text-[14px] font-semibold text-white bg-[#737530] rounded-xl hover:bg-[#4C4D27] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
