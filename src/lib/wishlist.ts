const KEY = "prettypetals_wishlist";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getWishlist(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(list: string[]) {
  if (!isBrowser()) return;
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("wishlist-updated", { detail: list }));
}

export function addToWishlist(productId: string): string[] {
  const list = getWishlist();
  if (!list.includes(productId)) {
    list.push(productId);
    save(list);
  }
  return list;
}

export function removeFromWishlist(productId: string): string[] {
  const list = getWishlist().filter((id) => id !== productId);
  save(list);
  return list;
}

export function isInWishlist(productId: string): boolean {
  return getWishlist().includes(productId);
}

export function toggleWishlist(productId: string): {
  wishlisted: boolean;
  list: string[];
} {
  const list = getWishlist();
  const index = list.indexOf(productId);
  if (index > -1) {
    list.splice(index, 1);
    save(list);
    return { wishlisted: false, list };
  }
  list.push(productId);
  save(list);
  return { wishlisted: true, list };
}
