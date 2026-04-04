"use client";

import React, { useState } from "react";
import toast from "react-hot-toast";

type TabKey = "store" | "tax" | "notifications";

const TABS: { key: TabKey; label: string }[] = [
  { key: "store", label: "Store Info" },
  { key: "tax", label: "Tax" },
  { key: "notifications", label: "Notifications" },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("store");

  // Store Info
  const [storeName, setStoreName] = useState("Pretty Petals");
  const [storeAddress, setStoreAddress] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [storeEmail, setStoreEmail] = useState("");

  // Tax
  const [gstRate, setGstRate] = useState("18");
  const [hsnCode, setHsnCode] = useState("");

  // Notifications
  const [notifyOrderPlaced, setNotifyOrderPlaced] = useState(true);
  const [notifyOrderShipped, setNotifyOrderShipped] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(false);

  function handleSave() {
    toast.success("Settings saved!");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1C2120]">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure your store settings
        </p>
      </div>

      {/* Tabs */}
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

      {/* Tab Content */}
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
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
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-700 placeholder-gray-400 focus:border-[#737530] focus:ring-1 focus:ring-[#737530]/20 focus:outline-none transition-colors"
              />
            </div>
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-[#1C2120]">
                  Order Placed
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive an email when a new order is placed
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyOrderPlaced(!notifyOrderPlaced)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifyOrderPlaced ? "bg-[#737530]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifyOrderPlaced ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <div>
                <p className="text-sm font-medium text-[#1C2120]">
                  Order Shipped
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Receive an email when an order is shipped
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyOrderShipped(!notifyOrderShipped)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifyOrderShipped ? "bg-[#737530]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifyOrderShipped ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium text-[#1C2120]">
                  Low Stock Alert
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get notified when product stock is running low
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNotifyLowStock(!notifyLowStock)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifyLowStock ? "bg-[#737530]" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    notifyLowStock ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-[#737530] text-white text-sm font-medium rounded-lg hover:bg-[#0A3A4D] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
