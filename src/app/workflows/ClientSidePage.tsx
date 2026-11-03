"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import styles from "../../styles/components/main-insights-page.module.css";
import cardStyles from "../../styles/components/card.module.css";

import { User, Workflow } from "../types";
import CurrentUserContext from "../contexts/CurrentUserContext";
import { createWorkflow, deleteWorkflow } from "../components/WorkflowsAPI";
import useUser from "../hooks/useUser";
import { CreateModal } from "../components/CreateModal";

const CATEGORY_OPTIONS = [
  { value: "gtm", label: "Product Funnel / GTM" },
  { value: "cwa", label: "Cognitive Work Analysis (CWA)" },
  { value: "system", label: "System Architecture" },
];

const ClientSidePage = ({
  workflows,
  currentUser,
}: {
  workflows: Workflow[];
  currentUser: User | null;
}): React.JSX.Element => {
  const { token, user_id } = useUser();
  const router = useRouter();
  const selectedWorkflows: Workflow[] = [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateWorkflow = async (
    name: string,
    category: string | number,
  ) => {
    setIsCreating(true);
    try {
      await createWorkflow(
        {
          name: name.trim(),
          category: String(category),
          user_id: user_id!,
        },
        token!,
      );
      setIsModalOpen(false);
      router.refresh();
    } catch (err) {
      console.error("Error creating workflow:", err);
      alert("Failed to create workflow. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const loggedIn = !!currentUser;

  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderContent}>
            <div className={styles.headerTop}>
              <div className={styles.headerInfo}>
                <h1 className={styles.headerTitle}>My Workflows</h1>
                <p className={styles.headerSubtitle}>
                  {workflows.length > 0
                    ? `${workflows.length} workflow${workflows.length !== 1 ? "s" : ""}`
                    : "No workflows yet"}
                </p>
              </div>
              {loggedIn && (
                <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className={cardStyles.addButton}
                    aria-label="Create New Workflow"
                    title="Create New Workflow"
                  >
                    <span className={cardStyles.addButtonIcon}>+</span>
                    <span className={cardStyles.addButtonText}>
                      Create New Workflow
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <CurrentUserContext.Provider value={currentUser}>
          <div className={cardStyles.contentCard}>
            <div className={cardStyles.contentCardHeader}>
              <div className={cardStyles.hierarchyIndicator}>
                <span className={cardStyles.hierarchyIcon}>📋</span>
                Workflows List
              </div>
              {loggedIn && selectedWorkflows.length > 0 && (
                <div className={cardStyles.sectionActions}>
                  <button
                    onClick={() => {
                      if (
                        selectedWorkflows &&
                        selectedWorkflows.length > 0 &&
                        confirm("Are you sure?")
                      ) {
                        // TODO: Implement multi-workflow delete handler
                      }
                    }}
                    className={cardStyles.addButton}
                    aria-label="Delete Selected"
                    title="Delete Selected"
                  >
                    <span className={cardStyles.addButtonIcon}>🗑️</span>
                    <span className={cardStyles.addButtonText}>Delete</span>
                  </button>
                </div>
              )}
            </div>
            <div className={cardStyles.contentCardBody}>
              <ol>
                {workflows.map((wf) => (
                  <li key={`wf: ${wf.id}`}>
                    <Link href={`/workflows/${wf.id}`}>{wf.name}</Link>{" "}
                    {wf.category && (
                      <span
                        style={{
                          fontSize: "12px",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          backgroundColor: "#f1f5f9",
                          color: "#475569",
                          marginLeft: "8px",
                          marginRight: "8px",
                          fontWeight: 500,
                        }}
                      >
                        {wf.category.toUpperCase()}
                      </span>
                    )}
                    <button
                      onClick={async () => {
                        if (confirm("Are you sure?")) {
                          await deleteWorkflow(wf, token!);
                          router.refresh();
                        }
                      }}
                    >
                      X
                    </button>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </CurrentUserContext.Provider>
      </div>

      {/* REUSABLE CREATE WORKFLOW MODAL */}
      <CreateModal
        isOpen={isModalOpen}
        title="Create New Workflow"
        inputLabel="Workflow Name"
        placeholder="e.g. Gen Z Digital Sovereignty Funnel"
        selectLabel="Category"
        options={CATEGORY_OPTIONS}
        isSubmitting={isCreating}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateWorkflow}
      />
    </div>
  );
};

export default ClientSidePage;
