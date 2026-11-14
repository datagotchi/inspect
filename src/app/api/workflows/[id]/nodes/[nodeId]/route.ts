/* eslint-disable @typescript-eslint/no-explicit-any */
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import { getAuthUser } from "@/app/functions";
import {
  WorkflowNodeOJSModel,
  WorkflowOJSModel,
} from "@/app/api/models/workflows";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> },
) {
  try {
    const { id: workflowId, nodeId } = await params;

    if (isNaN(parseInt(workflowId)) || isNaN(parseInt(nodeId))) {
      return NextResponse.json(
        { error: "Invalid workflow ID or node ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const { label, node_type_id, description, x, y } = body;

    // Filter updates to prevent unexpected field mutation
    const updateData: Record<string, any> = {};
    if (label !== undefined) updateData.label = label;
    if (node_type_id !== undefined) updateData.node_type_id = node_type_id;
    if (description !== undefined) updateData.description = description;
    if (x !== undefined) updateData.x = x;
    if (y !== undefined) updateData.y = y;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    // Execute PATCH via Objection.js / Knex model
    const updatedNode = await WorkflowNodeOJSModel.query()
      .patchAndFetchById(nodeId, updateData)
      .where("workflow_id", workflowId);

    if (!updatedNode) {
      return NextResponse.json(
        { error: "Workflow node not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(updatedNode, { status: 200 });
  } catch (error: any) {
    console.error("Failed to update workflow node:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

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
