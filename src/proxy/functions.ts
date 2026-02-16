import { User } from "../app/types";
import { SessionModel } from "../app/api/models/sessions";

/**
 * Creates a new session for a user and returns the session token.
 *
 * @param user The user object for whom to create the session.
 * @returns The generated session token.
 */
export const createSession = async (user: User): Promise<string> => {
  // 1. Generate a secure, random token using the Web Crypto API,
  // which is available in Node.js, browsers, and Edge environments.
  const randomBytes = new Uint8Array(48);
  crypto.getRandomValues(randomBytes);
  const sessionToken = Buffer.from(randomBytes).toString("hex");

  // 2. Set an expiration date (e.g., 30 days from now).
  const expires = new Date();
  expires.setDate(expires.getDate() + 30);

  // 3. Insert the new session into the database.
  await SessionModel.query().insertGraph({
    userId: user.id,
    sessionToken,
    expires,
  });

  return sessionToken;
};

/**
 * Verifies a session token against the database.
 *
 * @param token The session token from the client's cookies or headers.
 * @returns The associated user object if the session is valid, otherwise null.
 */
export const verifyTokenAndGetUser = async (
  token: string,
): Promise<User | null> => {
  try {
    // 1. Find the session using the Objection.js model and query builder.
    // We'll eagerly load the related user with `withGraphFetched`.
    const session = await SessionModel.query()
      .findOne({ sessionToken: token })
      .where("expires", ">", new Date())
      .withGraphFetched("user");

    // 2. If no session is found, or the session has no associated user,
    // the token is invalid.
    if (!session?.user) {
      return null;
    }

    // 3. If the session is valid, return the user object.
    // Objection.js automatically handles mapping the row to the User model instance,
    // so no manual casting or boolean conversion is needed.
    return session.user;
  } catch (error) {
    console.error("Error verifying token:", error);
    return null;
  }
};
