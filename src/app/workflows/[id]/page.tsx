import { cookies, headers } from "next/headers";

import React from "react";

// import { getAuthUser } from "@/app/functions";
import { getWorkflow } from "../functions";
import HybridRadialNetwork from "@/app/components/HybridRadialNetwork";
import ClientSidePage from "./ClientSidePage";

interface PageProps {
  params: Promise<{
    id: number;
  }>;
}

const WorkflowPage = async ({
  params,
}: PageProps): Promise<React.JSX.Element> => {
  const origin = (await headers()).get("x-origin") || "";
  const tokenCookie = (await cookies()).get("token");
  const token = tokenCookie ? tokenCookie.value : undefined;

  // const authUser = await getAuthUser(headers);

  const { id } = await params;
  const workflow = await getWorkflow(origin, token, id);

  if (workflow !== false) {
    return <ClientSidePage workflows={workflow.nodes} />;
  }

  return (
    <span>
      No workflows available for anonymous users. Please Login or Register.
    </span>
  );
};

export default WorkflowPage;
