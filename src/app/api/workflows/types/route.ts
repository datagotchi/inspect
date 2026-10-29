import { NextResponse } from "next/server";
import { headers } from "next/headers";

import "../../postgres";
import { getAuthUser } from "@/app/functions";
import { WorkflowNodeTypeOJSModel } from "../../models/workflows";

export type GetWorkflowNodeTypesRouteResponse = NextResponse<
  WorkflowNodeTypeOJSModel[] | { statusText: string }
>;

export async function GET(): Promise<GetWorkflowNodeTypesRouteResponse> {
  const authUser = await getAuthUser(headers);

  if (!authUser) {
    return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
  }

  const types = await WorkflowNodeTypeOJSModel.query().orderBy("id", "asc");

  return NextResponse.json(types);
}
