"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import styles from "../../../styles/components/main-insights-page.module.css";
import cardStyles from "../../../styles/components/card.module.css";

import { Workflow, WorkflowNode, WorkflowNodeType } from "@/app/types";
import {
  createWorkflowLink,
  createWorkflowNode,
} from "@/app/components/WorkflowsAPI";
import useUser from "@/app/hooks/useUser";
import { WorkflowCanvas } from "@/app/components/WorkflowCanvas";

// Static fallback matching your workflow_node_types table
const DEFAULT_NODE_TYPES: WorkflowNodeType[] = [
  { id: 1, name: "Human Action", icon: "👤", bg_color: "#e0f2fe" },
  { id: 2, name: "System / Data", icon: "🗄️", bg_color: "#f1f5f9" },
  { id: 3, name: "AI Model / LLM", icon: "🤖", bg_color: "#fef3c7" },
  { id: 4, name: "JAW Supervisory Gate", icon: "🛡️", bg_color: "#dcfce7" },
  { id: 5, name: "Impact & Reporting", icon: "📊", bg_color: "#f3e8ff" },
];

interface Props {
  workflow: Workflow;
}

export default function ClientSidePage({ workflow }: Props) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(workflow.nodes);
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<number>(1);
  const [nodeTypes] = useState<WorkflowNodeType[]>(DEFAULT_NODE_TYPES);

  const { token } = useUser();
  const router = useRouter();

  // Sync state when server props update via router.refresh()
  useEffect(() => {
    setNodes(workflow.nodes);
  }, [workflow.nodes]);

  const handleCreateNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;

    setIsCreating(true);
    try {
      const newNode = await createWorkflowNode(
        workflow.id,
        {
          label: label.trim(),
          type: String(selectedTypeId), // Foreign key to workflow_node_types.id
        },
        token,
      );

      if (newNode) {
        setIsModalOpen(false);
        setLabel("");
        setSelectedTypeId(1);
        router.refresh();
      } else {
        alert("Failed to create node. Please try again.");
      }
    } catch (err) {
      console.error("Error creating workflow node:", err);
    } finally {
      setIsCreating(false);
    }
  };

  const hasNodes = nodes && nodes.length > 0;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderContent}>
            <div className={styles.headerTop}>
              <div className={styles.headerInfo}>
                <h1 className={styles.headerTitle}>Workflow Canvas</h1>
                <p className={styles.headerSubtitle}>
                  Workflow: <strong>{workflow.name}</strong>
                </p>
                <p className={styles.headerSubtitle}>
                  {hasNodes
                    ? `${nodes.length} node${nodes.length !== 1 ? "s" : ""}`
                    : "No nodes yet"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isCreating}
                  className={cardStyles.addButton}
                  aria-label="Create New Node"
                  title="Create New Node"
                >
                  <span className={cardStyles.addButtonIcon}>+</span>
                  <span className={cardStyles.addButtonText}>
                    Create New Node
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={cardStyles.contentCard}>
          <div className={cardStyles.contentCardHeader}>
            <div className={cardStyles.hierarchyIndicator}>
              <span className={cardStyles.hierarchyIcon}>🕸️</span>
              Network Graph
            </div>
          </div>
          <div
            className={cardStyles.contentCardBody}
            style={{ width: "100%", height: "600px", minHeight: "400px" }}
          >
            {hasNodes ? (
              <WorkflowCanvas
                data={nodes}
                onLinkNodes={async (parent_id, child_id) => {
                  const link = await createWorkflowLink(
                    workflow.id,
                    { parent_id, child_id },
                    token,
                  );
                  if (link) {
                    router.refresh();
                  }
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  gap: "var(--spacing-3, 1rem)",
                  color: "#6b7280",
                }}
              >
                <p>This workflow has no nodes yet.</p>
                <button
                  onClick={() => setIsModalOpen(true)}
                  disabled={isCreating}
                  className={cardStyles.addButton}
                >
                  <span className={cardStyles.addButtonIcon}>+</span>
                  <span className={cardStyles.addButtonText}>
                    Add First Node
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CREATE NODE MODAL */}
      {isModalOpen && (
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
              Create New Workflow Node
            </h3>
            <form
              onSubmit={handleCreateNode}
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
                  Node Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Initial Intake Triage"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
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
                  Node Type
                </label>
                <select
                  value={selectedTypeId}
                  onChange={(e) => setSelectedTypeId(Number(e.target.value))}
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
                  {nodeTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.icon} {type.name}
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
                  onClick={() => setIsModalOpen(false)}
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
                  disabled={isCreating}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: isCreating ? "not-allowed" : "pointer",
                    opacity: isCreating ? 0.7 : 1,
                  }}
                >
                  {isCreating ? "Creating..." : "Create Node"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
