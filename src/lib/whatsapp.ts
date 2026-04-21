import type { IOrder, IOrderItem } from "@/models/Order";
import { getNotificationSettings } from "@/lib/notification-settings";

const WHATSAPP_API_URL = "https://graph.facebook.com/v21.0";

function formatPhoneForWhatsApp(phone: string | undefined): string | null {
  if (!phone) return null;

  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;

  // Already has country code (12 digits starting with 91)
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  // Has +91 prefix (stripped to digits)
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  // Standard 10-digit Indian number
  if (digits.length === 10) return `91${digits}`;
  // Fallback: prepend 91
  return `91${digits}`;
}

function buildItemSummary(items: IOrderItem[]): string {
  const summary = items
    .map((item) => `${item.productName || "Product"}${item.variant ? ` (${item.variant})` : ""} x${item.quantity}`)
    .join(", ");

  if (summary.length > 200) {
    return summary.slice(0, 197) + "...";
  }
  return summary;
}

// Seller template's static text is larger, so the combined body + params must
// stay under Meta's 1024-char template body cap. Keep this short (first item
// name + overflow count) — seller can see full details in the admin panel.
function buildSellerItemSummary(items: IOrderItem[]): string {
  if (items.length === 0) return "Order";
  const first = items[0];
  const firstLabel = `${first.productName || "Product"}${first.variant ? ` (${first.variant})` : ""} x${first.quantity}`;
  const label =
    items.length === 1
      ? firstLabel
      : `${firstLabel} + ${items.length - 1} more item${items.length - 1 > 1 ? "s" : ""}`;
  return label.length > 80 ? label.slice(0, 77) + "..." : label;
}

interface TemplateParam {
  name: string;
  value: string;
}

async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  bodyParams: TemplateParam[]
): Promise<void> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

  if (!phoneNumberId || !accessToken) {
    console.warn("WhatsApp not configured, skipping message");
    return;
  }

  const payload = {
    messaging_product: "whatsapp",
    to,
    type: "template",
    template: {
      name: templateName,
      language: { code: "en" },
      components: [
        {
          type: "body",
          parameters: bodyParams.map((p) => ({
            type: "text",
            parameter_name: p.name,
            text: p.value,
          })),
        },
      ],
    },
  };

  try {
    const res = await fetch(
      `${WHATSAPP_API_URL}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const error = await res.text();
      console.error(`WhatsApp API error (${templateName}):`, error);
      return;
    }

    console.log(`WhatsApp message sent: ${templateName} to ${to}`);
  } catch (err) {
    console.error(`Failed to send WhatsApp message (${templateName}):`, err);
  }
}

function formatDeliveryDate(slot: string | undefined): string {
  if (!slot) return "As scheduled";
  try {
    return new Date(slot).toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return slot;
  }
}

function formatAddress(shipping: IOrder["shipping"]): string {
  const parts = [
    shipping?.address,
    shipping?.city,
    shipping?.state,
    shipping?.pincode,
  ].filter(Boolean);
  return parts.join(", ") || "As provided";
}

export async function sendOrderConfirmedWhatsApp(order: IOrder): Promise<void> {
  const phone = formatPhoneForWhatsApp(order.customer.phone);
  if (!phone) {
    console.warn(
      "[customer-whatsapp] skip (order_confirmed): no valid phone on order",
      order.customer.phone
    );
    return;
  }

  await sendWhatsAppTemplate(phone, "pretty_petals_order_confirmed", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
    { name: "items", value: buildItemSummary(order.items) },
    { name: "order_total", value: order.pricing.total.toLocaleString("en-IN") },
    { name: "delivery_date", value: formatDeliveryDate(order.deliverySlot) },
    { name: "invoice_number", value: order.invoice?.number || "Will be generated" },
  ]);
}

export async function sendOutForDeliveryWhatsApp(order: IOrder): Promise<void> {
  const phone = formatPhoneForWhatsApp(order.customer.phone);
  if (!phone) {
    console.warn(
      "[customer-whatsapp] skip (out_for_delivery): no valid phone on order",
      order.customer.phone
    );
    return;
  }

  await sendWhatsAppTemplate(phone, "pretty_petals_out_for_delivery", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
    { name: "delivery_address", value: formatAddress(order.shipping) },
  ]);
}

export async function sendDeliveredWhatsApp(order: IOrder): Promise<void> {
  const phone = formatPhoneForWhatsApp(order.customer.phone);
  if (!phone) {
    console.warn(
      "[customer-whatsapp] skip (delivered): no valid phone on order",
      order.customer.phone
    );
    return;
  }

  await sendWhatsAppTemplate(phone, "pretty_petals_delivered", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
  ]);
}

export async function sendOrderCancelledWhatsApp(order: IOrder): Promise<void> {
  const phone = formatPhoneForWhatsApp(order.customer.phone);
  if (!phone) {
    console.warn(
      "[customer-whatsapp] skip (order_cancelled): no valid phone on order",
      order.customer.phone
    );
    return;
  }

  await sendWhatsAppTemplate(phone, "pretty_petals_order_cancelled", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
    { name: "order_total", value: order.pricing.total.toLocaleString("en-IN") },
  ]);
}

export async function sendOrderFailedWhatsApp(order: IOrder): Promise<void> {
  const phone = formatPhoneForWhatsApp(order.customer.phone);
  if (!phone) {
    console.warn(
      "[customer-whatsapp] skip (order_failed): no valid phone on order",
      order.customer.phone
    );
    return;
  }

  await sendWhatsAppTemplate(phone, "pretty_petals_order_failed", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
    { name: "order_total", value: order.pricing.total.toLocaleString("en-IN") },
  ]);
}

function resolveSellerPhones(raw: string[] | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const phones: string[] = [];
  for (const entry of raw) {
    const phone = formatPhoneForWhatsApp(entry);
    if (phone && !seen.has(phone)) {
      seen.add(phone);
      phones.push(phone);
    }
  }
  return phones;
}

export async function sendDeliveredSellerWhatsApp(order: IOrder): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.sendSellerWhatsApp) {
    console.warn("[seller-whatsapp] skip (delivered): sendSellerWhatsApp toggle is OFF");
    return;
  }

  const sellerPhones = resolveSellerPhones(settings.sellerWhatsappNumbers);
  if (sellerPhones.length === 0) {
    console.warn(
      "[seller-whatsapp] skip (delivered): no valid sellerWhatsappNumbers:",
      settings.sellerWhatsappNumbers
    );
    return;
  }

  const params: TemplateParam[] = [
    { name: "order_number", value: order.orderNumber },
    { name: "customer_name", value: order.customer.name },
    { name: "items", value: buildSellerItemSummary(order.items) },
    { name: "order_total", value: order.pricing.total.toLocaleString("en-IN") },
  ];

  await Promise.all(
    sellerPhones.map((phone) =>
      sendWhatsAppTemplate(phone, "pretty_petals_delivered_seller", params)
    )
  );
}

export async function sendNewOrderSellerWhatsApp(order: IOrder): Promise<void> {
  const settings = await getNotificationSettings();
  if (!settings.sendSellerWhatsApp) {
    console.warn("[seller-whatsapp] skip: sendSellerWhatsApp toggle is OFF");
    return;
  }

  const sellerPhones = resolveSellerPhones(settings.sellerWhatsappNumbers);
  if (sellerPhones.length === 0) {
    console.warn(
      "[seller-whatsapp] skip: no valid sellerWhatsappNumbers:",
      settings.sellerWhatsappNumbers
    );
    return;
  }

  const params: TemplateParam[] = [
    { name: "order_number", value: order.orderNumber },
    { name: "customer_name", value: order.customer.name },
    { name: "items", value: buildSellerItemSummary(order.items) },
    { name: "order_total", value: order.pricing.total.toLocaleString("en-IN") },
  ];

  await Promise.all(
    sellerPhones.map((phone) =>
      sendWhatsAppTemplate(phone, "pretty_petals_new_order_seller", params)
    )
  );
}
