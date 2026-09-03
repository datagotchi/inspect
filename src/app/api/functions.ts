import { Insight, User, Link } from "../types";
import {
  InsightRouteProps,
  GetInsightRouteResponse,
} from "./insights/[uid]/route";
import "../api/postgres";
import { UserLibSqlModel } from "../api/models/users";

/**
 * Direct DB fetch for SSR (Replaces HTTP fetch roundtrip)
 */
export const getUserFromServer = async (
  userId: number,
): Promise<User | null> => {
  try {
    const user = await UserLibSqlModel.query().findById(userId);

    if (!user) {
      return null;
    }

    // Clean serialization for Next.js Server-to-Client component props
    return JSON.parse(JSON.stringify(user)) as User;
  } catch (error) {
    console.error(`Error fetching user ${userId} in SSR:`, error);
    return null;
  }
};

// TODO: update to SSR with OJS
export const getInsightFromServer = async (
  origin: string,
  params: Awaited<InsightRouteProps["params"]>,
  token?: string,
): Promise<Insight> => {
  const response = (await fetch(`${origin}/api/insights/${params.uid}`, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token ?? "",
    },
  })) as GetInsightRouteResponse;
  if (response.status == 200) {
    return (await response.json()) as Insight;
  } else {
    throw response;
  }
};

// TODO: update to SSR with OJS
export const getLinkFromServer = async (
  origin: string,
  uid: string,
): Promise<Link | void> => {
  const response = await fetch(`${origin}/api/links/${uid}`);
  if (response.status == 200) {
    return await response.json();
  } else {
    // throw response; // TODO: no idea where this error is wrapped & returned!
    return undefined;
  }
};
