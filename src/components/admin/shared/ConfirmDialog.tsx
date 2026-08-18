"use client";

import React, { useEffect, useState } from "react";
import Modal from "./Modal";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  variant?: "danger" | "warning" | "info";
  /** If set, confirm stays disabled until the user types this exact value. */
  typedConfirm?: string;
}

const variantStyles: Record<
  string,
  { iconBg: string; iconColor: string; buttonBg: string; buttonHoverBg: string }
> = {
  danger: {
    iconBg: "bg-[#FFEBEE]",
    iconColor: "text-[#C62828]",
    buttonBg: "bg-[#C62828]",
    buttonHoverBg: "hover:bg-[#B71C1C]",
  },
  warning: {
    iconBg: "bg-[#FFF3E0]",
    iconColor: "text-[#E65100]",
    buttonBg: "bg-[#E65100]",
    buttonHoverBg: "hover:bg-[#BF360C]",
  },
  info: {
    iconBg: "bg-[#E3F2FD]",
    iconColor: "text-[#737530]",
    buttonBg: "bg-[#737530]",
    buttonHoverBg: "hover:bg-[#0A3A4D]",
  },
};

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  variant = "danger",
  typedConfirm,
}: ConfirmDialogProps) {
  const styles = variantStyles[variant];
  const [typed, setTyped] = useState("");
  const canConfirm = !typedConfirm || typed === typedConfirm;

  useEffect(() => {
    if (!isOpen) setTyped("");
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (!canConfirm) return;
              onConfirm();
              onClose();
            }}
            disabled={!canConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${styles.buttonBg} ${styles.buttonHoverBg}`}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        {/* Icon */}
        <div
          className={`flex items-center justify-center w-14 h-14 rounded-full ${styles.iconBg} ${styles.iconColor} mb-4`}
        >
          {variant === "danger" ? (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9V13M12 17H12.01M10.29 3.86L1.82 18A2 2 0 003.54 21H20.46A2 2 0 0022.18 18L13.71 3.86A2 2 0 0010.29 3.86Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : variant === "warning" ? (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 9V13M12 17H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 16V12M12 8H12.01M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">{message}</p>
        {typedConfirm && (
          <div className="w-full mt-4 text-left">
            <label className="block text-xs font-medium text-gray-500 mb-1">
              Type <span className="font-mono text-gray-800">{typedConfirm}</span>{" "}
              to confirm
            </label>
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono text-gray-700 focus:border-[#C62828] focus:ring-1 focus:ring-[#C62828]/20 focus:outline-none"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
