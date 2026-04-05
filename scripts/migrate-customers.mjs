/**
 * Migrate Customer collection data into User and GuestUser collections.
 *
 * - Customers WITH clerkId → merge addresses, order metrics, WP fields into User
 * - Customers WITHOUT clerkId → upsert into GuestUser by email
 * - After migration, renames "customers" → "customers_archive"
 *
 * Usage:
 *   node scripts/migrate-customers.mjs [--dry-run]
 */

import mongoose from "mongoose";

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
const DRY_RUN = process.argv.includes("--dry-run");

if (!MONGO_URI) {
  console.error("MONGO_URI environment variable is required");
  process.exit(1);
}

async function main() {
  console.log(
    `Migrate Customer → User/GuestUser${DRY_RUN ? " (DRY RUN)" : ""}\n`
  );

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB\n");

  const db = mongoose.connection.db;
  const customersCol = db.collection("customers");
  const usersCol = db.collection("users");
  const guestUsersCol = db.collection("guestusers");

  const customers = await customersCol.find({}).toArray();
  console.log(`Found ${customers.length} total customers\n`);

  let usersMerged = 0;
  let usersCreated = 0;
  let guestsUpserted = 0;
  let errors = 0;

  for (const customer of customers) {
    try {
      if (customer.clerkId) {
        // Customer has a Clerk account → merge into User record
        const mergeData = {};

        if (customer.addresses?.length > 0) {
          mergeData.addresses = customer.addresses;
        }
        if (customer.orderCount > 0) {
          mergeData.orderCount = customer.orderCount;
        }
        if (customer.totalSpent > 0) {
          mergeData.totalSpent = customer.totalSpent;
        }
        if (customer.lastOrderDate) {
          mergeData.lastOrderDate = customer.lastOrderDate;
        }
        if (customer.wpCustomerId) {
          mergeData.wpCustomerId = customer.wpCustomerId;
        }
        if (customer.wpUserId) {
          mergeData.wpUserId = customer.wpUserId;
        }

        if (Object.keys(mergeData).length === 0) {
          console.log(
            `  [skip] ${customer.email} — clerkId user, no extra data to merge`
          );
          continue;
        }

        if (DRY_RUN) {
          console.log(
            `  [dry-run] Would merge into User: ${customer.email} (${Object.keys(mergeData).join(", ")})`
          );
          usersMerged++;
          continue;
        }

        const result = await usersCol.updateOne(
          { clerkId: customer.clerkId },
          { $set: mergeData }
        );

        if (result.matchedCount > 0) {
          console.log(`  [merged] ${customer.email} → User`);
          usersMerged++;
        } else {
          // User record doesn't exist — create it
          await usersCol.insertOne({
            clerkId: customer.clerkId,
            name: customer.name,
            email: customer.email,
            phone: customer.phone || undefined,
            role: "member",
            ...mergeData,
            createdAt: customer.createdAt || new Date(),
            updatedAt: new Date(),
          });
          console.log(`  [created] ${customer.email} → User (no existing User record)`);
          usersCreated++;
        }
      } else {
        // Customer without Clerk account → upsert into GuestUser
        const guestData = {
          name: customer.name,
          phone: customer.phone || undefined,
          source: "woocommerce-import",
        };

        if (customer.addresses?.length > 0) {
          guestData.addresses = customer.addresses;
        }
        if (customer.orderCount > 0) {
          guestData.orderCount = customer.orderCount;
        }
        if (customer.totalSpent > 0) {
          guestData.totalSpent = customer.totalSpent;
        }
        if (customer.lastOrderDate) {
          guestData.lastOrderDate = customer.lastOrderDate;
        }

        if (DRY_RUN) {
          console.log(
            `  [dry-run] Would upsert GuestUser: ${customer.email}`
          );
          guestsUpserted++;
          continue;
        }

        await guestUsersCol.updateOne(
          { email: customer.email },
          {
            $set: guestData,
            $setOnInsert: {
              email: customer.email,
              convertedToMember: false,
              createdAt: customer.createdAt || new Date(),
            },
          },
          { upsert: true }
        );

        console.log(`  [upserted] ${customer.email} → GuestUser`);
        guestsUpserted++;
      }
    } catch (err) {
      console.error(`  [error] ${customer.email}: ${err.message}`);
      errors++;
    }
  }

  console.log(
    `\nSummary: ${usersMerged} users merged, ${usersCreated} users created, ${guestsUpserted} guests upserted, ${errors} errors`
  );

  // Archive the customers collection
  if (!DRY_RUN && errors === 0) {
    try {
      await customersCol.rename("customers_archive");
      console.log("\n✓ Renamed 'customers' → 'customers_archive'");
    } catch (err) {
      console.error(
        `\nFailed to rename collection: ${err.message}. You may need to drop/rename manually.`
      );
    }
  } else if (errors > 0) {
    console.log(
      "\n⚠ Skipping collection rename due to errors. Fix errors and re-run."
    );
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
