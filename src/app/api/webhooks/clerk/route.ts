import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import GuestUser from "@/models/GuestUser";

export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return Response.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  await connectDB();

  switch (evt.type) {
    case "user.created": {
      const {
        id,
        first_name,
        last_name,
        email_addresses,
        phone_numbers,
        public_metadata,
      } = evt.data;
      const email = email_addresses?.[0]?.email_address;

      if (!email) break;

      const emailLower = email.toLowerCase();
      const role =
        (public_metadata as { role?: string })?.role === "admin"
          ? "admin"
          : "member";

      // Check if there's an existing GuestUser to merge data from
      const existingGuest = await GuestUser.findOne({
        email: emailLower,
      }).lean();

      const userData: Record<string, unknown> = {
        clerkId: id,
        name: {
          first: first_name || "",
          last: last_name || "",
        },
        email: emailLower,
        phone: phone_numbers?.[0]?.phone_number || undefined,
        role,
      };

      // Merge guest data into the new User record
      if (existingGuest) {
        if (existingGuest.addresses?.length > 0) {
          userData.addresses = existingGuest.addresses;
        }
        if (existingGuest.orderCount > 0) {
          userData.orderCount = existingGuest.orderCount;
        }
        if (existingGuest.totalSpent > 0) {
          userData.totalSpent = existingGuest.totalSpent;
        }
        if (existingGuest.lastOrderDate) {
          userData.lastOrderDate = existingGuest.lastOrderDate;
        }
      }

      // Create or update User record
      const existingUser = await User.findOne({ email: emailLower });
      if (existingUser) {
        if (!existingUser.clerkId || existingUser.clerkId !== id) {
          existingUser.clerkId = id;
          existingUser.role = role;
          await existingUser.save();
        }
      } else {
        await User.create(userData);
      }

      // Mark GuestUser records as converted
      await GuestUser.updateMany(
        { email: emailLower, convertedToMember: false },
        { $set: { convertedToMember: true, convertedAt: new Date() } }
      );

      // Auto-add user to the PrettyPetals organization
      const orgId = process.env.CLERK_ORG_ID;
      if (orgId) {
        try {
          const clerk = await clerkClient();
          await (clerk.organizations as any).addMember({
            organizationId: orgId,
            userId: id,
            role: "org:member",
          });
        } catch (err) {
          console.error("Failed to add user to organization:", err);
        }
      }

      break;
    }

    case "user.updated": {
      const {
        id,
        first_name,
        last_name,
        email_addresses,
        phone_numbers,
        public_metadata,
      } = evt.data;
      const email = email_addresses?.[0]?.email_address;

      if (!email) break;

      const role =
        (public_metadata as { role?: string })?.role === "admin"
          ? "admin"
          : "member";

      await User.findOneAndUpdate(
        { clerkId: id },
        {
          $set: {
            "name.first": first_name || "",
            "name.last": last_name || "",
            email: email.toLowerCase(),
            phone: phone_numbers?.[0]?.phone_number || undefined,
            role,
          },
        }
      );
      break;
    }

    case "user.deleted": {
      const { id } = evt.data;
      if (id) {
        await User.findOneAndDelete({ clerkId: id });
      }
      break;
    }
  }

  return Response.json({ received: true });
}
