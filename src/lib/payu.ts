import crypto from "crypto";

const MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY || "gtKFFx";
const MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT || "eCwWELxi";
const PAYU_BASE_URL = process.env.PAYU_BASE_URL || "https://test.payu.in/_payment";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export interface PayUParams {
  txnid: string;
  amount: string;
  productinfo: string;
  firstname: string;
  email: string;
  phone?: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
}

/**
 * Generate SHA-512 hash for PayU payment
 * Format: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||salt
 */
export function generatePayUHash(params: PayUParams): string {
  const hashString = [
    MERCHANT_KEY,
    params.txnid,
    params.amount,
    params.productinfo,
    params.firstname,
    params.email,
    params.udf1 || "",
    params.udf2 || "",
    params.udf3 || "",
    params.udf4 || "",
    params.udf5 || "",
    "", "", "", "", "",
    MERCHANT_SALT,
  ].join("|");

  return crypto.createHash("sha512").update(hashString).digest("hex");
}

/**
 * Verify PayU response hash (reverse hash)
 * Format: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key
 */
export function verifyPayUResponse(params: Record<string, string>): boolean {
  const reverseHashString = [
    MERCHANT_SALT,
    params.status,
    "", "", "", "", "",
    params.udf5 || "",
    params.udf4 || "",
    params.udf3 || "",
    params.udf2 || "",
    params.udf1 || "",
    params.email,
    params.firstname,
    params.productinfo,
    params.amount,
    params.txnid,
    params.key,
  ].join("|");

  const expectedHash = crypto.createHash("sha512").update(reverseHashString).digest("hex");
  return expectedHash === params.hash;
}

/**
 * Generate complete PayU form data for payment
 */
export function getPayUFormData(params: PayUParams) {
  const hash = generatePayUHash(params);

  return {
    key: MERCHANT_KEY,
    txnid: params.txnid,
    amount: params.amount,
    productinfo: params.productinfo,
    firstname: params.firstname,
    email: params.email,
    phone: params.phone || "",
    surl: `${BASE_URL}/api/payu/success`,
    furl: `${BASE_URL}/api/payu/failure`,
    hash,
    udf1: params.udf1 || "",
    udf2: params.udf2 || "",
    udf3: params.udf3 || "",
    udf4: params.udf4 || "",
    udf5: params.udf5 || "",
    action: PAYU_BASE_URL,
  };
}

/**
 * Generate unique transaction ID
 */
export function generateTxnId(): string {
  return `PP${Date.now()}${Math.random().toString(36).substring(2, 8)}`;
}
