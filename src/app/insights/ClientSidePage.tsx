"use client";

import styles from "../../styles/components/main-insights-page.module.css";
import cardStyles from "../../styles/components/card.module.css";
import React, { useState } from "react";

import {
  Fact,
  FLVResponse,
  Insight,
  InsightEvidence,
  ServerFunction,
  User,
} from "../types";
import useUser from "../hooks/useUser";
import InfiniteScrollLoader from "../components/InfiniteScrollLoader";
import FactsListView from "../components/FactsListView";
import SaveLinkDialog, {
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

export const SAVE_LINK_DIALOG_ID = "saveLinkDialog";

const ClientSidePage = ({
  insights,
  currentUser,
}: {
  insights: Insight[];
  currentUser: User | null;
}): React.JSX.Element => {
  const { token } = useUser();
  const [liveData, setLiveData] = useState(insights);
  const [selectedInsights, setSelectedInsights] = useState<Insight[]>([]);
  const [isSaveLinkDialogOpen, setIsSaveLinkDialogOpen] = useState(false);

  const PAGE_SIZE = 20;

  const [
    serverFunctionInputForInsightsList,
    setServerFunctionInputForInsightsList,
  ] = useState<InsightsAPISchema | ServerFunctionInputSchemaForSavedLinks>();
  const [
    activeServerFunctionForInsightsList,
    setActiveServerFunctionForInsightsList,
  ] = useState<
    | {
        function: ServerFunction<InsightsAPISchema>;
      }
    | undefined
  >();

  const promptForNewInsightName = () => {
    const title = prompt("New insight:");
    if (title) {
      setServerFunctionInputForInsightsList({
        insights: [{ title, citations: [] }] as unknown as Insight[],
      });
      setActiveServerFunctionForInsightsList({
        function: async (input: InsightsAPISchema, token: string) => {
          if (token) {
            return createInsights(input, token);
          }
          return Promise.resolve([]);
        },
      });
    }
  };

  const createLinkAndAddToInsights = async (
    {
      url,
      selectedInsights,
      newInsightName,
    }: {
      url: string;
      selectedInsights: Insight[];
      newInsightName: string;
    },
    token: string,
  ): Promise<FLVResponse[]> => {
    const responses: FLVResponse[] = [];
    if (!token) {
      throw new Error("Authentication token is required");
    }

    try {
      const link = await createLink(url, token);

      if (newInsightName) {
        const response = await createInsightFromCitations(
          newInsightName,
          [{ summary_id: link.id } as InsightEvidence],
          token,
        );
        responses.push(response);
      }

      if (selectedInsights.length > 0) {
        await Promise.all(
          selectedInsights.map(async (insight) => {
            try {
              const insightWithEvidence = {
                insight,
                evidence: [{ summary_id: link.id } as InsightEvidence],
              };
              await addCitationsToInsight(insightWithEvidence, token);
              responses.push({ action: 0, facts: [insightWithEvidence] });
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

  const showConfirmation = (selectedInsights?: Insight[]) => {
    if (selectedInsights && confirm("Are you sure?")) {
      setServerFunctionInputForInsightsList({ insights: selectedInsights });
    }
  };

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
            </div>

            {/* Main Content - Main Level */}
            <CurrentUserContext.Provider value={currentUser}>
              <div className={cardStyles.contentCard}>
                <div className={cardStyles.contentCardHeader}>
                  <div className={cardStyles.hierarchyIndicator}>
                    <div>
                      <span className={cardStyles.hierarchyIcon}>📋</span>
                      Insights List
                    </div>
                    <div id="unselectedActions_container"></div>
                  </div>
                </div>
                <div className={cardStyles.contentCardBody}>
                  <InfiniteScrollLoader
                    data={liveData}
                    setData={
                      setLiveData as React.Dispatch<
                        React.SetStateAction<Fact[] | undefined>
                      >
                    }
                    limit={PAGE_SIZE}
                    getDataFunction={async (offset, token) => {
                      const queryParams = new URLSearchParams(
                        `offset=${offset}&limit=${PAGE_SIZE}&parents=true&children=true&evidence=true`,
                      );
                      queryParams.sort();
                      const response = await fetch(
                        `/api/insights?${queryParams.toString()}`,
                        {
                          method: "GET",
                          headers: {
                            "Content-Type": "application/json",
                            "x-access-token": token,
                          },
                        },
                      );
                      return (await response.json()) as Insight[];
                    }}
                  >
                    <FactsListView
                      factName="insight"
                      serverFunctionInput={serverFunctionInputForInsightsList}
                      setServerFunctionInput={
                        setServerFunctionInputForInsightsList
                      }
                      activeServerFunction={activeServerFunctionForInsightsList}
                      setActiveServerFunction={
                        setActiveServerFunctionForInsightsList
                      }
                      selectedFacts={selectedInsights}
                      setSelectedFacts={
                        setSelectedInsights as React.Dispatch<
                          React.SetStateAction<Fact[]>
                        >
                      }
                      unselectedActionsContainerId="unselectedActions_container"
                      unselectedActions={[
                        {
                          className: cardStyles.addButton,
                          text: "Create New Insight",
                          icon: "+",
                          enabled: !!currentUser,
                          handleOnClick: promptForNewInsightName,
                          serverFunction: ({ insights }: InsightsAPISchema) => {
                            if (token) {
                              return createInsights({ insights }, token);
                            }
                            return Promise.resolve([]);
                          },
                        },
                        {
                          className: cardStyles.addButton,
                          text: "Save Link",
                          icon: "🔗",
                          enabled: !!currentUser,
                          handleOnClick: () => {
                            setIsSaveLinkDialogOpen(true);
                          },
                          serverFunction: ({
                            url,
                            selectedInsights,
                            newInsightName,
                          }) => {
                            if (token) {
                              return createLinkAndAddToInsights(
                                {
                                  url,
                                  selectedInsights,
                                  newInsightName,
                                },
                                token,
                              );
                            }
                            return Promise.resolve([]);
                          },
                        },
                      ]}
                      selectedActions={[
                        {
                          className: cardStyles.addButton,
                          text: "Publish",
                          icon: "📢",
                          enabled: !!currentUser,
                          handleOnClick: showConfirmation,
                          serverFunction: publishInsights,
                        },
                        {
                          className: cardStyles.removeButton,
                          text: "Delete",
                          icon: "🗑️",
                          enabled: !!currentUser,
                          handleOnClick: showConfirmation,
                          serverFunction: deleteInsights,
                        },
                      ]}
                      columns={[
                        {
                          name: "💭↑",
                          dataColumn: "parents",
                          display: (insight: Fact | Insight) => (
                            <span className="badge text-bg-danger">
                              {insight.parents?.length ?? 0}
                            </span>
                          ),
                        },
                        {
                          name: "💭↓",
                          dataColumn: "children",
                          display: (insight: Fact | Insight) => (
                            <span className="badge text-bg-danger">
                              {insight.children?.length ?? 0}
                            </span>
                          ),
                        },
                        {
                          name: "📄",
                          dataColumn: "evidence",
                          display: (insight: Fact | Insight) => (
                            <span className="badge text-bg-danger">
                              {insight.evidence?.length ?? 0}
                            </span>
                          ),
                        },
                        {
                          name: "🌎",
                          dataColumn: "is_public",
                          display: (insight: Fact | Insight) => (
                            <span>{insight.is_public ? "✅" : ""}</span>
                          ),
                        },
                      ]}
                    />
                  </InfiniteScrollLoader>
                </div>
              </div>

              {/* Child Level - Dialogs */}
              <SaveLinkDialog
                id={SAVE_LINK_DIALOG_ID}
                isOpen={isSaveLinkDialogOpen}
                onClose={() => setIsSaveLinkDialogOpen(false)}
                potentialInsightsFromServer={liveData.filter(
                  (insight) => insight.user_id == currentUser?.id,
                )}
                setServerFunctionInput={setServerFunctionInputForInsightsList}
                setActiveServerFunction={setActiveServerFunctionForInsightsList}
              />
            </CurrentUserContext.Provider>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSidePage;
