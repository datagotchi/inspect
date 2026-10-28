"use client";

import React, { useState, useEffect } from "react";
import {
  getNodeMetadata,
  saveNodeMetadata,
} from "@/app/components/WorkflowsAPI";
import { WorkflowNode, WorkflowNodeMetadataItem } from "@/app/types";
import { MetadataFieldsEditor } from "./MetadataFieldsEditor";

interface EditNodeMetadataModalProps {
  node: WorkflowNode;
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

  useEffect(() => {
    if (!node.id) return;
    setLoading(true);
    getNodeMetadata(node.workflow_id!, node.id, token)
      .then((data) => setMetadata(data || []))
      .catch((err) => console.error("Failed to load metadata:", err))
      .finally(() => setLoading(false));
  }, [node.id, node.workflow_id, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (node.id) {
        await saveNodeMetadata(node.workflow_id!, node.id, metadata, token);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save node metadata:", err);
      alert("Failed to save metadata.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={modalBackdropStyle}>
      <div style={modalContentStyle}>
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
          <form onSubmit={handleSubmit}>
            <MetadataFieldsEditor items={metadata} onChange={setMetadata} />

            <div style={modalActionsRightStyle}>
              <button type="button" onClick={onClose} style={cancelButtonStyle}>
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                style={submitButtonStyle(saving)}
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

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(15, 23, 42, 0.5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 50,
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  padding: "24px",
  width: "100%",
  maxWidth: "520px",
  maxHeight: "80vh",
  overflowY: "auto",
  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
};

const modalActionsRightStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "flex-end",
  gap: "8px",
  marginTop: "16px",
  paddingTop: "16px",
  borderTop: "1px solid #e2e8f0",
};

const cancelButtonStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  backgroundColor: "#ffffff",
  color: "#475569",
  fontSize: "14px",
  fontWeight: "600",
  cursor: "pointer",
};

const submitButtonStyle = (saving: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  borderRadius: "6px",
  border: "none",
  backgroundColor: "#2563eb",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  cursor: saving ? "not-allowed" : "pointer",
  opacity: saving ? 0.7 : 1,
});
