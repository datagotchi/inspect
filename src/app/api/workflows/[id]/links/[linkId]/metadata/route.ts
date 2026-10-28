import { NextResponse } from "next/server";
import { WorkflowLinkMetadataOJSModel } from "@/app/api/models/workflows";

interface RouteParams {
  params: Promise<{ id: string; linkId: string }>;
}

// GET /api/workflows/[id]/links/[linkId]/metadata
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { linkId } = await params;

    const metadata = await WorkflowLinkMetadataOJSModel.query().where(
      "link_id",
      Number(linkId),
    );

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Failed to fetch link metadata:", error);
    return NextResponse.json(
      { error: "Failed to fetch link metadata" },
      { status: 500 },
    );
  }
}

// PUT /api/workflows/[id]/links/[linkId]/metadata
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { linkId } = await params;
    const body = await request.json(); // Array of metadata items

    const numericLinkId = Number(linkId);

    // Atomic transaction: replace existing metadata entries with the updated array
    await WorkflowLinkMetadataOJSModel.transaction(async (trx) => {
      // 1. Clear current metadata for this link
      await WorkflowLinkMetadataOJSModel.query(trx)
        .where("link_id", numericLinkId)
        .delete();

      // 2. Insert new metadata entries if any exist
      if (Array.isArray(body) && body.length > 0) {
        const rowsToInsert = body.map((item) => ({
          link_id: numericLinkId,
          fieldname: item.fieldname,
          value: item.value,
        }));

        await WorkflowLinkMetadataOJSModel.query(trx).insert(rowsToInsert);
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save link metadata:", error);
    return NextResponse.json(
      { error: "Failed to save link metadata" },
      { status: 500 },
    );
  }
}
