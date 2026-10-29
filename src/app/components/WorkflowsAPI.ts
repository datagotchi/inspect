import { WorkflowOJSModel } from "../api/models/workflows";
import { PostInsightsRouteResponse } from "../api/insights/route";
import {
  FLVResponse,
  Workflow,
  WorkflowNode,
  WorkflowNodeLink,
  WorkflowNodeType,
  WorkflowNodeMetadataItem,
  WorkflowLinkMetadataItem,
} from "../types";

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

export const deleteWorkflow = async (workflow: Workflow, token: string) =>
  fetch(`/api/workflows/${workflow.id}`, {
    method: "DELETE",
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
      (deletedWf: WorkflowOJSModel) =>
        ({
          action: -1,
          facts: [deletedWf],
        }) as FLVResponse,
    );

export const getWorkflowNodeTypes = async (): Promise<WorkflowNodeType[]> => {
  const res = await fetch("/api/workflows/types");

  if (!res.ok) throw new Error("Failed to get workflow node types");

  return await res.json();
};

export const createWorkflowNode = async (
  workflowId: number,
  nodeData: { label: string; type?: string },
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

export async function deleteWorkflowNode(
  workflowId: number,
  nodeId: number,
  token?: string,
) {
  const res = await fetch(`/api/workflows/${workflowId}/nodes/${nodeId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

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

export async function getNodeMetadata(
  workflowId: number,
  nodeId: number,
  token?: string,
): Promise<WorkflowNodeMetadataItem[]> {
  const res = await fetch(
    `/api/workflows/${workflowId}/nodes/${nodeId}/metadata`,
    {
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    },
  );
  if (!res.ok) return [];
  return res.json();
}

export async function saveNodeMetadata(
  workflowId: number,
  nodeId: number,
  metadata: WorkflowNodeMetadataItem[],
  token?: string,
): Promise<boolean> {
  const res = await fetch(
    `/api/workflows/${workflowId}/nodes/${nodeId}/metadata`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify(metadata),
    },
  );
  return res.ok;
}

export async function deleteNodeMetadata(
  workflowId: number,
  nodeId: number,
  metadataId: number,
  token?: string,
): Promise<boolean> {
  const res = await fetch(
    `/api/workflows/${workflowId}/nodes/${nodeId}/metadata/${metadataId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    },
  );
  return res.ok;
}

export async function deleteWorkflowLink(
  workflowId: number,
  linkId: number,
  token?: string,
): Promise<boolean> {
  const res = await fetch(`/api/workflows/${workflowId}/links/${linkId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token || ""}`,
    },
  });
  return res.ok;
}

export async function getLinkMetadata(
  workflowId: number,
  linkId: number,
  token?: string,
): Promise<WorkflowLinkMetadataItem[]> {
  const res = await fetch(
    `/api/workflows/${workflowId}/links/${linkId}/metadata`,
    {
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    },
  );
  if (!res.ok) return [];
  return res.json();
}

export async function saveLinkMetadata(
  workflowId: number,
  linkId: number,
  metadata: WorkflowLinkMetadataItem[],
  token?: string,
): Promise<boolean> {
  const res = await fetch(
    `/api/workflows/${workflowId}/links/${linkId}/metadata`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify(metadata),
    },
  );
  return res.ok;
}
