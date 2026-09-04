import { WorkflowOJSModel } from "../api/models/workflows";
import { PostInsightsRouteResponse } from "../api/insights/route";
import { FLVResponse, WorkflowNode, WorkflowNodeLink } from "../types";

export const createWorkflow = (
  workflow: Partial<WorkflowOJSModel>,
  token: string,
): Promise<FLVResponse> =>
  fetch("/api/workflows", {
    method: "POST",
    body: JSON.stringify(workflow),
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
      (createdWf: WorkflowOJSModel) =>
        ({
          action: 1,
          facts: [createdWf],
        }) as FLVResponse,
    );

export const createWorkflowNode = async (
  workflowId: number,
  nodeData: { label: string },
  token?: string,
): Promise<WorkflowNode | null> => {
  try {
    const res = await fetch(`/api/workflows/${workflowId}/nodes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(nodeData),
    });

    if (!res.ok) throw new Error("Failed to create node");
    return await res.json();
  } catch (error) {
    console.error("Error creating workflow node:", error);
    return null;
  }
};

export const createWorkflowLink = async (
  workflowId: number,
  linkData: { parent_id: number; child_id: number },
  token?: string,
): Promise<WorkflowNodeLink | null> => {
  try {
    const res = await fetch(`/api/workflows/${workflowId}/links`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(linkData),
    });

    if (!res.ok) throw new Error("Failed to create workflow link");
    const data = await res.json();
    return data.link || data;
  } catch (error) {
    console.error("Error creating workflow link:", error);
    return null;
  }
};
