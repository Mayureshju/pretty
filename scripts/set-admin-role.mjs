/**
 * Sets admin role for given email addresses in BOTH Clerk and MongoDB.
 *
 * Usage:
 *   node scripts/set-admin-role.mjs email1@example.com email2@example.com
 *
 * Reads CLERK_SECRET_KEY and MONGO_URI from .env.local automatically.
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { MongoClient } from "mongodb";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = resolve(__dirname, "..", ".env.local");
  try {
    const content = readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eqIdx = trimmed.indexOf("=");
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    // .env.local not found, rely on existing env vars
  }
}

loadEnv();

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
const MONGO_URI = process.env.MONGO_URI;

if (!CLERK_SECRET_KEY) {
  console.error("Missing CLERK_SECRET_KEY");
  process.exit(1);
}
if (!MONGO_URI) {
  console.error("Missing MONGO_URI");
  process.exit(1);
}

const emails = process.argv.slice(2);
if (emails.length === 0) {
  console.error("Usage: node scripts/set-admin-role.mjs <email1> [email2] ...");
  process.exit(1);
}

async function findClerkUserByEmail(email) {
  const res = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    { headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` } }
  );
  if (!res.ok) return null;
  const users = await res.json();
  return users?.[0] || null;
}

async function setClerkAdminRole(userId) {
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ public_metadata: { role: "admin" } }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return res.json();
}

async function setMongoAdminRole(db, email) {
  const result = await db
    .collection("users")
    .updateOne({ email: email.toLowerCase() }, { $set: { role: "admin" } });
  return result.matchedCount > 0;
}

async function main() {
  console.log(`\nSetting admin role for ${emails.length} email(s)...\n`);

  const mongo = new MongoClient(MONGO_URI);
  await mongo.connect();
  const db = mongo.db();

  let success = 0;
  let failed = 0;

  for (const email of emails) {
    const lower = email.toLowerCase();
    try {
      // Clerk
      const clerkUser = await findClerkUserByEmail(lower);
      if (!clerkUser) {
        console.log(`  [skip] ${lower} — no Clerk user found`);
        failed++;
        continue;
      }
      await setClerkAdminRole(clerkUser.id);
      console.log(`  [clerk ✓] ${lower} (${clerkUser.id})`);

      // MongoDB
      const mongoUpdated = await setMongoAdminRole(db, lower);
      if (mongoUpdated) {
        console.log(`  [mongo ✓] ${lower}`);
      } else {
        console.log(`  [mongo –] ${lower} — no matching doc in users collection`);
      }

      success++;
    } catch (err) {
      console.error(`  [error] ${lower}: ${err.message}`);
      failed++;
    }
  }

  await mongo.close();
  console.log(`\nDone! ${success} set, ${failed} failed.\n`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});


// node scripts/set-admin-role.mjs your-email@example.com