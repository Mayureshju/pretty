import { connectDB } from "@/lib/db";
import NotificationSettings, {
  INotificationSettings,
} from "@/models/NotificationSettings";

const SINGLETON_KEY = "global";

export async function getNotificationSettings(): Promise<INotificationSettings> {
  await connectDB();

  const existing = await NotificationSettings.findOne({ key: SINGLETON_KEY });
  if (existing) {
    if (
      !Array.isArray(existing.sellerWhatsappNumbers) ||
      existing.sellerWhatsappNumbers.length === 0
    ) {
      const raw = existing.toObject() as Record<string, unknown>;
      const legacy =
        typeof raw.sellerWhatsappNumber === "string"
          ? raw.sellerWhatsappNumber.trim()
          : "";
      if (legacy) {
        existing.sellerWhatsappNumbers = [legacy];
        await existing.save();
      }
    }
    return existing;
  }

  const created = await NotificationSettings.create({ key: SINGLETON_KEY });
  return created;
}
