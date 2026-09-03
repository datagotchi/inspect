import "@/app/api/postgres";
// import { Workflow } from "@/app/types";
import { WorkflowOJSModel } from "../../models/workflows";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/app/functions";
import { headers } from "next/headers";

interface Props {
  params: Promise<{ id: number }>;
}

export async function GET(req: NextRequest, { params }: Props) {
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const workflowId = (await params).id;
    if (workflowId) {
      const workflow = await WorkflowOJSModel.query().findOne({
        id: workflowId,
        user_id: authUser.id,
      });

      if (workflow) {
        return NextResponse.json(workflow);
      }

      return NextResponse.json(
        { error: "Workflow not found" },
        { status: 404 },
      );
    }
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
