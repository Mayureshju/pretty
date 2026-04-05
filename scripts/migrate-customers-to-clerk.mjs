/**
 * Migrate existing customers from MongoDB to Clerk.
 * Creates Clerk accounts for customers who don't have a clerkId yet.
 *
 * Usage:
 *   node scripts/migrate-customers-to-clerk.mjs --dry-run   (preview)
 *   node scripts/migrate-customers-to-clerk.mjs              (apply)
 */

import mongoose from "mongoose";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://mayuresh:IoDL89RcuajN2AKz@complianceone.obgaz.mongodb.net/new-test-db?retryWrites=true&w=majority";

const CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY ||
  "sk_test_tBZQWKDXexuH3DrVxVbBjifdzOMzRD2R8gtDVEl76W";

const dryRun = process.argv.includes("--dry-run");

async function createClerkUser(customer) {
  const body = {
    email_address: [customer.email],
    first_name: customer.name?.first || "",
    last_name: customer.name?.last || "",
    skip_password_requirement: true,
  };

  if (customer.phone) {
    body.phone_number = [customer.phone];
  }

  const res = await fetch("https://api.clerk.com/v1/users", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json();
    // If user already exists by email, try to find them
    if (err.errors?.[0]?.code === "form_identifier_exists") {
      return { exists: true, error: err };
    }
    throw new Error(`Clerk API error: ${JSON.stringify(err)}`);
  }

  return await res.json();
}

async function findClerkUserByEmail(email) {
  const res = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      },
    }
  );

  if (!res.ok) return null;

  const users = await res.json();
  return users?.[0] || null;
}

async function main() {
  console.log(`Mode: ${dryRun ? "DRY RUN (no changes)" : "LIVE"}\n`);
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected!\n");

  const db = mongoose.connection.db;
  const customers = db.collection("customers");

  // Find customers without clerkId
  const toMigrate = await customers
    .find({
      $or: [
        { clerkId: { $exists: false } },
        { clerkId: null },
        { clerkId: "" },
      ],
    })
    .toArray();

  const alreadyLinked = await customers.countDocuments({
    clerkId: { $exists: true, $ne: null, $ne: "" },
  });

  console.log(`Customers already linked to Clerk: ${alreadyLinked}`);
  console.log(`Customers to migrate: ${toMigrate.length}\n`);

  if (toMigrate.length === 0) {
    console.log("Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  let created = 0;
  let linked = 0;
  let skipped = 0;
  let errors = 0;

  for (let i = 0; i < toMigrate.length; i++) {
    const customer = toMigrate[i];
    const email = customer.email;

    if (!email) {
      console.log(`  [skip] ${customer._id} - no email`);
      skipped++;
      continue;
    }

    if (dryRun) {
      console.log(
        `  [would create] ${email} (${customer.name?.first || ""} ${customer.name?.last || ""})`
      );
      created++;
      continue;
    }

    try {
      // Try to create the user in Clerk
      const result = await createClerkUser(customer);

      if (result.exists) {
        // User already exists in Clerk - find and link
        const existing = await findClerkUserByEmail(email);
        if (existing) {
          await customers.updateOne(
            { _id: customer._id },
            { $set: { clerkId: existing.id } }
          );
          console.log(`  [linked] ${email} -> ${existing.id}`);
          linked++;
        } else {
          console.log(`  [skip] ${email} - exists in Clerk but not found`);
          skipped++;
        }
      } else {
        // New user created
        await customers.updateOne(
          { _id: customer._id },
          { $set: { clerkId: result.id } }
        );
        console.log(`  [created] ${email} -> ${result.id}`);
        created++;
      }

      // Rate limit: Clerk has limits, add small delay
      if ((i + 1) % 10 === 0) {
        await new Promise((r) => setTimeout(r, 1000));
        console.log(`  ... processed ${i + 1}/${toMigrate.length}`);
      }
    } catch (err) {
      console.error(`  [error] ${email}: ${err.message}`);
      errors++;
    }
  }

  console.log("\n--- Summary ---");
  console.log(`Total customers:    ${toMigrate.length}`);
  console.log(`Created in Clerk:   ${created}`);
  console.log(`Linked existing:    ${linked}`);
  console.log(`Skipped:            ${skipped}`);
  console.log(`Errors:             ${errors}`);

  if (dryRun) {
    console.log("\n(Dry run — no changes were made)");
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
