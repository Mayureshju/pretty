import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import { requireAdmin, handleAuthError, errorResponse } from "@/lib/auth";
import NotificationSettings from "@/models/NotificationSettings";
import { notificationSettingsSchema } from "@/lib/validators/notification-settings";
import { getNotificationSettings } from "@/lib/notification-settings";

const SINGLETON_KEY = "global";

export async function GET() {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    const settings = await getNotificationSettings();
    return Response.json({
      sellerName: settings.sellerName,
      sellerWhatsappNumbers: settings.sellerWhatsappNumbers,
      sellerEmails: settings.sellerEmails,
      sendSellerWhatsApp: settings.sendSellerWhatsApp,
      sendSellerEmail: settings.sendSellerEmail,
    });
  } catch (err) {
    console.error("GET /api/admin/notification-settings error:", err);
    return errorResponse("Failed to load notification settings");
  }
}

export async function PUT(request: NextRequest) {
  try {
    await requireAdmin();
  } catch (err) {
    return handleAuthError(err);
  }

  try {
    await connectDB();

    const body = await request.json();
    const parsed = notificationSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await NotificationSettings.findOneAndUpdate(
      { key: SINGLETON_KEY },
      { ...parsed.data, key: SINGLETON_KEY },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return Response.json({
      sellerName: updated.sellerName,
      sellerWhatsappNumbers: updated.sellerWhatsappNumbers,
      sellerEmails: updated.sellerEmails,
      sendSellerWhatsApp: updated.sendSellerWhatsApp,
      sendSellerEmail: updated.sendSellerEmail,
    });
  } catch (err) {
    console.error("PUT /api/admin/notification-settings error:", err);
    return errorResponse("Failed to save notification settings");
  }
}
