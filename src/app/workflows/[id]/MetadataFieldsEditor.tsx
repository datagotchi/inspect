"use client";

import React, { useState } from "react";
import { WorkflowItemMetadataItem } from "@/app/types";

interface MetadataFieldsEditorProps<T extends WorkflowItemMetadataItem> {
  items: T[];
  onChange: (items: T[]) => void;
}

export function MetadataFieldsEditor<T extends WorkflowItemMetadataItem>({
  items,
  onChange,
}: MetadataFieldsEditorProps<T>) {
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");

  const handleAddField = () => {
    if (!newKey.trim()) return;

    // Cast to T so TS respects whichever specific metadata subtype is passed in
    const newItem = {
      fieldname: newKey.trim(),
      value: newValue.trim(),
    } as T;

    onChange([...items, newItem]);
    setNewKey("");
    setNewValue("");
  };

  const handleUpdateValue = (index: number, val: string) => {
    onChange(
      items.map((item, idx) =>
        idx === index ? { ...item, value: val } : item,
      ),
    );
  };

  const handleDeleteField = (index: number) => {
    onChange(items.filter((_, idx) => idx !== index));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {items.map((item, idx) => (
        <div
          key={item.id || idx}
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            backgroundColor: "#f8fafc",
            padding: "8px",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: "600",
              color: "#334155",
              width: "120px",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
            title={item.fieldname}
          >
            {item.fieldname}
          </div>
          <input
            type="text"
            value={item.value}
            onChange={(e) => handleUpdateValue(idx, e.target.value)}
            style={{
              flex: 1,
              padding: "6px 10px",
              borderRadius: "4px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
            }}
          />
          <button
            type="button"
            onClick={() => handleDeleteField(idx)}
            style={{
              background: "none",
              border: "none",
              color: "#ef4444",
              fontSize: "16px",
              cursor: "pointer",
              padding: "0 4px",
            }}
            title="Remove Field"
          >
            ✕
          </button>
        </div>
      ))}

      {/* Add New Key-Value Row */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginTop: "8px",
          paddingTop: "12px",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <input
          type="text"
          placeholder="Field name (e.g. label)"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
          }}
        />
        <input
          type="text"
          placeholder="Value"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          style={{
            flex: 1,
            padding: "6px 10px",
            borderRadius: "4px",
            border: "1px solid #cbd5e1",
            fontSize: "13px",
          }}
        />
        <button
          type="button"
          onClick={handleAddField}
          style={{
            padding: "6px 12px",
            backgroundColor: "#f1f5f9",
            border: "1px solid #cbd5e1",
            borderRadius: "4px",
            fontSize: "13px",
            fontWeight: "600",
            color: "#334155",
            cursor: "pointer",
          }}
        >
          + Add
        </button>
      </div>
    </div>
  );
}
