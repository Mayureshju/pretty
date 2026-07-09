import crypto from "crypto";

// Signing key for delivery-boy status links. Reuses an existing strong secret so
// there is no weak hardcoded default; throws if none is configured.
function getSecret(): string {
  const secret =
    process.env.DELIVERY_LINK_SECRET || process.env.CLERK_SECRET_KEY;
  if (!secret) {
    throw new Error(
      "DELIVERY_LINK_SECRET (or CLERK_SECRET_KEY) must be set to sign delivery links"
    );
  }
  return secret;
}

function sign(orderId: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(orderId)
    .digest("base64url")
    .slice(0, 20);
}

export function signOrderToken(orderId: string): string {
  return `${Buffer.from(orderId).toString("base64url")}.${sign(orderId)}`;
}

export function verifyOrderToken(token: string): string | null {
  const [b64, sig] = (token || "").split(".");
  if (!b64 || !sig) return null;
  let orderId: string;
  try {
    orderId = Buffer.from(b64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  const expected = sign(orderId);
  // constant-time compare
  if (
    sig.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  ) {
    return null;
  }
  return orderId;
}

export function getDeliveryLink(orderId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL || "https://www.prettypetals.com"
  ).replace(/\/$/, "");
  return `${base}/delivery/${signOrderToken(orderId)}`;
}
