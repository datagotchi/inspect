"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import styles from "../../../styles/components/main-insights-page.module.css";
import cardStyles from "../../../styles/components/card.module.css";

import {
  Workflow,
  WorkflowNode,
  WorkflowNodeLink,
  WorkflowNodeType,
} from "@/app/types";
import {
  createWorkflowLink,
  createWorkflowNode,
  deleteWorkflowLink,
  deleteWorkflowNode,
  getWorkflowNodeTypes,
} from "@/app/components/WorkflowsAPI";
import useUser from "@/app/hooks/useUser";
import { WorkflowCanvas } from "@/app/components/WorkflowCanvas";
import { EditNodeMetadataModal } from "./EditNodeMetadataModal";
import { EditLinkModal } from "./EditLinkModal";

interface Props {
  workflow: Workflow;
}

export default function ClientSidePage({ workflow }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [label, setLabel] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<number>(1);
  const [nodeTypes, setNodeTypes] = useState<WorkflowNodeType[]>();

  const STORAGE_KEY = `jaw_workflow_${workflow.id}_draft`;

  const [nodes, setNodes] = useState<WorkflowNode[]>(() => {
    if (typeof window === "undefined") return workflow.nodes || [];
    const draft = localStorage.getItem(`jaw_workflow_${workflow.id}_draft`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.nodes?.length) return parsed.nodes;
      } catch (err) {
        console.error("Failed to parse local draft nodes:", err);
      }
    }
    return workflow.nodes || [];
  });

  const [links, setLinks] = useState<WorkflowNodeLink[]>(() => {
    if (typeof window === "undefined") return workflow.links || [];
    const draft = localStorage.getItem(`jaw_workflow_${workflow.id}_draft`);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.links) return parsed.links;
      } catch (err) {
        console.error("Failed to parse local draft links:", err);
      }
    }
    return workflow.links || [];
  });

  // Export directly from local storage / current state
  const handleExportModel = () => {
    const existingDraft = localStorage.getItem(STORAGE_KEY);

    const exportData = existingDraft
      ? JSON.parse(existingDraft)
      : {
          workflowId: workflow.id,
          nodes,
          links,
          lastSaved: new Date().toISOString(),
        };

    // Attach metadata wrapper if needed
    const filePayload = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      ...exportData,
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(filePayload, null, 2),
    )}`;

    const downloadAnchor = document.createElement("a");
    const fileName = `${(workflow.name || "workflow")
      .toLowerCase()
      .replace(/\s+/g, "_")}_${workflow.id}.jaw.json`;

    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import by updating local storage directly, then updating React state
  const handleImportModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        const importedNodes = parsed.nodes || [];
        const importedLinks = parsed.links || [];

        // 1. Direct write to localStorage draft
        const draftData = {
          workflowId: workflow.id,
          nodes: importedNodes,
          links: importedLinks,
          lastSaved: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));

        // 2. Hydrate React state—our existing hooks handle everything else!
        setNodes(importedNodes);
        setLinks(importedLinks);

        alert(
          `Successfully imported JAW model (${importedNodes.length} nodes)!`,
        );
      } catch (err) {
        console.error("Failed to parse JAW model JSON:", err);
        alert("Error importing file. Please check that it is valid JSON.");
      }
    };

    fileReader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  // auto-save to local storage effect
  useEffect(() => {
    const draftData = {
      workflowId: workflow.id,
      nodes,
      links,
      lastSaved: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));
  }, [nodes, links, STORAGE_KEY, workflow]);

  const { token } = useUser();
  const router = useRouter();

  const handleDeleteNode = useCallback(
    async (nodeId: number) => {
      const success = await deleteWorkflowNode(workflow.id, nodeId, token);
      if (success) {
        router.refresh();
      }
    },
    [workflow.id, token, router],
  );

  const handleLinkNodes = useCallback(
    async (parent_id: number, child_id: number) => {
      const link = await createWorkflowLink(
        workflow.id,
        { parent_id, child_id },
        token,
      );
      if (link) {
        router.refresh();
      }
    },
    [workflow.id, token, router],
  );

  const handleEditNodeMetadata = useCallback((node: WorkflowNode) => {
    setEditingNode(node);
  }, []);

  const [editingLink, setEditingLink] = useState<WorkflowNodeLink | null>(null);

  const handleEditLink = useCallback((link: WorkflowNodeLink) => {
    setEditingLink(link);
  }, []);

  const handleDeleteLink = useCallback(
    async (linkId: number) => {
      await deleteWorkflowLink(workflow.id, linkId, token);
      router.refresh();
    },
    [workflow.id, token, router],
  );

  const handleNodeDragEnd = (nodeId: number, x: number, y: number) => {
    setNodes((prevNodes) =>
      prevNodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    );
  };

  useEffect(() => {
    if (!nodeTypes) {
      getWorkflowNodeTypes().then((types) => {
        setNodeTypes(types);
      });
    }
  }, [nodeTypes]);

  // Sync state when server props update via router.refresh(),
  // but preserve local draft coordinates if they exist in localStorage
  useEffect(() => {
    const draft = localStorage.getItem(STORAGE_KEY);
    if (draft) {
      try {
        const parsed = JSON.parse(draft);
        if (parsed.nodes?.length) {
          setNodes(parsed.nodes);
          if (parsed.links) setLinks(parsed.links);
          return;
        }
      } catch (err) {
        console.error("Failed to restore draft in prop sync:", err);
      }
    }

    // Fallback to server props if no local draft exists
    setNodes(workflow.nodes || []);
    setLinks(workflow.links || []);
  }, [workflow.nodes, workflow.links, STORAGE_KEY]);

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

              <div style={{ display: "flex", gap: "var(--spacing-2, 8px)" }}>
                {/* EXPORT JAW BUTTON */}
                <button
                  onClick={handleExportModel}
                  className={cardStyles.addButton}
                  title="Export Workflow to .jaw.json"
                >
                  <span className={cardStyles.addButtonIcon}>📥</span>
                  <span className={cardStyles.addButtonText}>Export JAW</span>
                </button>

                {/* IMPORT JAW BUTTON */}
                <label
                  className={cardStyles.addButton}
                  style={{ cursor: "pointer" }}
                  title="Import Workflow from .jaw.json"
                >
                  <span className={cardStyles.addButtonIcon}>📤</span>
                  <span className={cardStyles.addButtonText}>Import JAW</span>
                  <input
                    type="file"
                    accept=".json,.jaw.json"
                    onChange={handleImportModel}
                    style={{ display: "none" }}
                  />
                </label>

                {/* CREATE NEW NODE BUTTON */}
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
                nodes={nodes}
                links={links}
                onNodeDragEnd={handleNodeDragEnd}
                onDeleteNode={handleDeleteNode}
                onLinkNodes={handleLinkNodes}
                onEditNodeMetadata={handleEditNodeMetadata}
                onEditLink={handleEditLink}
                onDeleteLink={handleDeleteLink}
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
                  {nodeTypes &&
                    nodeTypes.map((type) => (
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

      {/* EDIT METADATA MODAL */}
      {editingNode && (
        <EditNodeMetadataModal
          node={editingNode}
          token={token}
          onClose={() => setEditingNode(null)}
          onSaved={() => router.refresh()}
        />
      )}

      {/* EDIT LINK DATA MODAL */}
      {editingLink && (
        <EditLinkModal
          link={editingLink}
          token={token}
          onClose={() => setEditingLink(null)}
          onSaved={() => router.refresh()}
          onDeleteLink={handleDeleteLink}
        />
      )}
    </div>
  );
}
