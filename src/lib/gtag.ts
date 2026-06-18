export const GA_MEASUREMENT_ID = "G-4BHDNG4102";
export const GOOGLE_ADS_ID = "AW-749555857";
export const GOOGLE_ADS_PURCHASE_CONVERSION = `${GOOGLE_ADS_ID}/VE65CPmG1OEbEJGhteUC`;

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    gtag_report_conversion?: (url?: string) => boolean;
  }
}

export interface PurchaseConversionParams {
  value: number;
  currency?: string;
  transactionId: string;
  redirectUrl?: string;
}

export function reportPurchaseConversion({
  value,
  currency = "INR",
  transactionId,
  redirectUrl,
}: PurchaseConversionParams): boolean {
  if (typeof window === "undefined" || typeof window.gtag !== "function") {
    return false;
  }

  const callback = () => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  };

  window.gtag("event", "conversion", {
    send_to: GOOGLE_ADS_PURCHASE_CONVERSION,
    value,
    currency,
    transaction_id: transactionId,
    event_callback: callback,
  });

  return false;
}
