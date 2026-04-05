/**
 * Backfill User model from existing Customer records that have clerkId.
 * Fetches role from Clerk publicMetadata for each user.
 *
 * Usage:
 *   node scripts/backfill-user-model.mjs [--dry-run]
 */

import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  process.env.MONGODB_URI;

const CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY ||
  "sk_test_tBZQWKDXexuH3DrVxVbBjifdzOMzRD2R8gtDVEl76W";

const DRY_RUN = process.argv.includes("--dry-run");

if (!MONGO_URI) {
  console.error("MONGO_URI environment variable is required");
  process.exit(1);
}

async function getClerkUser(clerkId) {
  const res = await fetch(`https://api.clerk.com/v1/users/${clerkId}`, {
    headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  return await res.json();
}

async function main() {
  console.log(`Backfill User model from Customer records${DRY_RUN ? " (DRY RUN)" : ""}\n`);

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");

  const db = mongoose.connection.db;
  const customersCol = db.collection("customers");
  const usersCol = db.collection("users");

  const customers = await customersCol
    .find({ clerkId: { $exists: true, $ne: null } })
    .toArray();

  console.log(`Found ${customers.length} customers with clerkId\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const customer of customers) {
    try {
      // Check if User record already exists
      const existing = await usersCol.findOne({ clerkId: customer.clerkId });
      if (existing) {
        console.log(`  [skip] ${customer.email} — User record already exists`);
        skipped++;
        continue;
      }

      // Fetch role from Clerk
      let role = "member";
      const clerkUser = await getClerkUser(customer.clerkId);
      if (clerkUser?.public_metadata?.role === "admin") {
        role = "admin";
      }

      if (DRY_RUN) {
        console.log(`  [dry-run] Would create User: ${customer.email} (role: ${role})`);
        created++;
        continue;
      }

      await usersCol.insertOne({
        clerkId: customer.clerkId,
        name: customer.name,
        email: customer.email,
        phone: customer.phone || undefined,
        role,
        createdAt: customer.createdAt || new Date(),
        updatedAt: new Date(),
      });

      console.log(`  [created] ${customer.email} (role: ${role})`);
      created++;

      // Rate limit: 100ms between Clerk API calls
      await new Promise((r) => setTimeout(r, 100));
    } catch (err) {
      console.error(`  [error] ${customer.email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! ${created} created, ${skipped} skipped, ${failed} failed.`);

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
