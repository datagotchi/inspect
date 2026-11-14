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
      console.warn(
        "[POST /links] Validation failed: Missing parent_id or child_id",
      );
      return NextResponse.json(
        { error: "Both parent_id and child_id are required" },
        { status: 400 },
      );
    }

    if (parent_id === child_id) {
      console.warn("[POST /links] Validation failed: Node self-link attempt");
      return NextResponse.json(
        { error: "Cannot link a node to itself" },
        { status: 400 },
      );
    }

    // Verify both nodes belong to this workflow
    const nodes = await WorkflowNodeOJSModel.query()
      .whereIn("id", [parent_id, child_id])
      .andWhere("workflow_id", Number(workflowId));

    if (nodes.length !== 2) {
      console.warn(
        `[POST /links] Validation failed: Found ${nodes.length}/2 nodes for workflowId=${workflowId}`,
      );
      return NextResponse.json(
        { error: "One or both nodes do not belong to this workflow" },
        { status: 400 },
      );
    }

    // Check for existing link
    const existingLink = await WorkflowNodeLinkOJSModel.query().findOne({
      parent_id,
      child_id,
      workflow_id: Number(workflowId),
    });

    if (existingLink) {
      return NextResponse.json({ link: existingLink }, { status: 200 });
    }

    // Insert new link INCLUDING workflow_id
    const newLink = await WorkflowNodeLinkOJSModel.query().insertAndFetch({
      parent_id,
      child_id,
      workflow_id: Number(workflowId), // 👈 FIXED: Added workflow_id here!
    });

    return NextResponse.json({ link: newLink }, { status: 201 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("[POST /links] Error creating link:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
