import { PostInsightsRouteResponse } from "../api/insights/route";
import { FLVResponse, Workflow } from "../types";

export type WorkflowsAPISchema = {
  workflow: Workflow;
};

export const createWorkflow = (
  { workflow: wf }: WorkflowsAPISchema,
  token: string,
): Promise<FLVResponse> =>
  // TODO: verify insight matches Awaited<PostInsightsRouteRequestBody>
  fetch("/api/workflows", {
    method: "POST",
    body: JSON.stringify(wf),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  })
    .then((response: Response | PostInsightsRouteResponse) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then(
      (wf: Workflow) =>
        ({
          action: 1,
          facts: [wf],
        }) as FLVResponse,
    );

// type PartialInsightProperties = WithPartial<
//   Omit<Insight, "uid" | "children" | "evidence">,
//   keyof Omit<Insight, "uid" | "children" | "evidence">
// > & {
//   children?: Partial<Insight>[];
//   evidence?: Partial<InsightEvidence>[];
// };

// export const modifyInsight = (
//   insight: Pick<Insight, "uid"> &
//     PartialInsightProperties & {
//       removeChildren?: Pick<InsightEvidence, "id">[];
//       removeEvidence?: Pick<InsightEvidence, "summary_id">[];
//     },
//   token: string,
// ): Promise<FLVResponse> =>
//   fetch(`/api/insights/${insight.uid}`, {
//     method: "PATCH",
//     body: JSON.stringify(insight),
//     headers: {
//       "Content-Type": "application/json",
//       "x-access-token": token,
//     },
//   })
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error(response.statusText);
//       }
//       return response.json();
//     })
//     .then((updatedPartialInsight: Partial<Insight>) => ({
//       action: 0,
//       facts: [
//         {
//           ...insight,
//           ...updatedPartialInsight,
//         },
//       ],
//     }));

// export const deleteWorkflow = async (
//   { workflows }: WorkflowsAPISchema,
//   token: string,
// ): Promise<FLVResponse> => {
//   const finalResponse: FLVResponse = workflows.reduce(
//     (response: FLVResponse, wf: Workflow) => {
//       fetch(`/api/workflows/${wf.id}`, {
//         method: "DELETE",
//         headers: {
//           "Content-Type": "application/json",
//           "x-access-token": token,
//         },
//       }).then((response) => {
//         if (!response.ok) {
//           throw new Error(response.statusText);
//         }
//       });
//       response.facts.push(wf);
//       return response;
//     },
//     { action: -1, facts: [] },
//   );
//   return finalResponse;
// };
