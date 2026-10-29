import "@/app/api/postgres";
import { UserLibSqlModel } from "@/app/api/models/users";

import { Insight, User, Link } from "./types";
import { InsightRouteProps } from "./api/insights/[uid]/route";
import { InsightModel } from "./api/models/insights";
import { SummaryModel } from "./api/models/summaries";

export const getUserFromServer = async (
  userId: number,
): Promise<User | null> => {
  try {
    const user = await UserLibSqlModel.query().findById(userId);

    if (!user) {
      return null;
    }

    return JSON.parse(JSON.stringify(user)) as User;
  } catch (error) {
    console.error(`Error fetching user ${userId} in SSR:`, error);
    return null;
  }
};

export const getInsightFromServer = async (
  params: Awaited<InsightRouteProps["params"]>,
): Promise<Insight | null> => {
  try {
    const insight = await InsightModel.query().where("uid", params.uid!);

    if (!insight) {
      return null;
    }

    return JSON.parse(JSON.stringify(insight)) as Insight;
  } catch (error) {
    console.error(`Error fetching insight ${params.uid} in SSR:`, error);
    return null;
  }
};

export const getLinkFromServer = async (uid: string): Promise<Link | null> => {
  try {
    const summary = (await SummaryModel.query().findOne(
      "summaries.uid",
      uid,
    )) as Link;

    if (!summary) {
      return null;
    }

    return summary;
  } catch (error) {
    console.error(`Error fetching link/summary ${uid} in SSR:`, error);
    return null;
  }
};
