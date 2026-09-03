import { headers } from "next/headers";
import React from "react";

import { getWorkflow } from "../functions";
import ClientSidePage from "./ClientSidePage";
import { getAuthUser } from "@/app/functions"; // or verifyAuthToken directly

interface PageProps {
  params: Promise<{
    id: string; // ✅ Fixed: Next.js params are always strings
  }>;
}

const WorkflowPage = async ({
  params,
}: PageProps): Promise<React.JSX.Element> => {
  const { id } = await params;
  const workflowId = parseInt(id, 10);

  const authUser = await getAuthUser(headers); // Adjust according to how getAuthUser works

  if (!authUser?.id) {
    return (
      <span>
        No workflows available for anonymous users. Please Login or Register.
      </span>
    );
  }

  // ✅ Fixed: pass (workflowId, userId) directly to DB function
  const workflow = await getWorkflow(workflowId, authUser.id);

  if (!workflow) {
    return <span>Workflow not found.</span>;
  }

  return (
    <ClientSidePage nodes={workflow.nodes || []} workflowId={workflow.id} />
  );
};

export default WorkflowPage;
