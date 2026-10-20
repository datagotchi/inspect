import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

import { getAuthUser } from "@/app/functions";
import { WorkflowNodeOJSModel } from "@/app/api/models/workflows";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const workflowId = parseInt(id, 10);

    if (isNaN(workflowId)) {
      return NextResponse.json(
        { error: "Invalid workflow ID" },
        { status: 400 },
      );
    }

    const authUser = await getAuthUser(headers);
    if (!authUser?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { label, type } = body;

    // 1. Circuit-breaker variable: Explicit type annotation prevents
    //    TS parser recursion during ESLint project checks
    const insertData: Partial<WorkflowNodeOJSModel> = {
      workflow_id: workflowId,
      label: label || "New Node",
      type: type || "default",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 2. Perform insertion using intermediate object
    const newNode =
      await WorkflowNodeOJSModel.query().insertAndFetch(insertData);

    // 3. Break model-to-JSON serialization type tree for NextResponse
    const payload = JSON.parse(JSON.stringify(newNode)) as Record<
      string,
      unknown
    >;

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    console.error("Error creating workflow node:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
