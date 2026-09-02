import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";

import "../postgres";
import { User } from "../../types";
import { getAuthUser } from "../../functions";
import { UserLibSqlModel } from "../models/users";

export type PutUsersRouteRequestBody = Promise<{
  email: string;
  password: string;
  enable_push_notifications: boolean;
  enable_email_notifications: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}>;

interface PutUsersRouteRequest extends NextRequest {
  json: () => PutUsersRouteRequestBody;
}

export type PutUsersRouteResponse = NextResponse<User | { statusText: string }>;

export async function PATCH(
  req: PutUsersRouteRequest,
): Promise<PutUsersRouteResponse> {
  const reqBody = await req.json();
  const authUser = await getAuthUser(headers);
  if (authUser) {
    const user = (await UserLibSqlModel.query().patchAndFetchById(
      authUser.id!,
      {
        email: reqBody.email?.toLocaleLowerCase(),
        password: reqBody.password
          ? await bcrypt.hash(reqBody.password, 10)
          : undefined,
      },
    )) as UserLibSqlModel;
    return NextResponse.json(user);
  }
  return NextResponse.json({ statusText: "Unauthorized" }, { status: 401 });
}
