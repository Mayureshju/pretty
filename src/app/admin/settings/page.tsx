"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

type TabKey = "store" | "tax" | "notifications";

const TABS: { key: TabKey; label: string }[] = [
  { key: "store", label: "Store Info" },
  { key: "tax", label: "Tax" },
  { key: "notifications", label: "Notifications" },
];

const inputClass =
  "w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("store");

  // Store Info (preview-only)
  const [storeName, setStoreName] = useState("Pretty Petals");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("");

  // Tax (preview-only)
  const [gstRate, setGstRate] = useState("18");
  const [hsnCode, setHsnCode] = useState("");

  // Notifications (persisted)
  const [sellerName, setSellerName] = useState("");
  const [sellerWhatsappNumbersInput, setSellerWhatsappNumbersInput] = useState("");
  const [sellerEmailsInput, setSellerEmailsInput] = useState("");
  const [sendSellerWhatsApp, setSendSellerWhatsApp] = useState(true);
  const [sendSellerEmail, setSendSellerEmail] = useState(true);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [notificationsSaving, setNotificationsSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadNotifications() {
      try {
        const res = await fetch("/api/admin/notification-settings");
        if (!res.ok) throw new Error("Failed to load");
        const data = await res.json();
        if (cancelled) return;
        setSellerName(data.sellerName || "");
        setSellerWhatsappNumbersInput(
          Array.isArray(data.sellerWhatsappNumbers)
            ? data.sellerWhatsappNumbers.join(", ")
            : ""
        );
        setSellerEmailsInput(
          Array.isArray(data.sellerEmails) ? data.sellerEmails.join(", ") : ""
        );
        setSendSellerWhatsApp(Boolean(data.sendSellerWhatsApp));
        setSendSellerEmail(Boolean(data.sendSellerEmail));
      } catch (err) {
        console.error(err);
        if (!cancelled) toast.error("Failed to load notification settings");
      } finally {
        if (!cancelled) setNotificationsLoading(false);
      }
    }
    loadNotifications();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleStoreOrTaxSave() {
    toast.success("Settings saved!");
  }

  async function handleNotificationsSave() {
    const emails = sellerEmailsInput
      .split(/[\s,;]+/)
      .map((e) => e.trim())
      .filter(Boolean);

    const phones = sellerWhatsappNumbersInput
      .split(/[\s,;]+/)
      .map((p) => p.replace(/\D/g, ""))
      .filter(Boolean);

    setNotificationsSaving(true);
    try {
      const res = await fetch("/api/admin/notification-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sellerName: sellerName.trim(),
          sellerWhatsappNumbers: phones,
          sellerEmails: emails,
          sendSellerWhatsApp,
          sendSellerEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg =
          data?.details?.fieldErrors &&
          Object.values(data.details.fieldErrors).flat()[0];
        throw new Error(msg || data?.error || "Save failed");
      }
      setSellerName(data.sellerName);
      setSellerWhatsappNumbersInput((data.sellerWhatsappNumbers || []).join(", "));
      setSellerEmailsInput((data.sellerEmails || []).join(", "));
      setSendSellerWhatsApp(data.sendSellerWhatsApp);
      setSendSellerEmail(data.sendSellerEmail);
      toast.success("Notification settings saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Save failed");
    } finally {
      setNotificationsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1C2120]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your store settings
        </p>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? "border-[#737530] text-[#737530]"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        {activeTab === "store" && (
          <div className="space-y-5">
            <div className="bg-[#FFF3E0] rounded-lg p-3 text-sm text-[#E65100]">
              Store settings are coming soon. These fields are for preview only.
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <textarea
                value={storeAddress}
                onChange={(e) => setStoreAddress(e.target.value)}
                rows={3}
                disabled
                placeholder="Store address"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50 placeholder-gray-400 resize-none cursor-not-allowed"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={storePhone}
                  onChange={(e) => setStorePhone(e.target.value)}
                  disabled
                  placeholder="Phone number"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50 placeholder-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={storeEmail}
                  onChange={(e) => setStoreEmail(e.target.value)}
                  disabled
                  placeholder="Email address"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-500 bg-gray-50 placeholder-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleStoreOrTaxSave}
                className="px-5 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === "tax" && (
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Rate (%)
              </label>
              <input
                type="number"
                value={gstRate}
                onChange={(e) => setGstRate(e.target.value)}
                min={0}
                max={100}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
                placeholder="e.g. 0603"
                className={inputClass}
              />
            </div>
            <div className="pt-4 border-t border-gray-100">
              <button
                onClick={handleStoreOrTaxSave}
                className="px-5 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors"
              >
                Save Changes
              </button>
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-5">
            <div className="text-sm text-gray-500">
              Configure who gets notified when a new order is confirmed.
            </div>

            {notificationsLoading ? (
              <div className="py-8 text-center text-sm text-gray-500">
                Loading settings...
              </div>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seller Name
                  </label>
                  <input
                    type="text"
                    value={sellerName}
                    onChange={(e) => setSellerName(e.target.value)}
                    placeholder="e.g. Reena"
                    className={inputClass}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Used in the WhatsApp greeting to the seller.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seller WhatsApp Numbers
                  </label>
                  <textarea
                    value={sellerWhatsappNumbersInput}
                    onChange={(e) =>
                      setSellerWhatsappNumbersInput(e.target.value)
                    }
                    rows={3}
                    placeholder="9821036990, 9833100194"
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated. Each number receives the new-order and
                    delivered WhatsApp templates. 10-digit Indian mobile, with
                    or without 91 prefix. Only digits are saved.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Seller Email Recipients
                  </label>
                  <textarea
                    value={sellerEmailsInput}
                    onChange={(e) => setSellerEmailsInput(e.target.value)}
                    rows={3}
                    placeholder="seller@example.com, ops@example.com"
                    className={`${inputClass} resize-none`}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Comma-separated. Each address receives the new-order email.
                    Leave blank to skip emails.
                  </p>
                </div>

                <div className="flex items-center justify-between py-2 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-sm font-medium text-[#1C2120]">
                      Send WhatsApp alert to seller
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sends the approved WhatsApp template on new paid orders.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendSellerWhatsApp(!sendSellerWhatsApp)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sendSellerWhatsApp ? "bg-[#737530]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sendSellerWhatsApp ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium text-[#1C2120]">
                      Send email alert to seller
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Sends a detailed order email to the recipients above.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSendSellerEmail(!sendSellerEmail)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sendSellerEmail ? "bg-[#737530]" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        sendSellerEmail ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    onClick={handleNotificationsSave}
                    disabled={notificationsSaving}
                    className="px-5 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {notificationsSaving ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
