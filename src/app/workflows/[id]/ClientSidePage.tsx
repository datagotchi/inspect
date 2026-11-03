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
  fetchWorkflow,
  getWorkflowNodeTypes,
} from "@/app/components/WorkflowsAPI";
import useUser from "@/app/hooks/useUser";
import { WorkflowCanvas } from "@/app/components/WorkflowCanvas";
import { EditNodeDetailsModal } from "./EditNodeDetailsModal";
import { EditLinkModal } from "./EditLinkModal";
import { CreateModal } from "@/app/components/CreateModal";

interface Props {
  workflow: Workflow;
}

export default function ClientSidePage({ workflow }: Props) {
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
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

        const draftData = {
          workflowId: workflow.id,
          nodes: importedNodes,
          links: importedLinks,
          lastSaved: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData));

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
    event.target.value = "";
  };

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

    setNodes(workflow.nodes || []);
    setLinks(workflow.links || []);
  }, [workflow.nodes, workflow.links, STORAGE_KEY]);

  const handleCreateNode = async (
    label: string,
    selectedValue: string | number,
  ) => {
    setIsCreating(true);
    try {
      const newNode = await createWorkflowNode(
        workflow.id,
        {
          label: label.trim(),
          type: String(selectedValue),
        },
        token,
      );

      if (newNode) {
        setIsModalOpen(false);
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

  const nodeTypeOptions = (nodeTypes || [])
    .filter((nt) => nt.category === workflow.category)
    .map((t) => ({
      value: t.id!,
      label: `${t.icon} ${t.name}`,
    }));

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
                <button
                  onClick={handleExportModel}
                  className={cardStyles.addButton}
                  title="Export Workflow to .jaw.json"
                >
                  <span className={cardStyles.addButtonIcon}>📥</span>
                  <span className={cardStyles.addButtonText}>Export JAW</span>
                </button>

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
                workflowCategory={workflow.category}
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

      {/* REUSABLE CREATE NODE MODAL */}
      <CreateModal
        isOpen={isModalOpen}
        title="Create New Workflow Node"
        inputLabel="Node Label"
        placeholder="e.g. Initial Intake Triage"
        selectLabel="Node Type"
        options={nodeTypeOptions}
        isSubmitting={isCreating}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateNode}
      />

      {/* EDIT METADATA MODAL */}
      {editingNode && (
        <EditNodeDetailsModal
          node={editingNode}
          token={token}
          onClose={() => setEditingNode(null)}
          onSaved={async () => {
            // 1. Fetch fresh payload from API
            const updatedWorkflow = await fetchWorkflow(workflow.id, token);

            // 2. Pass fresh nodes/links to React state so D3 re-calculates the layout
            if (updatedWorkflow) {
              setNodes(updatedWorkflow.nodes);
              setLinks(updatedWorkflow.links);
            }

            // 3. Sync server components & close modal
            router.refresh();
            setEditingNode(null);
          }}
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
