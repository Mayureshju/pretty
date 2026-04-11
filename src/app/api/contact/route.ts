import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const { name, email, phone, subject, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP not configured, logging contact form submission");
      console.log("Contact form:", { name, email, phone, subject, message });
      return NextResponse.json({ success: true });
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: "support@prettypetals.com",
      replyTo: email,
      subject: `Contact Form: ${subject || "General Inquiry"} - from ${name}`,
      html: `
        <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1C2120;">
          <div style="background:#737530;padding:20px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:20px;">New Contact Form Submission</h1>
          </div>
          <div style="padding:24px;background:#fff;">
            <table style="width:100%;font-size:14px;border-collapse:collapse;">
              <tr><td style="padding:8px 0;color:#888;width:100px;">Name</td><td style="padding:8px 0;font-weight:bold;">${name}</td></tr>
              <tr><td style="padding:8px 0;color:#888;">Email</td><td style="padding:8px 0;">${email}</td></tr>
              ${phone ? `<tr><td style="padding:8px 0;color:#888;">Phone</td><td style="padding:8px 0;">${phone}</td></tr>` : ""}
              <tr><td style="padding:8px 0;color:#888;">Subject</td><td style="padding:8px 0;">${subject || "General Inquiry"}</td></tr>
            </table>
            <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;">
              <p style="margin:0 0 4px;font-size:12px;color:#888;">Message</p>
              <p style="margin:0;font-size:14px;line-height:1.6;white-space:pre-wrap;">${message}</p>
            </div>
          </div>
        </div>
      `,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
