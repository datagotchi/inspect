"use client";

import React, { useState, useEffect } from "react";
import { WorkflowLinkMetadataItem, WorkflowNodeLink } from "@/app/types";
import {
  getLinkMetadata,
  saveLinkMetadata,
} from "@/app/components/WorkflowsAPI";
import { MetadataFieldsEditor } from "./MetadataFieldsEditor";

interface EditLinkModalProps {
  link: WorkflowNodeLink;
  token?: string;
  onClose: () => void;
  onSaved: () => void;
  onDeleteLink?: (linkId: number) => Promise<void>;
}

export function EditLinkModal({
  link,
  token,
  onClose,
  onSaved,
  onDeleteLink,
}: EditLinkModalProps) {
  const [metadata, setMetadata] = useState<WorkflowLinkMetadataItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    if (!link.id) return;
    setLoading(true);
    getLinkMetadata(link.workflow_id!, link.id, token)
      .then((data) => setMetadata(data || []))
      .catch((err) => console.error("Failed to load link metadata:", err))
      .finally(() => setLoading(false));
  }, [link.id, link.workflow_id, token]);

  const handleDelete = async () => {
    if (!link.id || !onDeleteLink) return;
    if (confirm(`Are you sure you want to delete this link?`)) {
      setDeleting(true);
      try {
        await onDeleteLink(link.id);
        onSaved();
        onClose();
      } catch (err) {
        console.error("Failed to delete link:", err);
        alert("Failed to delete link.");
      } finally {
        setDeleting(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (link.id) {
        await saveLinkMetadata(link.workflow_id!, link.id, metadata, token);
      }
      onSaved();
      onClose();
    } catch (err) {
      console.error("Failed to save link metadata:", err);
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
            Link Configuration #{link.id}
          </h3>
          <p style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
            Parent Node ({link.parent_id}) → Child Node ({link.child_id})
          </p>
        </div>

        {loading ? (
          <div
            style={{ padding: "20px", textAlign: "center", color: "#64748b" }}
          >
            Loading link metadata...
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <MetadataFieldsEditor items={metadata} onChange={setMetadata} />

            <div style={modalActionsSplitStyle}>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={deleteButtonStyle(deleting)}
              >
                {deleting ? "Deleting..." : "Delete Link"}
              </button>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={cancelButtonStyle}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={submitButtonStyle(saving)}
                >
                  {saving ? "Saving..." : "Save Link"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// Shared Style Helpers
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

const modalActionsSplitStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
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

const deleteButtonStyle = (deleting: boolean): React.CSSProperties => ({
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #fca5a5",
  backgroundColor: "#fef2f2",
  color: "#991b1b",
  fontSize: "13px",
  fontWeight: "600",
  cursor: deleting ? "not-allowed" : "pointer",
});
