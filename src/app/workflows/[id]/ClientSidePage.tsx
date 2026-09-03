"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "../../../styles/components/main-insights-page.module.css";
import cardStyles from "../../../styles/components/card.module.css";

import { HybridRadialNetwork } from "@/app/components/HybridRadialNetwork";
import { WorkflowNode } from "@/app/types";
import { createWorkflowNode } from "@/app/components/WorkflowsAPI";
import useUser from "@/app/hooks/useUser";

interface Props {
  workflowId: number;
  nodes: WorkflowNode[];
}

export default function WorkflowClientPage({
  workflowId,
  nodes: initialNodes,
}: Props) {
  const [nodes, setNodes] = useState<WorkflowNode[]>(initialNodes);
  const [isCreating, setIsCreating] = useState(false);
  const { token } = useUser();
  const router = useRouter();

  const promptForNewNode = async () => {
    const label = prompt("New node label:");
    if (!label) return;

    setIsCreating(true);
    try {
      const newNode = await createWorkflowNode(workflowId, { label }, token);

      if (newNode) {
        // Optimistically append the new node to local state
        setNodes((prev) => [...prev, newNode]);
        // Refresh server components in background without full browser reload
        router.refresh();
      } else {
        alert("Failed to create node. Please try again.");
      }
    } catch (err) {
      console.error(err);
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
                  {hasNodes
                    ? `${nodes.length} node${nodes.length !== 1 ? "s" : ""}`
                    : "No nodes yet"}
                </p>
              </div>

              <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                <button
                  onClick={promptForNewNode}
                  disabled={isCreating}
                  className={cardStyles.addButton}
                  aria-label="Create New Node"
                  title="Create New Node"
                >
                  <span className={cardStyles.addButtonIcon}>+</span>
                  <span className={cardStyles.addButtonText}>
                    {isCreating ? "Creating..." : "Create New Node"}
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
              <HybridRadialNetwork data={nodes} />
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
                  onClick={promptForNewNode}
                  disabled={isCreating}
                  className={cardStyles.addButton}
                >
                  <span className={cardStyles.addButtonIcon}>+</span>
                  <span className={cardStyles.addButtonText}>
                    {isCreating ? "Creating..." : "Add First Node"}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
