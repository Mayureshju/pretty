"use client";

import { useState, useEffect, use } from "react";
import { format } from "date-fns";

interface OrderDetail {
  _id: string;
  orderNumber: string;
  customer: { name: string; email: string; phone?: string };
  items: {
    product?: { _id: string; name: string; images?: { url: string }[] } | string;
    productName?: string;
    variant?: string;
    quantity: number;
    price: number;
    total: number;
  }[];
  shipping: {
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    receiverName?: string;
    receiverPhone?: string;
  };
  pricing: { subtotal: number; discount: number; couponCode?: string; shipping: number; total: number };
  payment: { method?: string; status: string; transactionId?: string };
  invoice: { number?: string; date?: string };
  deliverySlot?: string;
  createdAt: string;
}

const COMPANY = {
  name: "Pretty Petals",
  address: "Shop No. 3, 15A, Gagangiri CHS Off Carter Rd",
  address2: "Golf Link Road, Union Park, Khar West",
  city: "Mumbai, MH, 400052",
  country: "India",
  phone: "9833100194 / 8369224582",
  email: "support@prettypetals.com",
  gstin: "27AAMPS9904P1ZN",
};

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/orders/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setOrder(data);
        setLoading(false);
        if (data) setTimeout(() => window.print(), 500);
      })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading invoice...</div>;
  if (!order) return <div style={{ padding: 40, textAlign: "center" }}>Order not found</div>;

  const getItemName = (item: OrderDetail["items"][0]) => {
    if (item.productName) return item.productName;
    if (typeof item.product === "object" && item.product?.name) return item.product.name;
    return "Product";
  };

  const getItemImage = (item: OrderDetail["items"][0]) => {
    if (typeof item.product === "object" && item.product?.images?.[0]?.url) return item.product.images[0].url;
    return null;
  };

  return (
    <>
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 10mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #111; background: #fff; }
        .invoice-page { max-width: 800px; margin: 0 auto; padding: 20px; }
        .title { font-size: 36px; font-weight: bold; color: #c0392b; margin-bottom: 10px; }
        .header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 10px; }
        .logo { height: 50px; margin-bottom: 10px; }
        .company-info { font-size: 12px; color: #333; line-height: 1.5; margin-bottom: 20px; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
        .grid-3 h4 { font-size: 13px; font-weight: bold; margin-bottom: 6px; }
        .grid-3 p { font-size: 12px; line-height: 1.5; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #f5f5f5; padding: 8px 10px; text-align: left; font-size: 12px; font-weight: bold; border-bottom: 2px solid #ddd; }
        td { padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 12px; vertical-align: middle; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals td { border-bottom: none; }
        .totals .total-row td { font-weight: bold; font-size: 14px; border-top: 2px solid #333; }
        .item-img { width: 40px; height: 40px; object-fit: cover; border-radius: 4px; }
        .payment-info { font-size: 12px; margin-top: 10px; }
        .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 10px 24px; background: #737530; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; z-index: 100; }
        .print-btn:hover { background: #4C4D27; }
      `}</style>

      <button className="no-print print-btn" onClick={() => window.print()}>
        Print / Download PDF
      </button>

      <div className="invoice-page">
        <div className="header">
          <div className="title">INVOICE</div>
          <img src="/logo11.webp" alt="Pretty Petals" className="logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>

        <div className="company-info">
          <strong>{COMPANY.name}</strong><br />
          {COMPANY.address}<br />
          {COMPANY.address2}<br />
          {COMPANY.city}<br />
          {COMPANY.country}<br />
          Pretty Petals +91 9833100194<br />
          {COMPANY.gstin}
        </div>

        <div className="grid-3">
          <div>
            <h4>Billing Address:</h4>
            <p>
              {order.customer.name}<br />
              {order.shipping.city || "Mumbai"}<br />
              Email: {order.customer.email}
              {order.customer.phone && <><br />Phone: +91{order.customer.phone}</>}
            </p>
          </div>
          <div>
            <h4>Shipping Address:</h4>
            <p>
              {order.customer.name}<br />
              {order.shipping.city || "Mumbai"}<br />
              Email: {order.customer.email}
              {order.customer.phone && <><br />Phone: +91{order.customer.phone}</>}
            </p>
          </div>
          <div>
            <p>
              <strong>Invoice Date:</strong>{" "}
              {order.invoice?.date
                ? format(new Date(order.invoice.date), "dd-MM-yyyy")
                : format(new Date(order.createdAt), "dd-MM-yyyy")}
            </p>
            <p>
              <strong>Invoice No.:</strong>{" "}
              {order.invoice?.number || `WEB-${order.orderNumber}`}
            </p>
            <p>
              <strong>Order No.:</strong>{" "}
              {order.orderNumber}
            </p>
            <p>
              <strong>Order Date:</strong>{" "}
              {format(new Date(order.createdAt), "dd-MM-yyyy")}
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>S.NO</th>
              <th>IMAGE</th>
              <th>SKU</th>
              <th>PRODUCT</th>
              <th className="text-center">QUANTITY</th>
              <th className="text-right">PRICE</th>
              <th className="text-right">TOTAL PRICE</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => {
              const img = getItemImage(item);
              return (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>
                    {img ? (
                      <img src={img} alt="" className="item-img" />
                    ) : (
                      <div style={{ width: 40, height: 40, background: "#f0f0f0", borderRadius: 4 }} />
                    )}
                  </td>
                  <td></td>
                  <td>{getItemName(item)}{item.variant ? ` (${item.variant})` : ""}</td>
                  <td className="text-center">{item.quantity}</td>
                  <td className="text-right">&#8377;{item.price.toLocaleString("en-IN")}</td>
                  <td className="text-right">&#8377;{item.total.toLocaleString("en-IN")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <table className="totals" style={{ width: 300, marginLeft: "auto" }}>
          <tbody>
            <tr>
              <td>Subtotal</td>
              <td className="text-right">&#8377;{order.pricing.subtotal.toLocaleString("en-IN")}</td>
            </tr>
            {order.pricing.discount > 0 && (
              <tr>
                <td>Discount{order.pricing.couponCode ? ` (${order.pricing.couponCode})` : ""}</td>
                <td className="text-right">-&#8377;{order.pricing.discount.toLocaleString("en-IN")}</td>
              </tr>
            )}
            <tr>
              <td>Shipping</td>
              <td className="text-right">
                {order.pricing.shipping === 0
                  ? "Shipping cost for city"
                  : `₹${order.pricing.shipping.toLocaleString("en-IN")}`}
              </td>
            </tr>
            <tr className="total-row">
              <td>Total</td>
              <td className="text-right">&#8377;{order.pricing.total.toLocaleString("en-IN")}</td>
            </tr>
          </tbody>
        </table>

        <div className="payment-info">
          <strong>Payment method:</strong> {order.payment.method || "PayUBiz"}
        </div>
      </div>
    </>
  );
}
