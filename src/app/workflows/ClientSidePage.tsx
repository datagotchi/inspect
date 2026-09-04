"use client";

import React from "react";
import Link from "next/link";

import styles from "../../styles/components/main-insights-page.module.css";
import cardStyles from "../../styles/components/card.module.css";

import { User, Workflow } from "../types";
import CurrentUserContext from "../contexts/CurrentUserContext";
import { createWorkflow } from "../components/WorkflowsAPI";
import useUser from "../hooks/useUser";
import { useRouter } from "next/navigation";

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

  const promptForNewWorkflowName = async () => {
    const name = prompt("New workflow:");
    if (name) {
      await createWorkflow({ name, user_id: user_id! }, token!);
      router.refresh();
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
                    onClick={promptForNewWorkflowName}
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
                    <Link href={`/workflows/${wf.id}`}>{wf.name}</Link>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
};

export default ClientSidePage;
