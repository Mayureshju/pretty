import { z } from "zod";

export const notificationSettingsSchema = z.object({
  sellerName: z
    .string()
    .trim()
    .min(1, "Seller name is required")
    .max(100, "Seller name is too long"),
  sellerWhatsappNumber: z
    .string()
    .trim()
    .regex(
      /^\d{10,12}$/,
      "Enter a 10-digit number, or 12 digits with 91 prefix"
    ),
  sellerEmails: z
    .array(z.string().trim().email("Invalid email address"))
    .max(10, "Maximum 10 recipients"),
  sendSellerWhatsApp: z.boolean(),
  sendSellerEmail: z.boolean(),
});

export type NotificationSettingsInput = z.infer<
  typeof notificationSettingsSchema
>;
