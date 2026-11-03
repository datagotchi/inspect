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

// Helper to purge local draft whenever the backend state mutates
function clearWorkflowDraft(workflowId: number | string) {
  if (typeof window !== "undefined" && workflowId) {
    localStorage.removeItem(`jaw_workflow_${workflowId}_draft`);
  }
}

// Helper to construct uniform request headers
function getHeaders(token?: string, isJson: boolean = false): HeadersInit {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    // Support both Bearer and legacy x-access-token if present
    headers["Authorization"] = `Bearer ${token}`;
    headers["x-access-token"] = token;
  }
  return headers;
}

// ============================================================================
// WORKFLOW OPERATIONS
// ============================================================================

export async function fetchWorkflow(
  workflowId: number,
  token?: string,
): Promise<{ nodes: WorkflowNode[]; links: WorkflowNodeLink[] } | null> {
  try {
    const res = await fetch(`/api/workflows/${workflowId}`, {
      headers: getHeaders(token),
    });

    if (!res.ok) throw new Error("Failed to fetch workflow data");
    return await res.json();
  } catch (error) {
    console.error("Error loading workflow data:", error);
    return null;
  }
}

export const createWorkflow = (
  workflow: Partial<WorkflowOJSModel>,
  token: string,
): Promise<FLVResponse> =>
  fetch("/api/workflows", {
    method: "POST",
    body: JSON.stringify(workflow),
    headers: getHeaders(token, true),
  })
    .then((response: Response | PostInsightsRouteResponse) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((createdWf: WorkflowOJSModel) => {
      if (createdWf.id) clearWorkflowDraft(createdWf.id);
      return {
        action: 1,
        facts: [createdWf],
      } as FLVResponse;
    });

export const deleteWorkflow = async (workflow: Workflow, token: string) =>
  fetch(`/api/workflows/${workflow.id}`, {
    method: "DELETE",
    headers: getHeaders(token, true),
  })
    .then((response: Response | PostInsightsRouteResponse) => {
      if (!response.ok) {
        throw new Error(response.statusText);
      }
      return response.json();
    })
    .then((deletedWf: WorkflowOJSModel) => {
      if (workflow.id) clearWorkflowDraft(workflow.id);
      return {
        action: -1,
        facts: [deletedWf],
      } as FLVResponse;
    });

export const getWorkflowNodeTypes = async (): Promise<WorkflowNodeType[]> => {
  const res = await fetch("/api/workflows/types");
  if (!res.ok) throw new Error("Failed to get workflow node types");
  return await res.json();
};

// ============================================================================
// NODE OPERATIONS
// ============================================================================

export const createWorkflowNode = async (
  workflowId: number,
  nodeData: { label: string; type?: string },
  token?: string,
): Promise<WorkflowNode | null> => {
  try {
    const res = await fetch(`/api/workflows/${workflowId}/nodes`, {
      method: "POST",
      headers: getHeaders(token, true),
      body: JSON.stringify(nodeData),
    });

    if (!res.ok) throw new Error("Failed to create node");
    const data = await res.json();

    clearWorkflowDraft(workflowId);
    return data;
  } catch (error) {
    console.error("Error creating workflow node:", error);
    return null;
  }
};

export async function updateWorkflowNode(
  workflowId: number,
  nodeId: number,
  updates: Partial<WorkflowNode>,
  token?: string,
): Promise<WorkflowNode> {
  const res = await fetch(`/api/workflows/${workflowId}/nodes/${nodeId}`, {
    method: "PATCH",
    headers: getHeaders(token, true),
    body: JSON.stringify(updates),
  });

  if (!res.ok) {
    throw new Error("Failed to update workflow node");
  }

  const data = await res.json();
  clearWorkflowDraft(workflowId);
  return data;
}

export async function deleteWorkflowNode(
  workflowId: number,
  nodeId: number,
  token?: string,
) {
  const res = await fetch(`/api/workflows/${workflowId}/nodes/${nodeId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });

  if (!res.ok) {
    throw new Error("Failed to delete workflow node");
  }

  const data = await res.json();
  clearWorkflowDraft(workflowId);
  return data;
}

// ============================================================================
// LINK OPERATIONS
// ============================================================================

export const createWorkflowLink = async (
  workflowId: number,
  linkData: { parent_id: number; child_id: number },
  token?: string,
): Promise<WorkflowNodeLink | null> => {
  try {
    const res = await fetch(`/api/workflows/${workflowId}/links`, {
      method: "POST",
      headers: getHeaders(token, true),
      body: JSON.stringify(linkData),
    });

    if (!res.ok) throw new Error("Failed to create workflow link");
    const data = await res.json();

    clearWorkflowDraft(workflowId);
    return data.link || data;
  } catch (error) {
    console.error("Error creating workflow link:", error);
    return null;
  }
};

export async function deleteWorkflowLink(
  workflowId: number,
  linkId: number,
  token?: string,
): Promise<boolean> {
  const res = await fetch(`/api/workflows/${workflowId}/links/${linkId}`, {
    method: "DELETE",
    headers: getHeaders(token),
  });

  if (res.ok) {
    clearWorkflowDraft(workflowId);
  }
  return res.ok;
}

// ============================================================================
// METADATA OPERATIONS (NODE)
// ============================================================================

export async function getNodeMetadata(
  workflowId: number,
  nodeId: number,
  token?: string,
): Promise<WorkflowNodeMetadataItem[]> {
  const res = await fetch(
    `/api/workflows/${workflowId}/nodes/${nodeId}/metadata`,
    {
      headers: getHeaders(token),
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
      headers: getHeaders(token, true),
      body: JSON.stringify(metadata),
    },
  );

  if (res.ok) {
    clearWorkflowDraft(workflowId);
  }
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
      headers: getHeaders(token),
    },
  );

  if (res.ok) {
    clearWorkflowDraft(workflowId);
  }
  return res.ok;
}

// ============================================================================
// METADATA OPERATIONS (LINK)
// ============================================================================

export async function getLinkMetadata(
  workflowId: number,
  linkId: number,
  token?: string,
): Promise<WorkflowLinkMetadataItem[]> {
  const res = await fetch(
    `/api/workflows/${workflowId}/links/${linkId}/metadata`,
    {
      headers: getHeaders(token),
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
      headers: getHeaders(token, true),
      body: JSON.stringify(metadata),
    },
  );

  if (res.ok) {
    clearWorkflowDraft(workflowId);
  }
  return res.ok;
}
