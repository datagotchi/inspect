import "../api/postgres"; // Ensures DB connection is initialized
import { WorkflowOJSModel } from "../api/models/workflows";
import { Workflow } from "../types";

interface GetWorkflowsParams {
  userId: number;
  offset?: number;
  limit?: number;
}

/**
 * Direct DB fetch for SSR (No HTTP overhead, fully populated)
 */
export const getWorkflows = async ({
  userId,
  offset = 0,
  limit = 20,
}: GetWorkflowsParams): Promise<Workflow[]> => {
  try {
    const workflows = await WorkflowOJSModel.query()
      .where("workflows.user_id", userId)
      .withGraphFetched("user") // Eagerly populates the full User object
      .orderBy("created_at", "desc")
      .offset(offset)
      .limit(limit);

    // Serialization step for Next.js Server Components passing props to Client Components
    return JSON.parse(JSON.stringify(workflows)) as Workflow[];
  } catch (error) {
    console.error("Error fetching workflows in SSR:", error);
    return [];
  }
};

export const getWorkflow = async (
  id: number,
  userId: number,
): Promise<Workflow | null> => {
  try {
    const workflow = await WorkflowOJSModel.query()
      .findById(id)
      .where("user_id", userId)
      .withGraphFetched("user") // Populates user object on single fetch too
      .first();

    if (!workflow) return null;

    return JSON.parse(JSON.stringify(workflow)) as Workflow;
  } catch (error) {
    console.error(`Error fetching workflow ${id} in SSR:`, error);
    return null;
  }
};
