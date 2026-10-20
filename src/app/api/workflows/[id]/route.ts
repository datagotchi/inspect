import "@/app/api/postgres";
import { WorkflowNodeOJSModel, WorkflowOJSModel } from "../../models/workflows";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/functions";
import { headers } from "next/headers";
import { getWorkflow } from "@/app/workflows/functions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const workflowId = Number((await params).id);
    console.log(
      "*** ROUTE calling getWorkflow with: ",
      workflowId,
      authUser.id,
    );
    const workflow = await getWorkflow(workflowId, authUser.id!);

    if (workflow) {
      return NextResponse.json(workflow);
    }

    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const workflowId = Number((await params).id);

    // 1. Delete dependent nodes first
    await WorkflowNodeOJSModel.query()
      .delete()
      .where("workflow_id", workflowId); // or whatever your foreign key column name is in workflow_nodes

    // 2. Delete the parent workflow
    const workflow = await WorkflowOJSModel.query()
      .delete()
      .where("id", workflowId)
      .where("user_id", authUser.id!)
      .returning("*")
      .first();

    if (workflow) {
      return NextResponse.json(workflow);
    }

    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
