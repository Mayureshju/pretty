import { connectDB } from "@/lib/db";
import Offer from "@/models/Offer";

export async function GET() {
  try {
    await connectDB();

    const now = new Date();
    const filter = {
      isActive: true,
      $and: [
        { $or: [{ validFrom: { $exists: false } }, { validFrom: null }, { validFrom: { $lte: now } }] },
        { $or: [{ validTo: { $exists: false } }, { validTo: null }, { validTo: { $gte: now } }] },
      ],
    };

    const offers = await Offer.find(filter)
      .select("title description highlight code icon order")
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return Response.json({ offers });
  } catch (err) {
    console.error("GET /api/offers error:", err);
    return Response.json({ offers: [] });
  }
}
