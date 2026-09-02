/**
 * @jest-environment node
 */

import { createSession, verifyTokenAndGetUser } from "./functions";
import { SessionModel } from "../app/api/models/sessions";
import { User } from "../app/types";

// Mock the SessionModel to isolate the functions from the database
jest.mock("../app/api/models/sessions", () => {
  const mockQueryBuilder = {
    insert: jest.fn().mockReturnThis(),
    insertGraph: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn(), // This will be the final call in the chain for verify
  };

  const MockSessionModelConstructor = jest.fn();
  Object.assign(MockSessionModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
    knex: jest.fn(),
  });

  return {
    SessionModel: MockSessionModelConstructor,
  };
});

const mockSessionQuery = SessionModel.query as jest.Mock;

describe("proxy/functions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createSession", () => {
    it("should generate a token and insert a session into the database", async () => {
      const user: User = { id: 1, email: "test@example.com", username: "test" };
      const token = await createSession(user);

      // Check that a token was generated
      expect(typeof token).toBe("string");
      expect(token.length).toBe(96); // 48 bytes in hex

      // Check that the session was inserted
      const insertMock = mockSessionQuery().insert;
      expect(insertMock).toHaveBeenCalledTimes(1);
      expect(insertMock).toHaveBeenCalledWith(
        expect.objectContaining({
          user_id: user.id,
          token,
          expires: expect.any(String),
        }),
      );
    });
  });

  describe("verifyTokenAndGetUser", () => {
    it("should return the user for a valid token", async () => {
      const user: User = { id: 1, email: "test@example.com", username: "test" };
      const mockSession = { user };
      (mockSessionQuery().withGraphFetched as jest.Mock).mockResolvedValue(
        mockSession,
      );

      const result = await verifyTokenAndGetUser("valid-token");

      expect(result).toEqual(user);
      expect(mockSessionQuery().findOne).toHaveBeenCalledWith({
        token: "valid-token",
      });
    });

    it("should return null for an invalid or expired token", async () => {
      (mockSessionQuery().withGraphFetched as jest.Mock).mockResolvedValue(
        undefined,
      );

      const result = await verifyTokenAndGetUser("invalid-token");

      expect(result).toBeNull();
    });
  });
});
