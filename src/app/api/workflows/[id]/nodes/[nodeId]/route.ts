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
    const { nodeId } = await params;

    try {
      const numDeleted = await WorkflowNodeOJSModel.query()
        .delete()
        .where("id", Number(nodeId))
        .whereExists(
          WorkflowNodeOJSModel.relatedQuery<WorkflowOJSModel>("workflow").where(
            "user_id",
            authUser.id!,
          ),
        );

      if (!numDeleted) {
        return NextResponse.json({ error: "Node not found" }, { status: 404 });
      }

      return NextResponse.json({ statusText: "success" });
    } catch (error) {
      console.error("Error deleting workflow node:", error);
      return NextResponse.json(
        { error: "Failed to delete workflow node" },
        { status: 500 },
      );
    }
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
