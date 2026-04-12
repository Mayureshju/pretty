const DELIVERY_KEY = "prettypetals_delivery";

export interface SavedDeliveryInfo {
  pincode: string;
  city: string;
  state?: string;
  sameDayAvailable: boolean;
  blockedDates: string[];
  deliveryCharge: number;
  freeDeliveryAbove: number | null;
  estimatedTime: string | null;
  deliveryDays: number;
  selectedDate: string | null; // ISO date string
  savedAt: number; // timestamp
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getSavedDelivery(): SavedDeliveryInfo | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(DELIVERY_KEY);
    if (!raw) return null;
    const data: SavedDeliveryInfo = JSON.parse(raw);
    // Expire after 24 hours
    if (Date.now() - data.savedAt > 24 * 60 * 60 * 1000) {
      localStorage.removeItem(DELIVERY_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function saveDeliveryInfo(info: Omit<SavedDeliveryInfo, "savedAt">) {
  if (!isBrowser()) return;
  localStorage.setItem(
    DELIVERY_KEY,
    JSON.stringify({ ...info, savedAt: Date.now() })
  );
}

export function updateSelectedDate(date: string | null) {
  if (!isBrowser()) return;
  const saved = getSavedDelivery();
  if (saved) {
    saved.selectedDate = date;
    saved.savedAt = Date.now();
    localStorage.setItem(DELIVERY_KEY, JSON.stringify(saved));
  }
}

export function clearDeliveryInfo() {
  if (!isBrowser()) return;
  localStorage.removeItem(DELIVERY_KEY);
}
