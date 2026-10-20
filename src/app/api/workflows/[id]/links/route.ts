import { NextResponse } from "next/server";
import {
  WorkflowNodeLinkOJSModel,
  WorkflowNodeOJSModel,
} from "@/app/api/models/workflows";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: workflowId } = await params;
    const { parent_id, child_id } = await req.json();

    if (!parent_id || !child_id) {
      return NextResponse.json(
        { error: "Both parent_id and child_id are required" },
        { status: 400 },
      );
    }

    if (parent_id === child_id) {
      return NextResponse.json(
        { error: "Cannot link a node to itself" },
        { status: 400 },
      );
    }

    // Verify both nodes belong to this workflow
    const nodes = await WorkflowNodeOJSModel.query()
      .whereIn("id", [parent_id, child_id])
      .andWhere("workflow_id", Number(workflowId));

    // Handle same-node vs two different nodes validation count
    if (nodes.length !== 2) {
      return NextResponse.json(
        { error: "One or both nodes do not belong to this workflow" },
        { status: 400 },
      );
    }

    // Check for existing link
    const existingLink = await WorkflowNodeLinkOJSModel.query().findOne({
      parent_id,
      child_id,
    });

    if (existingLink) {
      return NextResponse.json({ link: existingLink }, { status: 200 });
    }

    // Insert new link
    const newLink = await WorkflowNodeLinkOJSModel.query().insertAndFetch({
      parent_id,
      child_id,
    });

    return NextResponse.json({ link: newLink }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
