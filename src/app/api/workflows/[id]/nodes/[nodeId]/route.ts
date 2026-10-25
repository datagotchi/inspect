import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/app/functions";
import {
  WorkflowNodeOJSModel,
  WorkflowOJSModel,
} from "@/app/api/models/workflows";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const nodeId = (await params).nodeId;
    await WorkflowNodeOJSModel.query()
      .delete()
      .where("id", Number(nodeId))
      .whereExists(
        WorkflowNodeOJSModel.relatedQuery<WorkflowOJSModel>("workflow").where(
          "user_id",
          authUser.id!,
        ),
      );
    return NextResponse.json({ statusText: "success" });
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
