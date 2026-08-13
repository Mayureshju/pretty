const DEFAULT_BASE_URL = "https://www.prettypetals.com";

export function getSiteBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

export function getOrderReviewLink(orderNumber: string): string {
  return `${getSiteBaseUrl()}/review/?order=${encodeURIComponent(orderNumber)}`;
}
