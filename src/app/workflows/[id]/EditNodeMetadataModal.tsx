"use client";

import React, { useState, useEffect } from "react";
import { CanvasNode } from "@/app/components/WorkflowHelpers";
import {
  getNodeMetadata,
  saveNodeMetadata,
  // deleteNodeMetadata,
} from "@/app/components/WorkflowsAPI";
import { WorkflowNodeMetadataItem } from "@/app/types";

interface EditNodeMetadataModalProps {
  node: CanvasNode;
  token?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EditNodeMetadataModal({
  node,
  token,
  onClose,
  onSaved,
}: EditNodeMetadataModalProps) {
  const [metadata, setMetadata] = useState<WorkflowNodeMetadataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [newKey, setNewKey] = useState<string>("");
  const [newValue, setNewValue] = useState<string>("");

  useEffect(() => {
    if (!node.id) return;
    setLoading(true);
    getNodeMetadata(node.workflow_id!, node.id, token)
      .then((data) => {
        setMetadata(data || []);
      })
      .catch((err) => console.error("Failed to load metadata:", err))
      .finally(() => setLoading(false));
  }, [node.id, node.workflow_id, token]);

  const handleAddField = () => {
    if (!newKey.trim()) return;
    const item: WorkflowNodeMetadataItem = {
      node_id: node.id!,
      fieldname: newKey.trim(),
      value: newValue.trim(),
    };
    setMetadata((prev) => [...prev, item]);
    setNewKey("");
    setNewValue("");
  };

  const handleUpdateValue = (index: number, val: string) => {
    setMetadata((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, value: val } : item)),
    );
  };

  const handleDeleteField = async (index: number) => {
    const item = metadata[index];
    if (item.id && token) {
      // await deleteNodeMetadata(item.id, token);
    }
    setMetadata((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (node.id && token) {
        await saveNodeMetadata(node.workflow_id!, node.id, metadata, token);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save metadata:", err);
      alert("Failed to save metadata.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
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
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          padding: "24px",
          width: "100%",
          maxWidth: "520px",
          maxHeight: "80vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#0f172a" }}>
            Node Metadata: {node.label || `Node #${node.id}`}
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Configure key-value pairs stored in workflow_node_metadata
          </p>
        </div>

        {loading ? (
          <div
            style={{ padding: "20px", textAlign: "center", color: "#64748b" }}
          >
            Loading metadata...
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {metadata.map((item, idx) => (
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

            {/* Add New Metadata Row */}
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
                placeholder="Field name (e.g. prompt_template)"
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

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "8px",
                marginTop: "16px",
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
                disabled={saving}
                style={{
                  padding: "8px 16px",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontSize: "14px",
                  fontWeight: "600",
                  cursor: saving ? "not-allowed" : "pointer",
                  opacity: saving ? 0.7 : 1,
                }}
              >
                {saving ? "Saving..." : "Save Metadata"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
