import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import "@/app/api/postgres";
import { WorkflowOJSModel } from "@/app/api/models/workflows";
import { getAuthUser } from "@/app/functions";
import { getWorkflow } from "@/app/workflows/functions";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const workflowId = Number((await params).id);
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

    const workflow = await WorkflowOJSModel.query()
      .delete()
      .where("id", workflowId)
      .where("user_id", authUser.id!)
      .returning("*")
      .first();

    if (workflow) {
      return NextResponse.json({ statusText: "success" });
    }

    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authUser = await getAuthUser(headers);
  if (!authUser) {
    return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
  }

  const workflowId = Number((await params).id);
  if (Number.isNaN(workflowId)) {
    return NextResponse.json({ error: "Invalid workflow ID" }, { status: 400 });
  }

  const body = await req.json();
  const nextName = (body.name ?? body.title ?? "").trim();
  if (!nextName) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const patchPayload = { name: nextName };

  const updated = await WorkflowOJSModel.query()
    .patch(patchPayload)
    .where("id", workflowId)
    .where("user_id", authUser.id!)
    .returning("*")
    .first();

  if (!updated) {
    return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}
