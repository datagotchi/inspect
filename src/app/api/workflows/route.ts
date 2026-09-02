import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../postgres";
import { Workflow } from "@/app/types";
import { getAuthUser } from "@/app/functions";
import { WorkflowModel } from "../models/workflows";

export type GetWorkflowsRouteResponse = NextResponse<
  Workflow[] | { statusText: string }
>;

export async function GET(
  req: NextRequest,
): Promise<GetWorkflowsRouteResponse> {
  const authUser = await getAuthUser(headers);
  const searchQuery = req.nextUrl.searchParams.get("query") || "";
  const offset = Number(req.nextUrl.searchParams.get("offset") || 0);
  const limit = Number(req.nextUrl.searchParams.get("limit") || 20);
  const includeParents = Boolean(req.nextUrl.searchParams.get("parents"));
  const includeChildren = Boolean(req.nextUrl.searchParams.get("children"));
  const includeEvidence = Boolean(req.nextUrl.searchParams.get("evidence"));

  if (authUser) {
    // 1. Fetch ONLY root-level insights (insights with no parents in insight_links)
    const baseQuery = WorkflowModel.query()
      .where("insights.user_id", authUser.id!)
      .whereNotExists(WorkflowModel.relatedQuery("parents"))
      .whereRaw("LOWER(insights.title) LIKE LOWER(?)", [`%${searchQuery}%`])
      .orderBy("insights.updated_at", "desc");

    const paginatedInsightIdsSubquery = baseQuery
      .clone()
      .select("insights.id")
      .offset(offset)
      .limit(limit);

    // 2. Use withGraphFetched instead of withGraphJoined to fetch ALL child rows accurately
    const workflows = (await WorkflowModel.query()
      .withGraphFetched(
        `[
      ${includeParents ? "parents.parentInsight," : ""}
      ${includeChildren ? "children.childInsight.evidence," : ""}
      ${includeEvidence ? "evidence" : ""}
    ]`,
      )
      .whereIn("insights.id", paginatedInsightIdsSubquery)
      .orderBy("insights.updated_at", "desc")) as WorkflowModel[];

    // TODO: 3. Clean up null graph mapping objects so empty child nodes don't render blank boxes

    return NextResponse.json(workflows);
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
