import { connectDB } from "@/lib/db";
import NotificationSettings, {
  INotificationSettings,
} from "@/models/NotificationSettings";

const SINGLETON_KEY = "global";

export async function getNotificationSettings(): Promise<INotificationSettings> {
  await connectDB();

  const existing = await NotificationSettings.findOne({ key: SINGLETON_KEY });
  if (existing) return existing;

  const created = await NotificationSettings.create({ key: SINGLETON_KEY });
  return created;
}
