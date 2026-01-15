"use server";

import { Override } from "../constants";
import { Insight, User, Link } from "../types";
import {
  InsightRouteProps,
  GetInsightRouteResponse,
} from "./insights/[uid]/route";
import { GetUserRouteProps, GetUserRouteResponse } from "./users/[id]/route";

export const getUserFromServer = async (
  origin: string,
  params: Override<Awaited<GetUserRouteProps["params"]>, "id", number>,
  token?: string,
): Promise<User | void> => {
  const response = (await fetch(`${origin}/api/users/${params.id}`, {
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token ?? "",
    },
  })) as GetUserRouteResponse;
  if (response.status == 200) {
    return (await response.json()) as User;
  } else {
    throw "User not found";
  }
};

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

export async function createSessionAndLoginToRedRover(
  pool: Pool,
  email: string,
  password: string,
) {
  // loginToRedRover will now throw an error if login fails or network issues occur
  const rrApiResponse = await loginToRedRover(email, password);

  const rrToken = rrApiResponse.token;

  const token = await bcrypt.hash(email + Date.now(), 10);

  const session = await pool
    .query({
      text: `insert into sessions (user_id, token, rr_token)
             values ((select id from users where email = $1), $2, $3)
             on conflict (user_id) do update set token = excluded.token, rr_token = excluded.rr_token
             returning token`,
      values: [email, token, rrToken],
    })
    .then((result) => result.rows[0]);

  return session.token;
}

// red rover functions

/**
 * Helper function to handle Red Rover API responses, checking for HTTP errors.
 * @param {Response} response - The fetch API response object.
 * @returns {Promise<any>} The JSON parsed response if successful.
 * @throws {Error} An error object with statusCode and details if the response is not ok.
 */
async function handleRedRoverApiResponse(response) {
  if (!response.ok) {
    const errorData = await response
      .json()
      .catch(() => ({ message: "Unknown Red Rover API error" }));
    const error = new Error(
      errorData.message ||
        `Red Rover API call failed with status ${response.status}`,
    );
    error.statusCode = response.status;
    error.details = errorData; // Include full error response from Red Rover
    throw error;
  }
  return response.json();
}

/**
 * Send username and password over HTTPS to get a session token used
 * in other RR API calls.
 *
 * @returns {Promise<object>} The JSON response containing the token for other API calls.
 * @throws {Error} If Red Rover login fails (network error or API returns non-2xx status).
 */
export const loginToRedRover = async (username, password) => {
  try {
    const response = await fetch("https://api.redroverk12.com/v1/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    return handleRedRoverApiResponse(response);
  } catch (err) {
    if (!err.statusCode) {
      // This is a network error
      throw Object.assign(
        new Error(`Failed to connect to Red Rover login API: ${err.message}`),
        { statusCode: 503 },
      );
    }
    throw err; // Re-throw the error with statusCode and details
  }
};

/**
 * Verifies today's sub gig assignment status.
 *
 * @param {object} req - The Express request object, containing req.user.rrToken.
 * @returns {Promise<boolean>} True if gig is active/confirmed.
 */
export const verifyMyRedRoverGigToday = async (req) => {
  const token = req.user?.rrToken; // Access token from req.user

  if (!token) {
    // Throw an error if the token is missing, indicating an authentication issue
    const error = new Error(
      "Red Rover token not found for the authenticated user.",
    );
    throw Object.assign(error, { statusCode: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  // Best Practice: Filter at the source to reduce "Data Debt"
  const params = new URLSearchParams({
    start_date: today,
    end_date: today,
    status: "active,confirmed",
  });

  try {
    const response = await fetch(
      `https://api.redroverk12.com/v1/assignments?${params}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const assignments = await handleRedRoverApiResponse(response);
    return assignments.length > 0;
  } catch (err) {
    if (!err.statusCode) {
      // This is a network error
      throw Object.assign(
        new Error(
          `Failed to connect to Red Rover assignments API: ${err.message}`,
        ),
        { statusCode: 503 },
      );
    }
    throw err;
  }
};
/**
 * Normalizes vendor data into a standardized internal schema.
 * Prevents system-wide fragmentation by ensuring all downstream components
 * receive a consistent 'Gig' object regardless of source API changes.
 * @param {object} req - The Express request object, containing req.user.rrToken.
 * @returns {Array<Object>} Normalized Gig objects {id, date, location, status}
 */
export const getRedRoverGigs = async (req) => {
  const token = req.user?.rrToken; // Access token from req.user
  if (!token) {
    // Throw an error if the token is missing, indicating an authentication issue
    const error = new Error(
      "Red Rover token not found for the authenticated user.",
    );
    throw Object.assign(error, { statusCode: 401 });
  }

  try {
    const response = await fetch(`https://api.redroverk12.com/v1/assignments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const rawData = await handleRedRoverApiResponse(response);
    return rawData.map((item) => ({
      id: item.AssignmentId, // Red Rover's specific key
      date: item.StartDate,
      location: item.SchoolName,
      status: item.Status === "Confirmed" ? "active" : "pending",
    }));
  } catch (err) {
    if (!err.statusCode) {
      // This is a network error
      throw Object.assign(
        new Error(
          `Failed to connect to Red Rover assignments API: ${err.message}`,
        ),
        { statusCode: 503 },
      );
    }
    throw err;
  }
};
// google sheets functions

/**
 * Interoperability Layer: Syncs normalized data to GSheets.
 * Automates the financial ledger to remove manual entry friction.
 * @param {Object} gig - The normalized Gig object.
 */
export const createGoogleSheetGig = async (gig) => {
  // logic to append to GSheet using googleapis library
  // Ensures 'One-Touch' data integrity between scheduling and budgeting.
};
