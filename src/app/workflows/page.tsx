import React from "react";
import { headers } from "next/headers";

import { getAuthUser } from "../functions";
import { getWorkflows } from "./functions";
import ClientSidePage from "./ClientSidePage";
import { getUserFromServer } from "../api/functions";

const WorkflowsPage = async (): Promise<React.JSX.Element> => {
  // 1. Resolve auth user
  const authUser = await getAuthUser(headers);

  if (!authUser?.id) {
    return (
      <span>
        No workflows available for anonymous users. Please Login or Register.
      </span>
    );
  }

  // 2. Fetch full user & user workflows in parallel directly on the server
  const [currentUser, workflows] = await Promise.all([
    getUserFromServer(authUser.id),
    getWorkflows({ userId: authUser.id, offset: 0, limit: 20 }),
  ]);

  return (
    <ClientSidePage workflows={workflows} currentUser={currentUser || null} />
  );
};

export default WorkflowsPage;
