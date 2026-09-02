import { GetWorkflowsRouteResponse } from "../api/workflows/route";
import { Workflow } from "../types";

export const getWorkflows = async (
  origin: string,
  token?: string,
  queryParams?: URLSearchParams,
): Promise<Workflow[] | boolean> => {
  if (token) {
    const insightsApiUrl = `${origin}/api/insights${queryParams ? "?" + queryParams.toString() : ""}`;

    const response = (await fetch(insightsApiUrl, {
      headers: {
        "Content-Type": "application/json",
        "x-access-token": token,
      },
    })) as GetWorkflowsRouteResponse;

    if (response.status == 200) {
      return (await response.json()) as Workflow[];
    } else {
      const err = await response.json();
      throw new Error(
        `Error fetching insights: ${err.message || err.statusText || ""}`,
      );
    }
  }

  return Promise.resolve(false);
};
