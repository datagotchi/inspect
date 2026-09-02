"use server";

import React from "react";
import { cookies, headers } from "next/headers";

import { getUserFromServer } from "../api/functions";
import { getAuthUser } from "../functions";
import { getWorkflows } from "./functions";
import ClientSidePage from "./ClientSidePage";

const WorkflowsPage = async (): Promise<React.JSX.Element> => {
  const origin = (await headers()).get("x-origin") || "";
  const tokenCookie = (await cookies()).get("token");
  const token = tokenCookie ? tokenCookie.value : undefined;

  const authUser = await getAuthUser(headers);
  const currentUser = authUser
    ? await getUserFromServer(origin, { id: authUser.id! }, token)
    : null;

  const insightSearchParams = new URLSearchParams(
    "offset=0&limit=20&parents=true&children=true&evidence=true",
  );
  insightSearchParams.sort();
  const workflows = await getWorkflows(origin, token, insightSearchParams);

  if (workflows && Array.isArray(workflows)) {
    return (
      <ClientSidePage
        workflows={workflows.filter((w) => w.userId == authUser?.id)}
        currentUser={currentUser || null}
      />
    );
  }
  return (
    <span>
      No insights available for anonymous users. Please Login or Register.
    </span>
  );
};

export default WorkflowsPage;
