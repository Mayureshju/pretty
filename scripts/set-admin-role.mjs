/**
 * Bootstrap admin roles in Clerk.
 * Sets publicMetadata.role = "admin" for the given email addresses.
 *
 * Usage:
 *   node scripts/set-admin-role.mjs email1@example.com email2@example.com
 */

const CLERK_SECRET_KEY =
  process.env.CLERK_SECRET_KEY ||
  "sk_test_tBZQWKDXexuH3DrVxVbBjifdzOMzRD2R8gtDVEl76W";

const emails = process.argv.slice(2);

if (emails.length === 0) {
  console.error("Usage: node scripts/set-admin-role.mjs <email1> [email2] ...");
  process.exit(1);
}

async function findUserByEmail(email) {
  const res = await fetch(
    `https://api.clerk.com/v1/users?email_address=${encodeURIComponent(email)}`,
    {
      headers: { Authorization: `Bearer ${CLERK_SECRET_KEY}` },
    }
  );
  if (!res.ok) return null;
  const users = await res.json();
  return users?.[0] || null;
}

async function setAdminRole(userId) {
  const res = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      public_metadata: { role: "admin" },
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(JSON.stringify(err));
  }
  return await res.json();
}

async function main() {
  console.log(`Setting admin role for ${emails.length} email(s)...\n`);

  let success = 0;
  let failed = 0;

  for (const email of emails) {
    try {
      const user = await findUserByEmail(email);
      if (!user) {
        console.log(`  [not found] ${email} — no Clerk user with this email`);
        failed++;
        continue;
      }

      await setAdminRole(user.id);
      console.log(`  [admin set] ${email} (${user.id})`);
      success++;
    } catch (err) {
      console.error(`  [error] ${email}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone! ${success} set, ${failed} failed.`);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
