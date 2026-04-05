import { z } from "zod";
import { connectDB } from "@/lib/db";
import GuestUser from "@/models/GuestUser";

const guestSchema = z.object({
  email: z.string().email("Invalid email address").toLowerCase(),
  source: z.string().optional().default("checkout"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = guestSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, source } = parsed.data;

    await connectDB();

    // Dedup: skip if same email + source exists in last 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await GuestUser.findOne({
      email,
      source,
      createdAt: { $gte: oneDayAgo },
    });

    if (!recent) {
      await GuestUser.create({ email, source });
    }

    return Response.json({ success: true });
  } catch {
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
