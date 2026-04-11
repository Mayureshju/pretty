import mongoose, { Schema, Document } from "mongoose";

export interface IGlobalSettings extends Document {
  key: string;
  blockedDeliveryDates: Date[];
  updatedAt: Date;
}

const GlobalSettingsSchema = new Schema<IGlobalSettings>(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    blockedDeliveryDates: [{ type: Date }],
  },
  { timestamps: true }
);

const GlobalSettings =
  mongoose.models.GlobalSettings ||
  mongoose.model<IGlobalSettings>("GlobalSettings", GlobalSettingsSchema);

export default GlobalSettings;
