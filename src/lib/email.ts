import { Resend } from "resend";
import type { IOrder } from "@/models/Order";
import { getNotificationSettings } from "@/lib/notification-settings";
import { getDeliveryLink } from "@/lib/delivery-token";

const resend = new Resend(process.env.RESEND_API_KEY);

// Until a custom domain is verified in Resend, fall back to their sandbox
// sender. Set EMAIL_FROM="Pretty Petals <orders@prettypetals.com>" in Vercel
// once the domain is verified.
const DEFAULT_FROM = "Pretty Petals <onboarding@resend.dev>";

export async function sendOrderConfirmationEmail(order: IOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[customer-email] skip: RESEND_API_KEY not configured");
    return;
  }
  if (!order.customer.email) {
    console.warn("[customer-email] skip: order has no customer email");
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
        ${formatDeliveryAddressHtml(order)}
      </p>` : ""}
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">Thank you for shopping with Pretty Petals &#10084;</p>
      <p style="margin:0;color:#888;">If you have questions, reply to this email.</p>
    </div>
  </div>`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: order.customer.email,
    subject: `Order Confirmed - ${order.orderNumber} | Pretty Petals`,
    html,
  });

  if (error) {
    console.error("[customer-email] Resend error:", error);
    return;
  }
  console.log(
    `[customer-email] sent to ${order.customer.email} (id=${data?.id})`
  );
}

function formatDeliveryAddressHtml(order: IOrder): string {
  const s = order.shipping;
  if (!s?.address) return "As provided";
  const cityLine = [s.city, s.state].filter(Boolean).join(", ");
  return [
    s.receiverName || order.customer.name,
    s.address,
    cityLine,
    s.pincode ? `PIN: ${s.pincode}` : "",
    s.receiverPhone ? `Phone: ${s.receiverPhone}` : "",
  ]
    .filter(Boolean)
    .join("<br/>");
}

export async function sendProcessingEmail(order: IOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[customer-email] skip (processing): RESEND_API_KEY not configured");
    return;
  }
  if (!order.customer.email) {
    console.warn("[customer-email] skip (processing): order has no customer email");
    return;
  }

  const html = `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1C2120;">
    <div style="background:#737530;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Pretty Petals</h1>
    </div>

    <div style="padding:24px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:60px;height:60px;background:#FFF8E1;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;color:#F9A825;">&#127804;</span>
        </div>
        <h2 style="margin:0 0 4px;font-size:20px;">Your Order is Being Prepared</h2>
        <p style="color:#888;margin:0;font-size:14px;">Hi ${order.customer.name}, our florists are hand-crafting your order.</p>
      </div>

      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;">
          <tr>
            <td style="color:#888;">Order Number</td>
            <td style="text-align:right;font-weight:bold;">${order.orderNumber}</td>
          </tr>
          ${order.deliverySlot ? `<tr><td style="color:#888;">Delivery Date</td><td style="text-align:right;">${new Date(order.deliverySlot).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</td></tr>` : ""}
        </table>
      </div>

      <p style="font-size:14px;color:#464646;line-height:1.6;margin:0;">
        We'll let you know as soon as your order is out for delivery. Thank you for your patience!
      </p>
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">Thank you for shopping with Pretty Petals &#10084;</p>
    </div>
  </div>`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: order.customer.email,
    subject: `Order Being Prepared - ${order.orderNumber} | Pretty Petals`,
    html,
  });

  if (error) {
    console.error("[customer-email] Resend error (processing):", error);
    return;
  }
  console.log(
    `[customer-email] processing sent to ${order.customer.email} (id=${data?.id})`
  );
}

export async function sendOutForDeliveryEmail(order: IOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[customer-email] skip (out_for_delivery): RESEND_API_KEY not configured");
    return;
  }
  if (!order.customer.email) {
    console.warn("[customer-email] skip (out_for_delivery): order has no customer email");
    return;
  }

  const html = `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1C2120;">
    <div style="background:#737530;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Pretty Petals</h1>
    </div>

    <div style="padding:24px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:60px;height:60px;background:#FFF3E0;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;color:#E65100;">&#128666;</span>
        </div>
        <h2 style="margin:0 0 4px;font-size:20px;">Your Order is Out for Delivery!</h2>
        <p style="color:#888;margin:0;font-size:14px;">Hi ${order.customer.name}, your flowers are on the way.</p>
      </div>

      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;">
          <tr>
            <td style="color:#888;">Order Number</td>
            <td style="text-align:right;font-weight:bold;">${order.orderNumber}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size:16px;margin:0 0 12px;border-bottom:2px solid #737530;padding-bottom:8px;">Delivery Address</h3>
      <p style="font-size:14px;color:#464646;margin:0;line-height:1.6;">
        ${formatDeliveryAddressHtml(order)}
      </p>
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">Our delivery partner will reach you shortly.</p>
      <p style="margin:0;color:#888;">Thank you,<br/>Pretty Petals &#10084;</p>
    </div>
  </div>`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: order.customer.email,
    subject: `Out for Delivery - ${order.orderNumber} | Pretty Petals`,
    html,
  });

  if (error) {
    console.error("[customer-email] Resend error (out_for_delivery):", error);
    return;
  }
  console.log(
    `[customer-email] out_for_delivery sent to ${order.customer.email} (id=${data?.id})`
  );
}

export async function sendDeliveredEmail(order: IOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[customer-email] skip (delivered): RESEND_API_KEY not configured");
    return;
  }
  if (!order.customer.email) {
    console.warn("[customer-email] skip (delivered): order has no customer email");
    return;
  }

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
        <h2 style="margin:0 0 4px;font-size:20px;">Order Delivered</h2>
        <p style="color:#888;margin:0;font-size:14px;">Hi ${order.customer.name}, your flowers have been delivered.</p>
      </div>

      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;">
          <tr>
            <td style="color:#888;">Order Number</td>
            <td style="text-align:right;font-weight:bold;">${order.orderNumber}</td>
          </tr>
        </table>
      </div>

      <p style="font-size:14px;color:#464646;line-height:1.6;margin:0;">
        Your flowers from Pretty Petals have been delivered. We hope they brought a smile to your loved one's face! Please rate your experience by replying to this email or leaving a review on the product page.
      </p>
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">Thank you for shopping with Pretty Petals &#10084;</p>
    </div>
  </div>`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: order.customer.email,
    subject: `Delivered - ${order.orderNumber} | Pretty Petals`,
    html,
  });

  if (error) {
    console.error("[customer-email] Resend error (delivered):", error);
    return;
  }
  console.log(
    `[customer-email] delivered sent to ${order.customer.email} (id=${data?.id})`
  );
}

export async function sendDeliveredSellerEmail(order: IOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[seller-email] skip (delivered): RESEND_API_KEY not configured");
    return;
  }

  const settings = await getNotificationSettings();
  if (!settings.sendSellerEmail) {
    console.warn("[seller-email] skip (delivered): sendSellerEmail toggle is OFF");
    return;
  }

  const recipients = settings.sellerEmails.filter((e) => e && e.trim());
  if (recipients.length === 0) {
    console.warn(
      "[seller-email] skip (delivered): sellerEmails array is empty — configure at /admin/settings"
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

  const html = `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1C2120;">
    <div style="background:#737530;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Pretty Petals</h1>
      <p style="color:#fff;margin:6px 0 0;font-size:13px;opacity:0.85;">Seller Notification</p>
    </div>

    <div style="padding:24px;background:#fff;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:60px;height:60px;background:#E8F5E9;border-radius:50%;margin:0 auto 12px;display:flex;align-items:center;justify-content:center;">
          <span style="font-size:28px;color:#009D43;">&#10003;</span>
        </div>
        <h2 style="margin:0 0 4px;font-size:20px;">Order Delivered</h2>
        <p style="color:#888;margin:0;font-size:14px;">Hello ${settings.sellerName}, this order has been marked delivered.</p>
      </div>

      <div style="background:#f9f9f9;border-radius:8px;padding:16px;margin-bottom:20px;">
        <table style="width:100%;font-size:14px;">
          <tr>
            <td style="color:#888;">Order Number</td>
            <td style="text-align:right;font-weight:bold;">${order.orderNumber}</td>
          </tr>
          ${order.invoice?.number ? `<tr><td style="color:#888;">Invoice</td><td style="text-align:right;font-weight:bold;">${order.invoice.number}</td></tr>` : ""}
          <tr>
            <td style="color:#888;">Delivered On</td>
            <td style="text-align:right;">${new Date().toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</td>
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

      <h3 style="font-size:16px;margin:0 0 12px;border-bottom:2px solid #737530;padding-bottom:8px;">Items Delivered</h3>
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
        <div style="display:flex;justify-content:space-between;border-top:1px solid #ddd;padding-top:8px;margin-top:4px;font-weight:bold;font-size:16px;">
          <span>Total</span>
          <span>&#8377; ${order.pricing.total.toLocaleString("en-IN")}</span>
        </div>
      </div>
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">No further action needed.</p>
      <p style="margin:0;color:#888;">Pretty Petals Admin</p>
    </div>
  </div>`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: recipients,
    subject: `Delivered - ${order.orderNumber} | Pretty Petals`,
    html,
  });

  if (error) {
    console.error("[seller-email] Resend error (delivered):", error);
    return;
  }
  console.log(
    `[seller-email] delivered sent to ${recipients.length} recipient(s) (id=${data?.id})`
  );
}

export async function sendOrderReminderEmail(order: IOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[reminder-email] skip: RESEND_API_KEY not configured");
    return;
  }
  if (!order.customer.email) {
    console.warn("[reminder-email] skip: order has no customer email");
    return;
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const receiverName = order.shipping?.receiverName || "your loved one";
  const shopUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.prettypetals.com"
  ).replace(/\/$/, "");

  const html = `
  <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#1C2120;">
    <div style="background:#737530;padding:24px;text-align:center;">
      <h1 style="color:#fff;margin:0;font-size:22px;">Pretty Petals</h1>
    </div>

    <div style="padding:24px;background:#fff;">
      <div style="text-align:center;margin-bottom:20px;">
        <div style="font-size:34px;">&#127800;</div>
        <h2 style="margin:8px 0 4px;font-size:20px;">A Special Day is Coming Up!</h2>
      </div>

      <p style="font-size:15px;color:#464646;line-height:1.7;margin:0 0 16px;">
        Hi ${order.customer.name},<br/><br/>
        Greetings from Pretty Petals &#127800;.<br/>
        This is a gentle reminder that you placed an order with us for
        <b>${receiverName}</b> on <b>${orderDate}</b>.<br/><br/>
        Would you like to send flowers again this year?
      </p>

      <div style="text-align:center;margin:24px 0;">
        <a href="${shopUrl}/flowers/" style="display:inline-block;background:#737530;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:bold;">Send Flowers Again</a>
      </div>
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">With love, Pretty Petals &#10084;</p>
      <p style="margin:0;color:#888;">Reply to this email if you'd like help placing your order.</p>
    </div>
  </div>`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: order.customer.email,
    subject: `A special day is coming up 🌸 | Pretty Petals`,
    html,
  });

  if (error) {
    console.error("[reminder-email] Resend error:", error);
    return;
  }
  console.log(
    `[reminder-email] sent to ${order.customer.email} for order ${order.orderNumber} (id=${data?.id})`
  );
}

export async function sendNewOrderSellerEmail(order: IOrder) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[seller-email] skip: RESEND_API_KEY not configured");
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

  let deliveryLink = "";
  try {
    deliveryLink = getDeliveryLink(String(order._id));
  } catch (e) {
    console.error("[seller-email] could not build delivery link:", e);
  }

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
        ${order.shipping.receiverName || order.customer.name}<br/>
        ${order.shipping.address}<br/>
        ${order.shipping.city || ""}${order.shipping.state ? `, ${order.shipping.state}` : ""} ${order.shipping.pincode || ""}<br/>
        ${order.shipping.receiverPhone ? `Receiver Phone: ${order.shipping.receiverPhone}` : ""}
      </p>` : ""}

      ${deliveryLink ? `
      <div style="margin-top:20px;padding:16px;background:#FFF8E1;border:1px solid #F9E4A0;border-radius:8px;text-align:center;">
        <p style="margin:0 0 10px;font-size:13px;color:#7a5b00;font-weight:bold;">Delivery Boy Status Link (internal only)</p>
        <a href="${deliveryLink}" style="display:inline-block;background:#737530;color:#fff;text-decoration:none;padding:10px 20px;border-radius:6px;font-size:14px;font-weight:bold;">Open Delivery Update Page</a>
        <p style="margin:10px 0 0;font-size:11px;color:#999;word-break:break-all;">${deliveryLink}</p>
      </div>` : ""}
    </div>

    <div style="background:#F2F3E8;padding:20px;text-align:center;font-size:13px;color:#464646;">
      <p style="margin:0 0 4px;">Please prepare this order for delivery.</p>
      <p style="margin:0;color:#888;">Pretty Petals Admin</p>
    </div>
  </div>`;

  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM || DEFAULT_FROM,
    to: recipients,
    subject: `New Order - ${order.orderNumber} | Pretty Petals`,
    html,
  });

  if (error) {
    console.error("[seller-email] Resend error:", error);
    return;
  }
  console.log(
    `[seller-email] sent to ${recipients.length} recipient(s) (id=${data?.id})`
  );
}
