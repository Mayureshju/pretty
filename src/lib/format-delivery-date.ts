const IST = "Asia/Kolkata";
const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

function parseDeliverySlot(slot: string | Date): Date {
  if (slot instanceof Date) return slot;
  const raw = slot.trim();
  if (DATE_ONLY.test(raw)) {
    return new Date(`${raw}T00:00:00+05:30`);
  }
  return new Date(raw);
}

/** Format a delivery slot as the India calendar day (not the runtime TZ). */
export function formatDeliveryDate(
  slot: string | Date | undefined | null,
  options?: { includeYear?: boolean }
): string {
  if (!slot) return "";
  const raw = typeof slot === "string" ? slot.trim() : slot;
  if (!raw) return "";
  const instant = parseDeliverySlot(raw);
  if (isNaN(instant.getTime())) {
    return typeof slot === "string" ? slot : "";
  }
  const fmt: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: IST,
  };
  if (options?.includeYear !== false) {
    fmt.year = "numeric";
  }
  return instant.toLocaleDateString("en-IN", fmt);
}

/** Persist delivery slots as YYYY-MM-DD in IST. */
export function normalizeDeliverySlot(slot: string): string {
  const s = slot.trim();
  if (!s) return "";
  if (DATE_ONLY.test(s)) return s;
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-CA", { timeZone: IST });
}
