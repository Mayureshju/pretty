import mongoose, { Schema, Document } from "mongoose";

export interface INotificationSettings extends Document {
  key: string;
  sellerName: string;
  sellerWhatsappNumbers: string[];
  sellerEmails: string[];
  sendSellerWhatsApp: boolean;
  sendSellerEmail: boolean;
  updatedAt: Date;
}

const NotificationSettingsSchema = new Schema<INotificationSettings>(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    sellerName: { type: String, default: "Reena", trim: true },
    sellerWhatsappNumbers: { type: [String], default: ["919833100194"] },
    sellerEmails: { type: [String], default: [] },
    sendSellerWhatsApp: { type: Boolean, default: true },
    sendSellerEmail: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const NotificationSettings =
  mongoose.models.NotificationSettings ||
  mongoose.model<INotificationSettings>(
    "NotificationSettings",
    NotificationSettingsSchema
  );

export default NotificationSettings;
