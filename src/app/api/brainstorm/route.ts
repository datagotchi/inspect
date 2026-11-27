import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "@/app/api/postgres";
import { getAuthUser } from "@/app/functions";
import {
  BrainstormEdgeOJSModel,
  BrainstormNodeOJSModel,
} from "../models/brainstorm";

export async function GET() {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser) {
      return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
    }

    const [nodeRows, edgeRows] = await Promise.all([
      BrainstormNodeOJSModel.query().orderBy("id", "asc"),
      BrainstormEdgeOJSModel.query().orderBy("id", "asc"),
    ]);

    const nodes = nodeRows.map((row) => ({
      id: String(row.id),
      label: row.label,
      note: row.note ?? "",
      x: Number(row.x),
      y: Number(row.y),
    }));

    const edges = edgeRows.map((row) => ({
      id: String(row.id),
      from: String(row.from_id),
      to: String(row.to_id),
    }));

    return NextResponse.json({ nodes, edges });
  } catch (error) {
    console.error("Error in GET /api/brainstorm:", error);
    return NextResponse.json(
      { statusText: "Internal server error while loading brainstorm graph" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser) {
      return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    if (body?.kind === "edge") {
      const fromId = Number(body.from);
      const toId = Number(body.to);

      if (!Number.isInteger(fromId) || !Number.isInteger(toId)) {
        return NextResponse.json(
          { statusText: "Valid integer from and to node IDs are required" },
          { status: 400 },
        );
      }

      if (fromId === toId) {
        return NextResponse.json(
          { statusText: "Self-loops are not allowed" },
          { status: 400 },
        );
      }

      const existing = await BrainstormEdgeOJSModel.query()
        .where({ from_id: fromId, to_id: toId })
        .first();

      const edgeRow =
        existing ??
        (await BrainstormEdgeOJSModel.query().insertAndFetch({
          from_id: fromId,
          to_id: toId,
        }));

      return NextResponse.json(
        {
          edge: {
            id: String(edgeRow.id),
            from: String(edgeRow.from_id),
            to: String(edgeRow.to_id),
          },
        },
        { status: 201 },
      );
    }

    const label =
      typeof body?.label === "string" && body.label.trim().length > 0
        ? body.label.trim()
        : "Untitled concept";
    const note = typeof body?.note === "string" ? body.note : "";
    const x = Number.isFinite(Number(body?.x)) ? Number(body.x) : 120;
    const y = Number.isFinite(Number(body?.y)) ? Number(body.y) : 120;
    const sourceType =
      typeof body?.sourceType === "string" && body.sourceType.trim()
        ? body.sourceType.trim()
        : null;
    const sourceId =
      body?.sourceId !== null &&
      body?.sourceId !== undefined &&
      Number.isInteger(Number(body.sourceId))
        ? Number(body.sourceId)
        : null;

    const nodeRow = await BrainstormNodeOJSModel.query().insertAndFetch({
      label,
      note,
      x,
      y,
      source_type: sourceType,
      source_id: sourceId,
    });

    return NextResponse.json(
      {
        node: {
          id: String(nodeRow.id),
          label: nodeRow.label,
          note: nodeRow.note ?? "",
          x: Number(nodeRow.x),
          y: Number(nodeRow.y),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error in POST /api/brainstorm:", error);
    return NextResponse.json(
      { statusText: "Internal server error while creating brainstorm item" },
      { status: 500 },
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authUser = await getAuthUser(headers);
    if (!authUser) {
      return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const edgeId = Number(body?.id);

    if (body?.kind !== "edge" || !Number.isInteger(edgeId)) {
      return NextResponse.json(
        { statusText: "Valid integer edge id is required" },
        { status: 400 },
      );
    }

    await BrainstormEdgeOJSModel.query().deleteById(edgeId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error in DELETE /api/brainstorm:", error);
    return NextResponse.json(
      { statusText: "Internal server error while deleting brainstorm edge" },
      { status: 500 },
    );
  }
}
