"use client";

import { useState, useEffect, use, useCallback } from "react";

interface DeliveryOrder {
  orderNumber: string;
  status: string;
  deliverySlot: string | null;
  receiverName: string;
  receiverPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  messageOnCard: string;
  floristInstruction: string;
  items: { name: string; quantity: number }[];
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  processing: "Being Prepared",
  "out-for-delivery": "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export default function DeliveryUpdatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [order, setOrder] = useState<DeliveryOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/delivery/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not load order");
      } else {
        setOrder(data);
      }
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const update = async (status: string) => {
    setSaving(status);
    setError(null);
    try {
      const res = await fetch(`/api/delivery/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Update failed");
      } else {
        setDone(status);
        setOrder((o) => (o ? { ...o, status: data.status } : o));
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(null);
    }
  };

  const wrap: React.CSSProperties = {
    minHeight: "100vh",
    background: "#f5f5f0",
    fontFamily: "Arial, Helvetica, sans-serif",
    padding: 16,
    display: "flex",
    justifyContent: "center",
  };

  if (loading) {
    return (
      <div style={{ ...wrap, alignItems: "center" }}>
        <p style={{ color: "#555" }}>Loading order…</p>
      </div>
    );
  }

  if (error && !order) {
    return (
      <div style={{ ...wrap, alignItems: "center" }}>
        <div style={{ textAlign: "center", color: "#b00" }}>
          <p style={{ fontSize: 18, fontWeight: 700 }}>Link not valid</p>
          <p style={{ marginTop: 8, color: "#555" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const isDelivered = order.status === "delivered";

  return (
    <div style={wrap}>
      <div
        style={{
          width: "100%",
          maxWidth: 460,
          background: "#fff",
          borderRadius: 14,
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          overflow: "hidden",
        }}
      >
        <div style={{ background: "#737530", color: "#fff", padding: "18px 20px" }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Pretty Petals — Delivery</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 2 }}>
            Order {order.orderNumber}
          </div>
        </div>

        <div style={{ padding: 20 }}>
          <div
            style={{
              display: "inline-block",
              padding: "4px 12px",
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              background: isDelivered ? "#E8F5E9" : "#FFF8E1",
              color: isDelivered ? "#1B5E20" : "#7a5b00",
              marginBottom: 16,
            }}
          >
            {STATUS_LABEL[order.status] || order.status}
          </div>

          <Section title="Deliver To">
            <b>{order.receiverName}</b>
            {order.receiverPhone && (
              <>
                <br />
                <a href={`tel:${order.receiverPhone}`} style={{ color: "#737530" }}>
                  {order.receiverPhone}
                </a>
              </>
            )}
            <br />
            {order.address}
            <br />
            {[order.city, order.state, order.pincode].filter(Boolean).join(", ")}
          </Section>

          {order.deliverySlot && (
            <Section title="Delivery Date">
              {new Date(
                order.deliverySlot.length === 10
                  ? order.deliverySlot + "T00:00:00"
                  : order.deliverySlot
              ).toLocaleDateString("en-IN", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Section>
          )}

          <Section title="Items">
            {order.items.map((it, i) => (
              <div key={i}>
                {it.name} × {it.quantity}
              </div>
            ))}
          </Section>

          {order.messageOnCard && (
            <Section title="Message on Card">
              <i>{order.messageOnCard}</i>
            </Section>
          )}
          {order.floristInstruction && (
            <Section title="Florist Instruction">{order.floristInstruction}</Section>
          )}

          {(order.address || order.pincode) && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                [order.address, order.city, order.state, order.pincode]
                  .filter(Boolean)
                  .join(", ")
              )}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: "10px",
                border: "1px solid #737530",
                color: "#737530",
                borderRadius: 8,
                textDecoration: "none",
                fontWeight: 600,
                marginBottom: 16,
              }}
            >
              Open in Google Maps
            </a>
          )}

          {error && (
            <p style={{ color: "#b00", fontSize: 13, marginBottom: 10 }}>{error}</p>
          )}

          {done && (
            <p
              style={{
                background: "#E8F5E9",
                color: "#1B5E20",
                padding: "10px 12px",
                borderRadius: 8,
                fontSize: 14,
                marginBottom: 12,
                textAlign: "center",
              }}
            >
              Status updated to {STATUS_LABEL[done] || done}. Thank you!
            </p>
          )}

          {!isDelivered && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <BigButton
                disabled={!!saving}
                loading={saving === "out-for-delivery"}
                onClick={() => update("out-for-delivery")}
                variant="outline"
              >
                Mark Out for Delivery
              </BigButton>
              <BigButton
                disabled={!!saving}
                loading={saving === "delivered"}
                onClick={() => update("delivered")}
                variant="solid"
              >
                Mark Delivered
              </BigButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: 0.5,
          color: "#999",
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div style={{ fontSize: 14, color: "#333", lineHeight: 1.5 }}>{children}</div>
    </div>
  );
}

function BigButton({
  children,
  onClick,
  disabled,
  loading,
  variant,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant: "solid" | "outline";
}) {
  const solid = variant === "solid";
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: "14px",
        borderRadius: 10,
        fontSize: 16,
        fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        border: solid ? "none" : "2px solid #737530",
        background: solid ? "#737530" : "#fff",
        color: solid ? "#fff" : "#737530",
        opacity: disabled && !loading ? 0.6 : 1,
      }}
    >
      {loading ? "Saving…" : children}
    </button>
  );
}
