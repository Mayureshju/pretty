const CART_KEY = "prettypetals_cart";

export interface CartItem {
  productId: string;
  name: string;
  slug: string;
  price: number;
  originalPrice: number;
  image: string;
  variant?: string;
  quantity: number;
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getCart(): CartItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCart(cart: CartItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  // Dispatch custom event so other components can react
  window.dispatchEvent(new CustomEvent("cart-updated", { detail: cart }));
}

export function addToCart(item: Omit<CartItem, "quantity">, quantity = 1): CartItem[] {
  const cart = getCart();
  const key = item.variant ? `${item.productId}-${item.variant}` : item.productId;
  const existing = cart.find(
    (c) => (c.variant ? `${c.productId}-${c.variant}` : c.productId) === key
  );

  if (existing) {
    existing.quantity += quantity;
    existing.price = item.price;
    existing.originalPrice = item.originalPrice;
  } else {
    cart.push({ ...item, quantity });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(productId: string, variant?: string): CartItem[] {
  let cart = getCart();
  cart = cart.filter((c) => {
    if (variant) return !(c.productId === productId && c.variant === variant);
    return c.productId !== productId;
  });
  saveCart(cart);
  return cart;
}

export function updateCartQuantity(
  productId: string,
  quantity: number,
  variant?: string
): CartItem[] {
  const cart = getCart();
  const item = cart.find((c) => {
    if (variant) return c.productId === productId && c.variant === variant;
    return c.productId === productId;
  });

  if (item) {
    if (quantity <= 0) {
      return removeFromCart(productId, variant);
    }
    item.quantity = quantity;
  }

  saveCart(cart);
  return cart;
}

export function clearCart(): CartItem[] {
  saveCart([]);
  return [];
}

export function getCartCount(): number {
  return getCart().reduce((sum, item) => sum + item.quantity, 0);
}

export function getCartTotal(): number {
  return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
}
