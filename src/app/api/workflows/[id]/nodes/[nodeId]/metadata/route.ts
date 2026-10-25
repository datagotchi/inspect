import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

import {
  WorkflowNodeOJSModel,
  WorkflowOJSModel,
} from "@/app/api/models/workflows";
import { getAuthUser } from "@/app/functions";

const getValidatedNode = async (nodeId: number, authUserId: number) => {
  return WorkflowNodeOJSModel.query()
    .findById(nodeId)
    .withGraphFetched("metadata")
    .whereIn(
      "id",
      WorkflowNodeOJSModel.query()
        .select("id")
        .whereExists(
          WorkflowNodeOJSModel.relatedQuery<WorkflowOJSModel>("workflow").where(
            "user_id",
            authUserId,
          ),
        ),
    );
};

// get ALL metadata items
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const nodeId = Number((await params).nodeId);
    const node = await getValidatedNode(nodeId, authUser.id!);

    console.log("*** node: ", node);

    if (node) {
      return NextResponse.json(node.metadata ?? []);
    }

    return NextResponse.json({ statusText: "Node not found" }, { status: 404 });
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}

// change one metadata item's value
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const nodeId = Number((await params).nodeId);
    const node = await getValidatedNode(nodeId, authUser.id!);

    if (node) {
      const body = await req.json();
      if (body && Array.isArray(body)) {
        const updatedNode = await WorkflowNodeOJSModel.query().upsertGraph(
          {
            id: nodeId,
            metadata: body,
          },
          {
            unrelate: false, // Set to false so it completely deletes the orphaned metadata row
            relate: false,
          },
        );
        return NextResponse.json(updatedNode);
      }

      return NextResponse.json(
        { statusText: "Valid metadata body not provided" },
        { status: 400 },
      );
    }

    return NextResponse.json({ statusText: "Node not found" }, { status: 404 });
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}

// delete specified metadata item
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const nodeId = Number((await params).nodeId);
    const node = await getValidatedNode(nodeId, authUser.id!);

    if (node && node.metadata) {
      const targetMetadataItem = req.nextUrl.searchParams.get("item");
      const updatedNode = await WorkflowNodeOJSModel.query().upsertGraph(
        {
          id: nodeId,
          metadata: node.metadata.filter(
            (mdItem) => mdItem.fieldname !== targetMetadataItem,
          ),
        },
        {
          unrelate: false, // Set to false so it completely deletes the orphaned metadata row
          relate: false,
        },
      );
      return NextResponse.json(updatedNode);
    }

    return NextResponse.json(
      { statusText: "Node with metadata not found" },
      { status: 404 },
    );
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
