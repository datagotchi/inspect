/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from "next/server";

import { DELETE, DeleteSessionRouteProps } from "./route";
import { UserModel } from "../../models/users";

// Mock the UserModel from the database layer
jest.mock("../../models/users");

describe("DELETE /api/logout", () => {
  const mockQueryBuilder = {
    where: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };
  // FIXME: figure out how to define bound functions in jest + ts + eslint
  const mockReturnThisOnce = function () {
    return this;
  };

  beforeEach(() => {
    // Reset mocks before each test to ensure isolation
    jest.clearAllMocks();

    // Set up the mock implementation for the UserModel query.
    // This ensures that for every test, UserModel.query() returns
    // a mock query builder that can be chained.
    (UserModel.query as jest.Mock).mockReturnValue(mockQueryBuilder);
    // Mock the final step of the chain to resolve the promise
    // (mockQueryBuilder.where as jest.Mock).mockResolvedValueOnce(1);
  });

  it("should successfully log out and return 204", async () => {
    (mockQueryBuilder.where as jest.Mock)
      .mockImplementationOnce(mockReturnThisOnce)
      .mockResolvedValueOnce(1);
    const email = "test@example.com";
    const token = "valid-token-123";

    const req = new NextRequest("http://localhost/api/logout", {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    const props: DeleteSessionRouteProps = {
      params: Promise.resolve({ email: encodeURIComponent(email) }),
    };

    const response = await DELETE(req, props);

    // Verify that the database query was constructed and called correctly
    expect(UserModel.query).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.delete).toHaveBeenCalledTimes(1);
    expect(mockQueryBuilder.where).toHaveBeenNthCalledWith(1, "email", email);
    expect(mockQueryBuilder.where).toHaveBeenNthCalledWith(2, "token", token);

    // Verify the response
    expect(response).toEqual(
      NextResponse.json({
        statusText: "Successfully logged out",
        status: 204,
      }),
    );
  });

  it("should return 401 Unauthorized if no token is provided", async () => {
    const email = "test@example.com";

    const req = new NextRequest("http://localhost/api/logout", {
      headers: {}, // No authorization header
    });

    const props: DeleteSessionRouteProps = {
      params: Promise.resolve({ email: encodeURIComponent(email) }),
    };

    const response = await DELETE(req, props);

    // Ensure no database call was made
    expect(UserModel.query).not.toHaveBeenCalled();

    // Verify the response
    expect(response).toEqual(
      NextResponse.json({
        statusText: "Unauthorized",
        status: 401,
      }),
    );
  });

  it("should return 500 if the database query fails", async () => {
    const email = "test@example.com";
    const token = "valid-token-123";
    const dbError = new Error("DB connection failed");

    // Simulate a database error
    (InsightLinkModel.query().then as jest.Mock).mockReset();
    (InsightLinkModel.query().then as jest.Mock).mockImplementationOnce(() => {
      throw new Error("DB error");
    });
    (mockQueryBuilder.where as jest.Mock).mockRejectedValue(dbError);

    const req = new NextRequest("http://localhost/api/logout", {
      headers: { authorization: `Bearer ${token}` },
    });

    const props: DeleteSessionRouteProps = {
      params: Promise.resolve({ email: encodeURIComponent(email) }),
    };

    const response = await DELETE(req, props);

    expect(response).toEqual(
      NextResponse.json(
        { statusText: "Internal server error while logging out" },
        { status: 500 },
      ),
    );
  });
});
