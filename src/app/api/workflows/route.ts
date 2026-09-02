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
  // const searchQuery = req.nextUrl.searchParams.get("query") || "";
  const offset = Number(req.nextUrl.searchParams.get("offset") || 0);
  const limit = Number(req.nextUrl.searchParams.get("limit") || 20);

  if (authUser) {
    const baseQuery = WorkflowModel.query().where(
      "workflows.user_id",
      authUser.id!,
    );
    // .whereNotExists(WorkflowModel.relatedQuery("parents"))
    // .whereRaw("LOWER(insights.title) LIKE LOWER(?)", [`%${searchQuery}%`])
    // .orderBy("insights.updated_at", "desc");

    const paginatedInsightIdsSubquery = baseQuery
      .clone()
      .select("workflows.id")
      .offset(offset)
      .limit(limit);

    // 2. Use withGraphFetched instead of withGraphJoined to fetch ALL child rows accurately
    const workflows = (await WorkflowModel.query().whereIn(
      "workflows.id",
      paginatedInsightIdsSubquery,
    )) as WorkflowModel[];

    // TODO: 3. Clean up null graph mapping objects so empty child nodes don't render blank boxes

    return NextResponse.json(workflows);
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}

export type PostWorkflowsRouteRequestBody = Promise<{
  name: string;
}>;

interface PostWorkflowsRouteRequest extends NextRequest {
  json: () => PostWorkflowsRouteRequestBody;
}

export type PostWorkflowsRouteResponse = NextResponse<
  Workflow | { statusText: string }
>;

export async function POST(
  req: PostWorkflowsRouteRequest,
): Promise<PostWorkflowsRouteResponse> {
  try {
    // const uid = Date.now().toString(36);
    const authUser = await getAuthUser(headers);

    if (!authUser) {
      return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
    }

    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { statusText: "Creating a new workflow requires at least a name" },
        { status: 400 },
      );
    }

    // First create the insight without evidence
    const newWorkflow = (await WorkflowModel.query().insert({
      user_id: authUser.id,
      // uid,
      name,
    })) as WorkflowModel;

    return NextResponse.json(newWorkflow);
  } catch (error) {
    console.error("Error in POST /api/workflows:", error);
    return NextResponse.json(
      { statusText: "Internal server error while creating workflow" },
      { status: 500 },
    );
  }
}
