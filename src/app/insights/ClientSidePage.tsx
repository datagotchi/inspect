"use client";

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
    }
  };

  const showConfirmation = (selectedInsights?: Insight[]) => {
    if (selectedInsights && confirm("Are you sure?")) {
      setServerFunctionInputForInsightsList({ insights: selectedInsights });
    }
  };

  const createLinkAndAddToInsights = async ({
    url,
    selectedInsights,
    newInsightName,
  }: {
    url: string;
    selectedInsights: Insight[];
    newInsightName: string;
  }): Promise<FLVResponse[]> => {
    const responses: FLVResponse[] = [];
    if (token) {
      const link = await createLink(url, token);
      if (newInsightName) {
        const response = await createInsightFromCitations(
          newInsightName,
          [{ summary_id: link.id } as InsightEvidence],
          token,
        );
        responses.push(response);
      }
      await Promise.all(
        selectedInsights.map(async (insight) => {
          await addCitationsToInsight(
            {
              insight,
              evidence: [{ summary_id: link.id } as InsightEvidence],
            },
            token,
          );
          // FIXME: does not update the insight in prod
          responses.push({ action: 0, facts: [insight] });
        }),
      );
    }
    return responses;
  };

  const LIMIT = 20;
  return (
    <div id="body">
      <h2>My Insights ({liveData.length})</h2>
      <CurrentUserContext.Provider value={currentUser}>
        <InfiniteScrollLoader
          data={liveData}
          setData={
            setLiveData as React.Dispatch<
              React.SetStateAction<Fact[] | undefined>
            >
          }
          limit={LIMIT}
          getDataFunction={async (offset, token) => {
            const queryParams = new URLSearchParams(
              `offset=${offset}&limit=${LIMIT}&parents=true&children=true&evidence=true`,
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
            const json = (await response.json()) as Insight[];
            return json;
          }}
        >
          {/* FIXME: create selectedActions to /insights table to add parent/children to selected insights  */}
          {/* FIXME: be a landing page for anonymous users with top insights */}
          {/* FIXME: sort by citation count desc by default (here & the route) */}
          <FactsListView
            factName="insight"
            serverFunctionInput={serverFunctionInputForInsightsList}
            setServerFunctionInput={setServerFunctionInputForInsightsList}
            activeServerFunction={activeServerFunctionForInsightsList}
            setActiveServerFunction={setActiveServerFunctionForInsightsList}
            selectedFacts={selectedInsights}
            setSelectedFacts={
              setSelectedInsights as React.Dispatch<
                React.SetStateAction<Fact[]>
              >
            }
            unselectedActions={[
              {
                className: "btn btn-primary",
                text: "Save Link in Insight(s)",
                enabled: !!currentUser,
                handleOnClick: () => {
                  const dialog = document.getElementById(SAVE_LINK_DIALOG_ID);
                  (dialog as HTMLDialogElement).showModal();
                },
                serverFunction: createLinkAndAddToInsights,
              },
              {
                className: "btn btn-primary",
                text: "Create Insight",
                enabled: !!currentUser,
                handleOnClick: promptForNewInsightName,
                serverFunction: ({ insights }: InsightsAPISchema) => {
                  if (token) {
                    return createInsights({ insights }, token);
                  }
                  return Promise.resolve([]);
                },
              },
            ]}
            selectedActions={[
              {
                className: "btn btn-primary",
                text: "Publish Insights",
                enabled: !!currentUser,
                handleOnClick: showConfirmation,
                serverFunction: publishInsights,
              },
              {
                className: "btn bg-danger",
                text: "Delete Insights",
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
              // FIXME: add is_complete to table and route
              // {
              //   name: "⚠️",
              //   dataColumn: "is_incomplete",
              //   display: (insight: Fact | Insight) => (
              //     <span>{insight.is_incomplete ? "⚠️" : ""}</span>
              //   ),
              // },
            ]}
          />
        </InfiniteScrollLoader>
        <SaveLinkDialog
          id={SAVE_LINK_DIALOG_ID}
          potentialInsightsFromServer={liveData.filter(
            (insight) => insight.user_id == currentUser?.id,
          )}
          setServerFunctionInput={setServerFunctionInputForInsightsList}
          setActiveServerFunction={setActiveServerFunctionForInsightsList}
        />
      </CurrentUserContext.Provider>
    </div>
  );
};

export default ClientSidePage;
