"use client";

import React, { useState, useEffect, useRef } from "react";

export interface ModalOption {
  value: string | number;
  label: string;
}

interface Props {
  isOpen: boolean;
  title: string;
  inputLabel: string;
  placeholder?: string;
  selectLabel: string;
  options: ModalOption[];
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (
    name: string,
    selectedValue: string | number,
  ) => Promise<void> | void;
}

export function CreateModal({
  isOpen,
  title,
  inputLabel,
  placeholder = "",
  selectLabel,
  options,
  isSubmitting = false,
  onClose,
  onSubmit,
}: Props) {
  const [name, setName] = useState("");
  const [selectedValue, setSelectedValue] = useState<string | number>(
    options[0]?.value ?? "",
  );
  const modalRef = useRef<HTMLDivElement>(null);

  // Sync selectedValue when options arrive or open state toggles
  useEffect(() => {
    if (options.length > 0) {
      setSelectedValue(options[0].value);
    }
  }, [options, isOpen]);

  // ESC key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Backdrop click dismissal
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await onSubmit(name.trim(), selectedValue);
    setName("");
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={handleOverlayClick}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 50,
      }}
    >
      <div
        ref={modalRef}
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            color: "#0f172a",
            marginBottom: "16px",
          }}
        >
          {title}
        </h3>
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "#475569",
                marginBottom: "6px",
              }}
            >
              {inputLabel}
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder={placeholder}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "12px",
                fontWeight: "600",
                color: "#475569",
                marginBottom: "6px",
              }}
            >
              {selectLabel}
            </label>
            <select
              value={selectedValue}
              onChange={(e) => setSelectedValue(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "14px",
                backgroundColor: "#ffffff",
                boxSizing: "border-box",
              }}
            >
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "8px",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: "8px 16px",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "14px",
                fontWeight: "600",
                cursor: isSubmitting ? "not-allowed" : "pointer",
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? "Creating..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
