"use client";

import styles from "../../styles/components/main-insights-page.module.css";
import cardStyles from "../../styles/components/card.module.css";
import React, { useState } from "react";

import {
  FLVResponse,
  Insight,
  InsightEvidence,
  ServerFunction,
  User,
} from "../types";
import useUser from "../hooks/useUser";
import ActionDialog, {
  ServerFunctionInputSchemaForSavedLinks,
} from "../components/SaveLinkDialog";
import CurrentUserContext from "../contexts/CurrentUserContext";
import { createLink } from "../hooks/functions";
import {
  createInsights,
  deleteInsights,
  publishInsights,
  InsightsAPISchema,
} from "../components/InsightsAPI";
import {
  addCitationsToInsight,
  createInsightFromCitations,
} from "../components/SelectedCitationsAPI";
import HybridRadialNetwork from "../components/HybridRadialNetwork";

const ClientSidePage = ({
  insights,
  currentUser,
}: {
  insights: Insight[];
  currentUser: User | null;
}): React.JSX.Element => {
  const { token } = useUser();
  const [liveData, setLiveData] = useState(insights);
  const [selectedInsights, setSelectedInsights] = useState<Insight[]>([]); // This will be used by HybridRadialNetwork
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    serverFunction: ServerFunction<any>;
    input: ServerFunctionInputSchemaForSavedLinks;
    title: string;
    isLinkSave?: boolean;
  } | null>(null);

  const promptForNewInsightName = () => {
    const title = prompt("New insight:");
    if (title) {
      setDialogConfig({
        title: "Create New Insight",
        serverFunction: async (input: InsightsAPISchema, token: string) => {
          if (token) {
            return createInsights(input, token);
          }
          return Promise.resolve([]);
        },
        input: {
          insights: [{ title, citations: [] }] as unknown as Insight[],
        },
      });
      setIsActionDialogOpen(true);
    }
  };

  const createLinkAndAddToInsights = async (
    input: ServerFunctionInputSchemaForSavedLinks,
    token: string,
  ): Promise<FLVResponse[]> => {
    const responses: FLVResponse[] = [];
    if (!token) {
      throw new Error("Authentication token is required");
    }

    try {
      const link = await createLink(input.url!, token);

      if (input.newInsightName) {
        const response = await createInsightFromCitations(
          input.newInsightName,
          [{ summary_id: link.id } as InsightEvidence],
          token,
        );
        responses.push(response);
      }

      if (input.selectedInsights && input.selectedInsights.length > 0) {
        await Promise.all(
          input.selectedInsights.map(async (insight) => {
            try {
              await addCitationsToInsight(
                {
                  insight,
                  evidence: [{ summary_id: link.id } as InsightEvidence],
                },
                token,
              );
              // FIXME: does not update the insight in prod
              responses.push({ action: 0, facts: [insight] });
            } catch (error) {
              console.error(
                `Failed to add citation to insight ${insight.uid}:`,
                error,
              );
              throw error;
            }
          }),
        );
      }
    } catch (error) {
      console.error("Error in createLinkAndAddToInsights:", error);
      throw error;
    }

    return responses;
  };

  const loggedIn = !!currentUser;
  return (
    <div className={styles.pageContainer}>
      <div className={styles.mainContent}>
        {/* Page Header - Overall Page Level */}
        <div className={styles.pageHeader}>
          <div className={styles.pageHeaderContent}>
            <div className={styles.headerTop}>
              <div className={styles.headerInfo}>
                <h1 className={styles.headerTitle}>My Insights</h1>
                <p className={styles.headerSubtitle}>
                  {liveData.length > 0
                    ? `${liveData.length} insight${liveData.length !== 1 ? "s" : ""}`
                    : "No insights yet"}
                </p>
              </div>
              {loggedIn && (
                <div style={{ display: "flex", gap: "var(--spacing-2)" }}>
                  <button
                    onClick={promptForNewInsightName}
                    className={cardStyles.addButton}
                    aria-label="Create New Insight"
                    title="Create New Insight"
                  >
                    <span className={cardStyles.addButtonIcon}>+</span>
                    <span className={cardStyles.addButtonText}>
                      Create New Insight
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      setDialogConfig({
                        title: "Save Link",
                        serverFunction: createLinkAndAddToInsights,
                        input: {}, // Input will be provided by the dialog
                        isLinkSave: true,
                      });
                      setIsActionDialogOpen(true);
                    }}
                    className={cardStyles.addButton}
                    aria-label="Save Link"
                    title="Save Link"
                  >
                    <span className={cardStyles.addButtonIcon}>🔗</span>
                    <span className={cardStyles.addButtonText}>Save Link</span>
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
                Insights List
              </div>
              {loggedIn && selectedInsights.length > 0 && (
                <div className={cardStyles.sectionActions}>
                  <button
                    onClick={() => {
                      setDialogConfig({
                        title: "Publish Insights",
                        serverFunction: async (
                          input: InsightsAPISchema,
                          token: string,
                        ) => {
                          if (token) {
                            return publishInsights(input, token);
                          }
                          return Promise.resolve([]);
                        },
                        input: {
                          insights: selectedInsights,
                        },
                      });
                      setIsActionDialogOpen(true);
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
                        setDialogConfig({
                          title: "Delete Insights",
                          serverFunction: async (
                            input: InsightsAPISchema,
                            token: string,
                          ) => {
                            if (token) {
                              return deleteInsights(input, token);
                            }
                            return Promise.resolve([]);
                          },
                          input: {
                            insights: selectedInsights,
                          },
                        });
                        setIsActionDialogOpen(true);
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
              <HybridRadialNetwork
                data={liveData}
                crossLinks={[]}
                onSelectionChange={setSelectedInsights}
              />
            </div>
          </div>

          {/* Child Level - Dialogs */}
          {dialogConfig && (
            <ActionDialog
              isOpen={isActionDialogOpen}
              onClose={() => {
                setIsActionDialogOpen(false);
                setDialogConfig(null);
              }}
              title={dialogConfig.title}
              isLinkSave={dialogConfig.isLinkSave}
              potentialInsightsFromServer={liveData.filter(
                (insight) => insight.user_id === currentUser?.id,
              )}
              onSubmit={(input) => {
                if (token) {
                  const finalInput = { ...dialogConfig.input, ...input };
                  dialogConfig
                    .serverFunction(finalInput, token)
                    .then((responses: FLVResponse[]) => {
                      console.log("Server function successful:", responses);
                      // Update the live data with the responses
                      responses.forEach((response) => {
                        if (response.action === 1) {
                          // Create
                          setLiveData((prev) => [
                            ...(response.facts as Insight[]),
                            ...prev,
                          ]);
                        } else if (response.action === 0) {
                          // Update
                          setLiveData((prev) =>
                            prev.map((insight) => {
                              const updatedInsight = response.facts.find(
                                (f) => f.uid === insight.uid,
                              ) as Insight | undefined;
                              return updatedInsight
                                ? { ...insight, ...updatedInsight }
                                : insight;
                            }),
                          );
                        }
                      });
                      alert(`${dialogConfig.title} successful!`);
                    })
                    .catch((error) => {
                      console.error("Error in server function:", error);
                      alert(`Failed: ${error.message || "Unknown error"}`);
                    });
                }
              }}
            />
          )}
        </CurrentUserContext.Provider>
      </div>
    </div>
  );
};

export default ClientSidePage;
