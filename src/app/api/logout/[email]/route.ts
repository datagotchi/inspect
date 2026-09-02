import { NextRequest, NextResponse } from "next/server";

import { UserLibSqlModel } from "../../models/users";

export interface DeleteSessionRouteProps {
  params: Promise<{ email: string }>;
}

export async function DELETE(req: NextRequest, props: DeleteSessionRouteProps) {
  try {
    const params = await props.params;
    const email = decodeURIComponent(params.email);
    const authHeader = req.headers.get("authorization");
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      await UserLibSqlModel.query()
        .delete()
        .where("email", email)
        .where("token", token);

      return NextResponse.json({
        statusText: "Successfully logged out",
        status: 204,
      });
    }

    return NextResponse.json({
      statusText: "Unauthorized",
      status: 401,
    });
  } catch (err) {
    console.error("Error in DELETE /api/logout:", err);
    return NextResponse.json(
      { statusText: "Internal server error while logging out" },
      { status: 500 },
    );
  }
}
