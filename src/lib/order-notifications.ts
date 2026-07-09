import type { IOrder } from "@/models/Order";
import {
  sendProcessingWhatsApp,
  sendOutForDeliveryWhatsApp,
  sendDeliveredWhatsApp,
  sendOrderCancelledWhatsApp,
  sendReviewRequestWhatsApp,
} from "@/lib/whatsapp";
import {
  sendProcessingEmail,
  sendOutForDeliveryEmail,
  sendDeliveredEmail,
} from "@/lib/email";

/**
 * Fire-and-forget CUSTOMER notifications for an order status change.
 * Deliberately does NOT notify the seller/business on "delivered" — per policy
 * the business only receives the "order received" message, not delivered.
 */
export function dispatchStatusNotifications(order: IOrder, status: string): void {
  const whatsappByStatus: Record<
    string,
    ((o: IOrder) => Promise<void>) | undefined
  > = {
    processing: sendProcessingWhatsApp,
    "out-for-delivery": sendOutForDeliveryWhatsApp,
    delivered: sendDeliveredWhatsApp,
    cancelled: sendOrderCancelledWhatsApp,
  };
  const whatsappFn = whatsappByStatus[status];
  if (whatsappFn) whatsappFn(order).catch(() => {});

  const emailByStatus: Record<
    string,
    ((o: IOrder) => Promise<void>) | undefined
  > = {
    processing: sendProcessingEmail,
    "out-for-delivery": sendOutForDeliveryEmail,
    delivered: sendDeliveredEmail,
  };
  const emailFn = emailByStatus[status];
  if (emailFn) emailFn(order).catch(() => {});

  // Post-delivery star-rating request to BOTH sender and receiver.
  if (status === "delivered") {
    sendReviewRequestWhatsApp(order).catch(() => {});
  }
}
