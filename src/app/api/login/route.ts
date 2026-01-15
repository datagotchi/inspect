import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import "../postgres";
import { getEncryptedToken } from "../../../middleware/functions";
import { User } from "../../types";
import { UserModel } from "../models/users";

export type PostLoginSessionRequestBody = Promise<{
  email: string;
  password: string;
}>;

interface PostLoginSessionRequest extends NextRequest {
  json: () => PostLoginSessionRequestBody;
}

export type PostLoginSessionResponse = NextResponse<User | { message: string }>;

export async function POST(
  req: PostLoginSessionRequest,
): Promise<PostLoginSessionResponse> {
  const { email, password } = await req.json();

  if (!(email && password)) {
    return NextResponse.json(
      {
        message: "All input is required",
      },
      { status: 400 },
    );
  }

  // TODO: track sessions (token) in the db someday?

  const resultRows = await UserModel.query().where(
    "email",
    email.toLocaleLowerCase().trim(),
  );
  if (!resultRows || resultRows.length == 0) {
    return NextResponse.json(
      {
        message: "User does not Exist. Please register",
      },
      { status: 404 },
    );
  }
  const user = resultRows[0];

  if (user && (await bcrypt.compare(password.trim(), user.password!))) {
    const token = getEncryptedToken(user);
    user.token = token;

    return NextResponse.json({
      ...user,
    });
  }
  return NextResponse.json(
    {
      message: "Invalid Credentials",
    },
    { status: 401 },
  );
}

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!(email && password)) {
      res
        .status(400)
        .json({ error: "Invalid request: email and password are required." });
    }

    const user = await req.pool
      .query({
        text: "select * from users where email = $1::text",
        values: [email],
      })
      .then((result) => result.rows[0]);

    if (user) {
      if (await bcrypt.compare(password.trim(), user.password)) {
        // After verifying credentials, create their session
        const token = await createSessionAndLoginToRedRover(
          req.pool,
          email,
          password,
        );
        user.token = token;
        // omit sending password
        return res.status(200).json({
          email: user.email,
          token: user.token,
        });
      }
      return res.status(401).json({ error: "Invalid credentials." });
    }
    return res.status(404).json({ error: "Email adadress not found." }); // TODO: combine this with other error(s) for more security
  } catch (err) {
    next(err);
  }
});
