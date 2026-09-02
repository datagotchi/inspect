import { GetWorkflowsRouteResponse } from "../api/workflows/route";
import { Workflow } from "../types";

export const getWorkflows = async (
  origin: string,
  token?: string,
  queryParams?: URLSearchParams,
): Promise<Workflow[] | boolean> => {
  if (token) {
    const workflowsApiUrl = `${origin}/api/workflows${queryParams ? "?" + queryParams.toString() : ""}`;

    const response = (await fetch(workflowsApiUrl, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    })) as GetWorkflowsRouteResponse;

    if (response.status == 200) {
      return (await response.json()) as Workflow[];
    }
    // else {
    //   const err = await response.json();
    //   throw new Error(
    //     `Error fetching workflows: ${err.message || err.statusText || ""}`,
    //   );
    // }
  }

  return Promise.resolve(false);
};

export const getWorkflow = async (
  origin: string,
  token?: string,
  id?: number,
): Promise<Workflow | false> => {
  if (token && id) {
    const response = (await fetch(`${origin}/api/workflows/${id}`, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    })) as GetWorkflowsRouteResponse;

    if (response.status == 200) {
      return (await response.json()) as Workflow;
    }
  }

  return Promise.resolve(false);
};
