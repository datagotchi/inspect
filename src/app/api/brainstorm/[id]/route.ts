import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "@/app/api/postgres";
import { getAuthUser } from "@/app/functions";
import { BrainstormNodeOJSModel } from "../../models/brainstorm";

function parseNodeId(rawId: string): number | null {
  const parsed = Number(rawId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser) {
      return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const nodeId = parseNodeId(rawId);
    if (!nodeId) {
      return NextResponse.json(
        { statusText: "Invalid node id" },
        { status: 400 },
      );
    }

    const row = await BrainstormNodeOJSModel.query().findById(nodeId);
    if (!row) {
      return NextResponse.json(
        { statusText: "Node not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      node: {
        id: String(row.id),
        label: row.label,
        note: row.note ?? "",
        x: Number(row.x),
        y: Number(row.y),
      },
    });
  } catch (error) {
    console.error("Error in GET /api/brainstorm/[id]:", error);
    return NextResponse.json(
      { statusText: "Internal server error while fetching brainstorm node" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser) {
      return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const nodeId = parseNodeId(rawId);
    if (!nodeId) {
      return NextResponse.json(
        { statusText: "Invalid node id" },
        { status: 400 },
      );
    }

    const body = await req.json();
    const patch: Partial<BrainstormNodeOJSModel> = {};

    if (typeof body?.label === "string") {
      patch.label = body.label;
    }
    if (typeof body?.note === "string") {
      patch.note = body.note;
    }
    if (body?.x !== undefined && Number.isFinite(Number(body.x))) {
      patch.x = Number(body.x);
    }
    if (body?.y !== undefined && Number.isFinite(Number(body.y))) {
      patch.y = Number(body.y);
    }

    if (Object.keys(patch).length === 0) {
      return NextResponse.json(
        { statusText: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    patch.updated_at = new Date().toISOString();

    const updated = await BrainstormNodeOJSModel.query().patchAndFetchById(
      nodeId,
      patch,
    );

    if (!updated) {
      return NextResponse.json(
        { statusText: "Node not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      node: {
        id: String(updated.id),
        label: updated.label,
        note: updated.note ?? "",
        x: Number(updated.x),
        y: Number(updated.y),
      },
    });
  } catch (error) {
    console.error("Error in PATCH /api/brainstorm/[id]:", error);
    return NextResponse.json(
      { statusText: "Internal server error while updating brainstorm node" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser) {
      return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
    }

    const { id: rawId } = await context.params;
    const nodeId = parseNodeId(rawId);
    if (!nodeId) {
      return NextResponse.json(
        { statusText: "Invalid node id" },
        { status: 400 },
      );
    }

    const deletedCount =
      await BrainstormNodeOJSModel.query().deleteById(nodeId);
    if (deletedCount === 0) {
      return NextResponse.json(
        { statusText: "Node not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ ok: true, id: String(nodeId) });
  } catch (error) {
    console.error("Error in DELETE /api/brainstorm/[id]:", error);
    return NextResponse.json(
      { statusText: "Internal server error while deleting brainstorm node" },
      { status: 500 },
    );
  }
}
