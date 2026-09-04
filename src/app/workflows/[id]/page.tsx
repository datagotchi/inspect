import { headers } from "next/headers";
import React from "react";

import { getWorkflow } from "../functions";
import ClientSidePage from "./ClientSidePage";
import { getAuthUser } from "@/app/functions";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

const WorkflowPage = async ({
  params,
}: PageProps): Promise<React.JSX.Element> => {
  const { id } = await params;
  const workflowId = parseInt(id, 10);

  const authUser = await getAuthUser(headers);

  if (!authUser?.id) {
    return (
      <span>
        No workflows available for anonymous users. Please Login or Register.
      </span>
    );
  }

  const workflow = await getWorkflow(workflowId, authUser.id);

  if (!workflow) {
    return <span>Workflow not found.</span>;
  }

  return <ClientSidePage workflow={workflow} />;
};

export default WorkflowPage;
