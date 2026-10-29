import { NextResponse } from "next/server";
import { WorkflowNodeLinkOJSModel } from "@/app/api/models/workflows";

interface RouteParams {
  params: Promise<{ id: string; linkId: string }>;
}

// DELETE /api/workflows/[id]/links/[linkId]
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { linkId } = await params;

    const numDeleted = await WorkflowNodeLinkOJSModel.query().deleteById(
      Number(linkId),
    );

    if (!numDeleted) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, deletedLinkId: Number(linkId) });
  } catch (error) {
    console.error("Failed to delete workflow link:", error);
    return NextResponse.json(
      { error: "Failed to delete workflow link" },
      { status: 500 },
    );
  }
}
