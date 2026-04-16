import type { IOrder, IOrderItem } from "@/models/Order";

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
  if (!phone) return;

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
  if (!phone) return;

  await sendWhatsAppTemplate(phone, "pretty_petals_out_for_delivery", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
    { name: "delivery_address", value: formatAddress(order.shipping) },
  ]);
}

export async function sendDeliveredWhatsApp(order: IOrder): Promise<void> {
  const phone = formatPhoneForWhatsApp(order.customer.phone);
  if (!phone) return;

  await sendWhatsAppTemplate(phone, "pretty_petals_delivered", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
  ]);
}

export async function sendOrderCancelledWhatsApp(order: IOrder): Promise<void> {
  const phone = formatPhoneForWhatsApp(order.customer.phone);
  if (!phone) return;

  await sendWhatsAppTemplate(phone, "pretty_petals_order_cancelled", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
    { name: "order_total", value: order.pricing.total.toLocaleString("en-IN") },
  ]);
}

export async function sendOrderFailedWhatsApp(order: IOrder): Promise<void> {
  const phone = formatPhoneForWhatsApp(order.customer.phone);
  if (!phone) return;

  await sendWhatsAppTemplate(phone, "pretty_petals_order_failed", [
    { name: "customer_name", value: order.customer.name },
    { name: "order_number", value: order.orderNumber },
    { name: "order_total", value: order.pricing.total.toLocaleString("en-IN") },
  ]);
}

export async function sendNewOrderSellerWhatsApp(order: IOrder): Promise<void> {
  const sellerPhone = "919821036990";

  await sendWhatsAppTemplate(sellerPhone, "pretty_petals_new_order_seller", [
    { name: "seller_name", value: "Reena" },
    { name: "order_number", value: order.orderNumber },
    { name: "customer_name", value: order.customer.name },
    { name: "customer_phone", value: order.customer.phone || "N/A" },
    { name: "items", value: buildItemSummary(order.items) },
    { name: "order_total", value: order.pricing.total.toLocaleString("en-IN") },
    { name: "delivery_date", value: formatDeliveryDate(order.deliverySlot) },
  ]);
}
