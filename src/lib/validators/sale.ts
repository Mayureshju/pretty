import { z } from "zod";

export const createSaleSchema = z
  .object({
    name: z.string().min(1, "Sale name is required"),
    adjustmentDirection: z.enum(["discount", "hike"]).default("discount"),
    discountType: z.enum(["percentage", "fixed"]),
    discountValue: z.number().min(0, "Value must be positive"),
    startDateTime: z.string().min(1, "Start date/time is required"),
    endDateTime: z.string().min(1, "End date/time is required"),
    applyTo: z.enum(["all", "specific"]).default("all"),
    categories: z.array(z.string()).optional(),
    isActive: z.boolean().default(true),
  })
  .refine(
    (data) => new Date(data.endDateTime) > new Date(data.startDateTime),
    { message: "End date must be after start date", path: ["endDateTime"] }
  )
  .refine(
    (data) =>
      !(data.adjustmentDirection === "discount" && data.discountType === "percentage" && data.discountValue > 100),
    {
      message: "Percentage discount cannot exceed 100%",
      path: ["discountValue"],
    }
  );

export const updateSaleSchema = createSaleSchema;
