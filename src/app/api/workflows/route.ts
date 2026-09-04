import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "../postgres";
import { Workflow } from "@/app/types";
import { getAuthUser } from "@/app/functions";
import { WorkflowOJSModel } from "../models/workflows";

export type GetWorkflowsRouteResponse = NextResponse<
  Workflow[] | { statusText: string }
>;

export async function GET(
  req: NextRequest,
): Promise<GetWorkflowsRouteResponse> {
  const authUser = await getAuthUser(headers);

  if (!authUser) {
    return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
  }

  const offset = Number(req.nextUrl.searchParams.get("offset") || 0);
  const limit = Number(req.nextUrl.searchParams.get("limit") || 20);

  // Fetch workflows paginated, eager-loading ONLY the user info (no nodes)
  const workflows = (await WorkflowOJSModel.query()
    .where("workflows.user_id", authUser.id!)
    .withGraphFetched("user")
    .orderBy("created_at", "desc")
    .offset(offset)
    .limit(limit)) as WorkflowOJSModel[];

  return NextResponse.json(workflows);
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
    const newWorkflow = (await WorkflowOJSModel.query().insert({
      user_id: authUser.id,
      // uid,
      name,
    })) as WorkflowOJSModel;

    return NextResponse.json(newWorkflow);
  } catch (error) {
    console.error("Error in POST /api/workflows:", error);
    return NextResponse.json(
      { statusText: "Internal server error while creating workflow" },
      { status: 500 },
    );
  }
}
