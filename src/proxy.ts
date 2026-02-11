import { NextRequest, NextResponse } from "next/server";

import { cookies, headers } from "next/headers";

// FIXME: seems like the route files should have an auth(enticateUser) option or something like express
export const ANONYMOUS_REGEXES = [
  "^/_next",
  "^/images",
  "/bootstrap",
  "^/$",
  "^/favicon.ico$",
  "^/links/.*",
  "^/insights",
  "^/login",
  "^/register",
  "^/confirm",
  "^/api/links",
  "^/api/insights",
  "^/api/register",
  "^/api/login",
  "^/api/users/[0-9]+$",
  "^/api/articles",
];

export const proxy = async (req: NextRequest): Promise<NextResponse> => {
  const cookiesCollection = await cookies();
  const tokenCookie = cookiesCollection.has("token")
    ? cookiesCollection.get("token")?.value
    : "";
  const headersObject = await headers();
  const token = headersObject.get("x-access-token") || tokenCookie;
  let authUser;
  // TODO: figure out why x-access-token is sometimes the 'undefined' string
  if (token && token !== "undefined") {
    authUser = decryptToken(token); // FIXME: refactor how I do auth
  }
  const anonymousPathMatch = ANONYMOUS_REGEXES.find((regex) =>
    req.nextUrl.pathname.match(new RegExp(regex)),
  );
  if (!anonymousPathMatch && !token) {
    return NextResponse.json(
      {
        statusText: "A token is required for authentication",
      },
      { status: 403 },
    );
  }

  let origin = req.nextUrl.origin;
  let url = req.nextUrl.href;

  // FIXME: get the "Real" host and protocol from Nginx headers
  /* FIXME: meaning update the nginx config with: 
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host; # This is the magic line
        proxy_set_header X-Forwarded-Proto $scheme; # This tells it "https"
    }
  */
  // const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  // const protocol = req.headers.get("x-forwarded-proto") || "http";

  // const origin = `${protocol}://${host}`;
  // const url = `${origin}${req.nextUrl.pathname}${req.nextUrl.search}`;
  if (process.env.NODE_ENV === "production") {
    origin = origin.replace(
      /http:\/\/localhost:3000/,
      "https://inspect.datagotchi.net",
    );
    url = url.replace(
      /http:\/\/localhost:3000/,
      "https://inspect.datagotchi.net",
    );
  }

  const res = NextResponse.next();
  res.headers.set("x-origin", origin);
  res.headers.set("x-url", url);

  if (authUser) {
    res.headers.set("x-authUser", JSON.stringify(authUser));
  } else if (token && token !== "undefined") {
    // Clear invalid token from cookies
    res.cookies.set("token", "", {
      expires: new Date(0),
      path: "/",
    });
  }

  // FIXME: include rr_token for api routes: rrToken: sessionAndUser.rr_token,

  return res;
};
