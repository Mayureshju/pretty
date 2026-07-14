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
  notes?: string;
  deliverySlot?: string;
  floristInstruction?: string;
  messageOnCard?: string;
  createdAt: string;
}

function formatDeliverySlot(iso: string): string {
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  if (isNaN(d.getTime())) return iso;
  return format(d, "EEE, dd MMM yyyy");
}

const COMPANY = {
  domain: "www.prettypetals.com",
  address:
    "Shop No. 3, 15A, Gagangiri CHS Off Carter Rd Golf Link Road, Union Park, Khar West, Mumbai - 400052",
  phone: "Ph: 9833100194 / 8369224582",
};

export default function PackingSlipPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const prevTitle = document.title;
    const clearPrintChrome = () => {
      document.title = " ";
    };
    const restoreTitle = () => {
      document.title = prevTitle;
    };
    window.addEventListener("beforeprint", clearPrintChrome);
    window.addEventListener("afterprint", restoreTitle);

    fetch(`/api/admin/orders/${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        setOrder(data);
        setLoading(false);
        if (data) setTimeout(() => window.print(), 500);
      })
      .catch(() => setLoading(false));

    return () => {
      window.removeEventListener("beforeprint", clearPrintChrome);
      window.removeEventListener("afterprint", restoreTitle);
      document.title = prevTitle;
    };
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: "center" }}>Loading packing slip...</div>;
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
          @page {
            size: A5 portrait;
            margin: 0;
            /* Suppress browser-generated header/footer (URL, page #, date) where supported */
            @top-left { content: none; }
            @top-center { content: none; }
            @top-right { content: none; }
            @bottom-left { content: none; }
            @bottom-center { content: none; }
            @bottom-right { content: none; }
          }
          html, body {
            width: auto;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .slip-page {
            position: relative !important;
            padding: 5mm 6mm 12mm !important;
            max-width: none !important;
            width: 148mm !important;
            min-height: 210mm !important;
            height: 210mm !important;
            display: block !important;
            overflow: hidden !important;
            page-break-after: avoid;
            break-after: avoid;
          }
          .spacer { display: none !important; }
          .footer {
            position: absolute !important;
            left: 6mm;
            right: 6mm;
            bottom: 5mm;
            margin-top: 0 !important;
            padding-top: 4px !important;
            page-break-inside: avoid;
            break-inside: avoid;
          }
          table, tr, td, th { page-break-inside: avoid; }
          .header { margin-bottom: 4px !important; }
          .logo { height: 32px !important; }
          .grid-3 { gap: 6px !important; margin-bottom: 4px !important; }
          .meta-section { margin-bottom: 3px !important; }
          .divider { margin: 4px 0 !important; }
          table { margin-bottom: 4px !important; }
          th, td { padding: 3px 4px !important; }
          .item-img { width: 22px !important; height: 22px !important; }
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        html, body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; background: #fff; }
        .slip-page { max-width: 560px; width: 100%; margin: 0 auto; padding: 14px; display: flex; flex-direction: column; min-height: 100vh; }
        .spacer { flex: 1 1 auto; }
        .title { font-size: 15px; font-weight: bold; color: #111; margin-bottom: 6px; letter-spacing: 0.5px; }
        .header { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 6px; }
        .logo { height: 40px; width: auto; object-fit: contain; }
        .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; margin-bottom: 8px; }
        .grid-3 h4 { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
        .grid-3 p { font-size: 10px; line-height: 1.4; color: #333; }
        .divider { border: none; border-top: 1px solid #ccc; margin: 6px 0; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 6px; }
        th { background: #f5f5f5; padding: 4px 6px; text-align: left; font-size: 10px; font-weight: bold; border-bottom: 1px solid #ddd; }
        td { padding: 4px 6px; border-bottom: 1px solid #eee; font-size: 10px; vertical-align: middle; }
        .text-center { text-align: center; }
        .item-img { width: 26px; height: 26px; object-fit: cover; border-radius: 3px; }
        .meta-section { margin-bottom: 6px; font-size: 10px; line-height: 1.45; }
        .meta-section p { margin-bottom: 2px; }
        .meta-section strong { color: #111; }
        .card-msg { padding: 3px 0 3px 7px; margin-top: 2px; font-style: italic; font-size: 10px; white-space: pre-wrap; border-left: 2px solid #999; }
        .florist-note { padding: 3px 0 3px 7px; margin-top: 2px; font-size: 10px; white-space: pre-wrap; border-left: 2px solid #999; }
        .footer { margin-top: auto; padding-top: 6px; border-top: 1px solid #ccc; font-size: 9px; color: #444; text-align: center; line-height: 1.45; }
        .print-btn { position: fixed; bottom: 20px; right: 20px; padding: 10px 24px; background: #737530; color: #fff; border: none; border-radius: 8px; font-size: 14px; font-weight: 600; cursor: pointer; z-index: 100; }
        .print-btn:hover { background: #4C4D27; }
      `}</style>

      <button className="no-print print-btn" onClick={() => window.print()}>
        Print / Download PDF
      </button>

      <div className="slip-page">
        <div className="header">
          <div className="title">Delivery Challan</div>
          <img src="/logo11.webp" alt="Pretty Petals" className="logo" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
        </div>

        <div className="grid-3">
          <div>
            <h4>Shipping Address:</h4>
            <p>
              {order.shipping.receiverName || order.customer.name}<br />
              {order.shipping.receiverPhone && (
                <>Ph: {order.shipping.receiverPhone}<br /></>
              )}
              {order.shipping.address && <>{order.shipping.address}<br /></>}
              {order.shipping.city}{order.shipping.state && `, ${order.shipping.state}`} {order.shipping.pincode}
            </p>
          </div>
          <div>
            <h4>Billing Address:</h4>
            <p>
              {order.customer.name}<br />
              {order.shipping.city || "Mumbai"}<br />
              Email: {order.customer.email}<br />
              Sender Phone: {order.customer.phone ? `+91 ${order.customer.phone}` : "-"}
            </p>
          </div>
          <div>
            <p>
              <strong>Order No:</strong> {order.orderNumber}
            </p>
            <p>
              <strong>Order Date:</strong>{" "}
              {format(new Date(order.createdAt), "dd-MM-yyyy")}
            </p>
            {order.deliverySlot && (
              <p>
                <strong>Delivery Date:</strong>{" "}
                {formatDeliverySlot(order.deliverySlot)}
              </p>
            )}
          </div>
        </div>

        <hr className="divider" />

        <table>
          <thead>
            <tr>
              <th>S.NO</th>
              <th>IMAGE</th>
              <th>SKU</th>
              <th>PRODUCT</th>
              <th className="text-center">QUANTITY</th>
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
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="meta-section">
          {order.notes && (
            <p><strong>Customer Note:</strong> {order.notes}</p>
          )}
          {order.floristInstruction && (
            <div style={{ marginTop: 6 }}>
              <strong>Florist Instruction:</strong>
              <div className="florist-note">{order.floristInstruction}</div>
            </div>
          )}
          {order.messageOnCard && (
            <div style={{ marginTop: 6 }}>
              <strong>Message on Card:</strong>
              <div className="card-msg">{order.messageOnCard}</div>
            </div>
          )}
        </div>

        <div className="spacer" />

        <div className="footer">
          {COMPANY.address} &nbsp;|&nbsp; {COMPANY.phone}
        </div>
      </div>
    </>
  );
}
