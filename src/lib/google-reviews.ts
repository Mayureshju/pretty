/**
 * Google Business Profile review sync (DEFERRED).
 *
 * Two-way sync with Google requires OAuth credentials for the Google Business
 * Profile API (accountId, locationId, refresh token). These are NOT configured
 * yet. This module is the intended integration seam:
 *
 *  - pullGoogleReviews(): import Google reviews (rating >= 3) into the Review
 *    collection with source="google" so they show alongside website reviews.
 *  - pushReviewToGoogle(): (Google does not allow programmatic review creation;
 *    instead we surface the "leave a Google review" link in the review flow.)
 *
 * The website review system is fully functional without this; wire it up once
 * GOOGLE_BUSINESS_* env vars are provided.
 */

export interface GoogleReview {
  reviewId: string;
  reviewer: string;
  rating: number;
  comment?: string;
  createTime: string;
}

export function isGoogleSyncConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_BUSINESS_ACCOUNT_ID &&
      process.env.GOOGLE_BUSINESS_LOCATION_ID &&
      process.env.GOOGLE_BUSINESS_REFRESH_TOKEN
  );
}

export async function pullGoogleReviews(): Promise<GoogleReview[]> {
  if (!isGoogleSyncConfigured()) {
    throw new Error(
      "Google Business Profile sync not configured. Set GOOGLE_BUSINESS_ACCOUNT_ID, GOOGLE_BUSINESS_LOCATION_ID, GOOGLE_BUSINESS_REFRESH_TOKEN."
    );
  }
  // TODO: implement once credentials are available.
  return [];
}
