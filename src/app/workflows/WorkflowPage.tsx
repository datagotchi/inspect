"use client";

import styles from "../../styles/components/main-insights-page.module.css";
import cardStyles from "../../styles/components/card.module.css";
import React, { useState } from "react";

import {
  // FLVResponse,
  // Insight,
  // InsightEvidence,
  // ServerFunction,
  User,
  Workflow,
  WorkflowNode,
} from "../types";
// import useUser from "../hooks/useUser";
// import {
//   ActionDialog,
//   ServerFunctionInputSchemaForSavedLinks,
// } from "../components/SaveLinkDialog";
import CurrentUserContext from "../contexts/CurrentUserContext";
// import { createLink } from "../hooks/functions";
import {} from // createInsights,
// deleteInsights,
// publishInsights,
// InsightsAPISchema,
"../components/InsightsAPI";
// import {
//   addCitationsToInsight,
//   createInsightFromCitations,
// } from "../components/SelectedCitationsAPI";
import { HybridRadialNetwork } from "@/app/components/HybridRadialNetwork";
// import { ServerFunctionInputSchemaForChildInsights } from "./[uid]/AddChildInsightsDialog";

const WorkflowPage = ({
  nodes,
  currentUser,
}: {
  nodes: WorkflowNode[];
  currentUser: User | null;
}): React.JSX.Element => {
  // const { token } = useUser();
  // const [liveData, setLiveData] = useState(insights);
  // const [selectedInsights, setSelectedInsights] = useState<Insight[]>([]); // This will be used by HybridRadialNetwork
  const selectedInsights: Workflow[] = [];
  const [/*isActionDialogOpen, */ setIsActionDialogOpen] = useState(false);
  // const [dialogConfig, setDialogConfig] = useState<{
  //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  //   serverFunction: ServerFunction<any>;
  //   input:
  //     | ServerFunctionInputSchemaForChildInsights
  //     | ServerFunctionInputSchemaForSavedLinks;
  //   title: string;
  //   isLinkSave?: boolean;
  // } | null>(null);

  const promptForNewWorkflowName = () => {
    const title = prompt("New insight:");
    if (title) {
      // setDialogConfig({
      //   title: "Create New Workflow",
      //   serverFunction: async (input: InsightsAPISchema, token: string) => {
      //     if (token) {
      //       return createInsights(input, token);
      //     }
      //     return Promise.resolve([]);
      //   },
      //   input: {
      //     // insights: [{ title, citations: [] }] as unknown as Insight[],
      //   },
      // });
      // setIsActionDialogOpen(true);
    }
  };

  // const createLinkAndAddToInsights = async (
  //   input: ServerFunctionInputSchemaForSavedLinks,
  //   token: string,
  // ): Promise<FLVResponse[]> => {
  //   const responses: FLVResponse[] = [];
  //   if (!token) {
  //     throw new Error("Authentication token is required");
  //   }

  //   try {
  //     const link = await createLink(input.url!, token);

  //     if (input.newInsightName) {
  //       const response = await createInsightFromCitations(
  //         input.newInsightName,
  //         [{ summary_id: link.id } as InsightEvidence],
  //         token,
  //       );
  //       responses.push(response);
  //     }

  //     if (input.selectedInsights && input.selectedInsights.length > 0) {
  //       await Promise.all(
  //         input.selectedInsights.map(async (insight) => {
  //           try {
  //             await addCitationsToInsight(
  //               {
  //                 insight,
  //                 evidence: [{ summary_id: link.id } as InsightEvidence],
  //               },
  //               token,
  //             );
  //             // TODO: does not update the insight in prod
  //             responses.push({ action: 0, facts: [insight] });
  //           } catch (error) {
  //             console.error(
  //               `Failed to add citation to insight ${insight.uid}:`,
  //               error,
  //             );
  //             throw error;
  //           }
  //         }),
  //       );
  //     }
  //   } catch (error) {
  //     console.error("Error in createLinkAndAddToInsights:", error);
  //     throw error;
  //   }

  //   return responses;
  // };

  const loggedIn = !!currentUser;
  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        {/* Page Header - Overall Page Level */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderContent}>
            <div className={styles.headerTop}>
              {/* <div className={styles.headerInfo}>
                <h1 className={styles.headerTitle}>My Insights</h1>
                <p className={styles.headerSubtitle}>
                  {insights.length > 0
                    ? `${insights.length} insight${insights.length !== 1 ? "s" : ""}`
                    : "No insights yet"}
                </p>
              </div> */}
              {/* {loggedIn && (
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
                  <button
                    onClick={() => {
                      // setDialogConfig({
                      //   title: "Save Link",
                      //   serverFunction: createLinkAndAddToInsights,
                      //   input: {}, // Input will be provided by the dialog
                      //   isLinkSave: true,
                      // });
                      // setIsActionDialogOpen(true);
                    }}
                    className={cardStyles.addButton}
                    aria-label="Save Link"
                    title="Save Link"
                  >
                    <span className={cardStyles.addButtonIcon}>🔗</span>
                    <span className={cardStyles.addButtonText}>Save Link</span>
                  </button>
                </div>
              )} */}
            </div>
          </div>
        </div>

        <CurrentUserContext.Provider value={currentUser}>
          <div className={cardStyles.contentCard}>
            <div className={cardStyles.contentCardHeader}>
              <div className={cardStyles.hierarchyIndicator}>
                <span className={cardStyles.hierarchyIcon}>📋</span>
                Insights List
              </div>
              {loggedIn && selectedInsights.length > 0 && (
                <div className={cardStyles.sectionActions}>
                  <button
                    onClick={() => {
                      // setDialogConfig({
                      //   title: "Publish Insights",
                      //   serverFunction: async (
                      //     input: InsightsAPISchema,
                      //     token: string,
                      //   ) => {
                      //     if (token) {
                      //       return publishInsights(input, token);
                      //     }
                      //     return Promise.resolve([]);
                      //   },
                      //   input: {
                      //     // insights: selectedInsights,
                      //   },
                      // });
                      // setIsActionDialogOpen(true);
                    }}
                    className={cardStyles.addButton}
                    aria-label="Publish Selected"
                    title="Publish Selected"
                  >
                    <span className={cardStyles.addButtonIcon}>📢</span>
                    <span className={cardStyles.addButtonText}>Publish</span>
                  </button>
                  <button
                    onClick={() => {
                      if (
                        selectedInsights &&
                        selectedInsights.length > 0 &&
                        confirm("Are you sure?")
                      ) {
                        // setDialogConfig({
                        //   title: "Delete Insights",
                        //   serverFunction: async (
                        //     input: InsightsAPISchema,
                        //     token: string,
                        //   ) => {
                        //     if (token) {
                        //       return deleteInsights(input, token);
                        //     }
                        //     return Promise.resolve([]);
                        //   },
                        //   input: {
                        //     // insights: selectedInsights,
                        //   },
                        // });
                        // setIsActionDialogOpen(true);
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
              <HybridRadialNetwork data={nodes} />
            </div>
          </div>

          {/* Child Level - Dialogs */}
          {/* {dialogConfig && (
            <ActionDialog
              isOpen={isActionDialogOpen}
              onClose={() => {
                setIsActionDialogOpen(false);
                // setDialogConfig(null);
              }}
              // title={dialogConfig.title}
              // isLinkSave={dialogConfig.isLinkSave}
              potentialInsightsFromServer={insights.filter(
                (insight) => insight.user_id === currentUser?.id,
              )}
              id={""}
            />
          )} */}
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
};

export default WorkflowPage;
