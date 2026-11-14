"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

import styles from "../../../styles/components/main-insights-page.module.css";
import cardStyles from "../../../styles/components/card.module.css";

import { WorkflowNode, WorkflowNodeLink, WorkflowNodeType } from "@/app/types";
import {
  createWorkflowLink,
  createWorkflowNode,
  deleteWorkflowLink,
  deleteWorkflowNode,
  fetchWorkflow,
  getWorkflowNodeTypes,
} from "@/app/workflows/WorkflowsAPI";
import {
  serializeWorkflowToJsonLd,
  deserializeJsonLdToWorkflow,
} from "@/app/functions";
import { useWorkflowContext } from "@/app/contexts/WorkflowContext";
import useUser from "@/app/hooks/useUser";
import { WorkflowCanvas } from "@/app/workflows/[id]/WorkflowCanvas";
import { CreateModal } from "@/app/components/CreateModal";
import { EditLinkModal } from "./EditLinkModal";
import { EditNodeDetailsModal } from "./EditNodeDetailsModal";

export default function WorkflowEditorView() {
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<WorkflowNode | null>(null);
  const [editingLink, setEditingLink] = useState<WorkflowNodeLink | null>(null);
  const [nodeTypes, setNodeTypes] = useState<WorkflowNodeType[]>();

  const { workflow, setWorkflow } = useWorkflowContext();
  const { token } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!nodeTypes) {
      getWorkflowNodeTypes().then((types) => {
        setNodeTypes(types);
      });
    }
  }, [nodeTypes]);

  const handleDeleteNode = useCallback(
    async (nodeId: number) => {
      if (!workflow) return;
      const success = await deleteWorkflowNode(workflow.id, nodeId, token);
      if (success) {
        setWorkflow({
          ...workflow,
          nodes: (workflow.nodes || []).filter((n) => n.id !== nodeId),
          links: (workflow.links || []).filter(
            (l) => l.parent_id !== nodeId && l.child_id !== nodeId,
          ),
        });
        router.refresh();
      }
    },
    [workflow, token, setWorkflow, router],
  );

  const handleLinkNodes = useCallback(
    async (parent_id: number, child_id: number) => {
      if (!workflow) return;
      const link = await createWorkflowLink(
        workflow.id,
        { parent_id, child_id },
        token,
      );
      if (link) {
        setWorkflow({
          ...workflow,
          links: [...(workflow.links || []), link],
        });
        router.refresh();
      }
    },
    [workflow, token, setWorkflow, router],
  );

  const handleDeleteLink = useCallback(
    async (linkId: number) => {
      if (!workflow) return;
      await deleteWorkflowLink(workflow.id, linkId, token);
      setWorkflow({
        ...workflow,
        links: (workflow.links || []).filter((l) => l.id !== linkId),
      });
      router.refresh();
    },
    [workflow, token, setWorkflow, router],
  );

  const handleEditNodeMetadata = useCallback((node: WorkflowNode) => {
    setEditingNode(node);
  }, []);

  const handleEditLink = useCallback((link: WorkflowNodeLink) => {
    setEditingLink(link);
  }, []);

  if (!workflow) return null;

  const nodes = workflow.nodes || [];
  const links = workflow.links || [];

  const handleExportModel = () => {
    const payload = serializeWorkflowToJsonLd(workflow, true);

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/ld+json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);

    const downloadAnchor = document.createElement("a");
    const fileName = `${(workflow.name || "workflow")
      .toLowerCase()
      .replace(/\s+/g, "_")}_${workflow.id}.jsonld`;

    downloadAnchor.href = url;
    downloadAnchor.download = fileName;
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportModel = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const { nodes: importedNodes, links: importedLinks } =
          deserializeJsonLdToWorkflow(parsed, workflow.id);

        setWorkflow({
          ...workflow,
          nodes: importedNodes,
          links: importedLinks,
        });

        alert(
          `Successfully imported JSON-LD workflow (${importedNodes.length} nodes, ${importedLinks.length} links)!`,
        );
      } catch (err) {
        console.error("Failed to parse workflow JSON-LD:", err);
        alert(
          err instanceof Error
            ? err.message
            : "Error importing file. Please check that it is valid JSON-LD.",
        );
      }
    };

    fileReader.readAsText(file);
    event.target.value = "";
  };

  const handleNodeDragEnd = (nodeId: number, x: number, y: number) => {
    setWorkflow({
      ...workflow,
      nodes: nodes.map((n) => (n.id === nodeId ? { ...n, x, y } : n)),
    });
  };

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
        setWorkflow({
          ...workflow,
          nodes: [...(workflow.nodes || []), newNode],
        });
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

  const hasNodes = nodes.length > 0;

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
                  title="Export Workflow to JSON-LD (.jsonld)"
                >
                  <span className={cardStyles.addButtonIcon}>📥</span>
                  <span className={cardStyles.addButtonText}>
                    Export JSON-LD
                  </span>
                </button>

                <label
                  className={cardStyles.addButton}
                  style={{ cursor: "pointer" }}
                  title="Import Workflow from JSON-LD (.jsonld)"
                >
                  <span className={cardStyles.addButtonIcon}>📤</span>
                  <span className={cardStyles.addButtonText}>
                    Import JSON-LD
                  </span>
                  <input
                    type="file"
                    accept=".jsonld,application/ld+json"
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
            const updatedWorkflow = await fetchWorkflow(workflow.id, token);
            if (updatedWorkflow) {
              setWorkflow(updatedWorkflow);
            }
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
