import nodemailer from "nodemailer";
import type { IOrder } from "@/models/Order";
import { getNotificationSettings } from "@/lib/notification-settings";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587", 10),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOrderConfirmationEmail(order: IOrder) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured, skipping email");
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.productName || "Product"}${item.variant ? ` (${item.variant})` : ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">&#8377; ${item.total.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  const html = `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1C2120;">
    <div style="background:#737530;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Pretty Petals</h1>
    </div>

    <div style="padding:24px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:60px;height:60px;background:#E8F5E9;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;color:#009D43;">&#10003;</span>
        </div>
        <h2 style="margin:0 0 4px;font-size:20px;">Order Confirmed!</h2>
        <p style="color:#888;margin:0;font-size:14px;">Thank you for your order</p>
      </div>

      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;">
          <tr>
            <td style="color:#888;">Order Number</td>
            <td style="text-align:right;font-weight:bold;">${order.orderNumber}</td>
          </tr>
          ${order.invoice?.number ? `<tr><td style="color:#888;">Invoice</td><td style="text-align:right;font-weight:bold;">${order.invoice.number}</td></tr>` : ""}
          ${order.deliverySlot ? `<tr><td style="color:#888;">Delivery Date</td><td style="text-align:right;">${new Date(order.deliverySlot).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</td></tr>` : ""}
        </table>
      </div>

      <h3 style="font-size:16px;margin:0 0 12px;border-bottom:2px solid #737530;padding-bottom:8px;">Order Items</h3>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px 12px;text-align:left;">Item</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#888;">Subtotal</span>
          <span>&#8377; ${order.pricing.subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#888;">Delivery</span>
          <span>${order.pricing.shipping === 0 ? "FREE" : `&#8377; ${order.pricing.shipping.toLocaleString("en-IN")}`}</span>
        </div>
        ${order.pricing.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#2E7D32;">Discount${order.pricing.couponCode ? ` (${order.pricing.couponCode})` : ""}</span><span style="color:#2E7D32;">- &#8377; ${order.pricing.discount.toLocaleString("en-IN")}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:8px;margin-top:4px;font-weight:bold;font-size:16px;">
          <span>Total</span>
          <span>&#8377; ${order.pricing.total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      ${order.shipping?.address ? `
      <h3 style="font-size:16px;margin:20px 0 12px;border-bottom:2px solid #737530;padding-bottom:8px;">Delivery Address</h3>
      <p style="font-size:14px;color:#464646;margin:0;line-height:1.6;">
        ${order.customer.name}<br/>
        ${order.shipping.address}<br/>
        ${order.shipping.city || ""}${order.shipping.state ? `, ${order.shipping.state}` : ""} ${order.shipping.pincode || ""}<br/>
        ${order.customer.phone ? `Phone: ${order.customer.phone}` : ""}
      </p>` : ""}
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">Thank you for shopping with Pretty Petals &#10084;</p>
      <p style="margin:0;color:#888;">If you have questions, reply to this email.</p>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: order.customer.email,
      subject: `Order Confirmed - ${order.orderNumber} | Pretty Petals`,
      html,
    });
    console.log(`Order confirmation email sent to ${order.customer.email}`);
  } catch (err) {
    console.error("Failed to send order confirmation email:", err);
  }
}

export async function sendNewOrderSellerEmail(order: IOrder) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("SMTP not configured, skipping seller email");
    return;
  }

  const settings = await getNotificationSettings();
  if (!settings.sendSellerEmail) {
    console.warn("[seller-email] skip: sendSellerEmail toggle is OFF");
    return;
  }

  const recipients = settings.sellerEmails.filter((e) => e && e.trim());
  if (recipients.length === 0) {
    console.warn(
      "[seller-email] skip: sellerEmails array is empty — configure at /admin/settings"
    );
    return;
  }

  const itemsHtml = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;">${item.productName || "Product"}${item.variant ? ` (${item.variant})` : ""}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">&#8377; ${item.total.toLocaleString("en-IN")}</td>
      </tr>`
    )
    .join("");

  const deliveryDate = order.deliverySlot
    ? new Date(order.deliverySlot).toLocaleDateString("en-IN", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "As scheduled";

  const html = `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1C2120;">
    <div style="background:#737530;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Pretty Petals</h1>
      <p style="color:#fff;margin:6px 0 0;font-size:13px;opacity:0.85;">Seller Notification</p>
    </div>

    <div style="padding:24px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:60px;height:60px;background:#FFF3E0;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;color:#E65100;">&#128276;</span>
        </div>
        <h2 style="margin:0 0 4px;font-size:20px;">New Order Received</h2>
        <p style="color:#888;margin:0;font-size:14px;">Hello ${settings.sellerName}, a new order needs your attention.</p>
      </div>

      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;">
          <tr>
            <td style="color:#888;">Order Number</td>
            <td style="text-align:right;font-weight:bold;">${order.orderNumber}</td>
          </tr>
          ${order.invoice?.number ? `<tr><td style="color:#888;">Invoice</td><td style="text-align:right;font-weight:bold;">${order.invoice.number}</td></tr>` : ""}
          <tr>
            <td style="color:#888;">Delivery Date</td>
            <td style="text-align:right;">${deliveryDate}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size:16px;margin:0 0 12px;border-bottom:2px solid #737530;padding-bottom:8px;">Customer</h3>
      <table style="width:100%;font-size:14px;margin-bottom:20px;">
        <tr>
          <td style="color:#888;padding:4px 0;">Name</td>
          <td style="text-align:right;padding:4px 0;">${order.customer.name}</td>
        </tr>
        ${order.customer.phone ? `<tr><td style="color:#888;padding:4px 0;">Phone</td><td style="text-align:right;padding:4px 0;">${order.customer.phone}</td></tr>` : ""}
        ${order.customer.email ? `<tr><td style="color:#888;padding:4px 0;">Email</td><td style="text-align:right;padding:4px 0;">${order.customer.email}</td></tr>` : ""}
      </table>

      <h3 style="font-size:16px;margin:0 0 12px;border-bottom:2px solid #737530;padding-bottom:8px;">Order Items</h3>
      <table style="width:100%;font-size:14px;border-collapse:collapse;">
        <thead>
          <tr style="background:#f5f5f5;">
            <th style="padding:8px 12px;text-align:left;">Item</th>
            <th style="padding:8px 12px;text-align:center;">Qty</th>
            <th style="padding:8px 12px;text-align:right;">Amount</th>
          </tr>
        </thead>
        <tbody>${itemsHtml}</tbody>
      </table>

      <div style="margin-top:16px;padding:16px;background:#f9f9f9;border-radius:8px;font-size:14px;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#888;">Subtotal</span>
          <span>&#8377; ${order.pricing.subtotal.toLocaleString("en-IN")}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
          <span style="color:#888;">Delivery</span>
          <span>${order.pricing.shipping === 0 ? "FREE" : `&#8377; ${order.pricing.shipping.toLocaleString("en-IN")}`}</span>
        </div>
        ${order.pricing.discount > 0 ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="color:#2E7D32;">Discount${order.pricing.couponCode ? ` (${order.pricing.couponCode})` : ""}</span><span style="color:#2E7D32;">- &#8377; ${order.pricing.discount.toLocaleString("en-IN")}</span></div>` : ""}
        <div style="display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:8px;margin-top:4px;font-weight:bold;font-size:16px;">
          <span>Total</span>
          <span>&#8377; ${order.pricing.total.toLocaleString("en-IN")}</span>
        </div>
      </div>

      ${order.shipping?.address ? `
      <h3 style="font-size:16px;margin:20px 0 12px;border-bottom:2px solid #737530;padding-bottom:8px;">Delivery Address</h3>
      <p style="font-size:14px;color:#464646;margin:0;line-height:1.6;">
        ${order.customer.name}<br/>
        ${order.shipping.address}<br/>
        ${order.shipping.city || ""}${order.shipping.state ? `, ${order.shipping.state}` : ""} ${order.shipping.pincode || ""}<br/>
        ${order.customer.phone ? `Phone: ${order.customer.phone}` : ""}
      </p>` : ""}
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">Please prepare this order for delivery.</p>
      <p style="margin:0;color:#888;">Pretty Petals Admin</p>
    </div>
  </div>`;

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: recipients.join(", "),
      subject: `New Order - ${order.orderNumber} | Pretty Petals`,
      html,
    });
    console.log(
      `Seller notification email sent to ${recipients.length} recipient(s)`
    );
  } catch (err) {
    console.error("Failed to send seller notification email:", err);
  }
}
