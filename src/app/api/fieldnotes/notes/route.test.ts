/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { GET, POST } from "./route";
import { NoteModel } from "@/app/api/models/fieldnotes";
import * as AppFunctions from "../../../functions";

jest.mock("@/app/api/models/fieldnotes", () => {
  const mockQueryBuilder = {
    findById: jest.fn().mockReturnThis(),
    insert: jest.fn(),
    patch: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn(),
    first: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  return {
    NoteModel: {
      query: jest.fn(() => mockQueryBuilder),
    },
  };
});

jest.mock("../../../functions", () => ({
  getAuthUser: jest.fn(),
}));

const mockUser = { id: 1, email: "test@example.com", username: "tester" };

describe("notes routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (AppFunctions.getAuthUser as jest.Mock).mockResolvedValue(mockUser);
  });

  describe("GET /", () => {
    it("should fetch notes for the authenticated user", async () => {
      const fakeNotes = [{ id: 1, text: "Test note" }];
      (NoteModel.query().withGraphFetched as jest.Mock).mockResolvedValue(
        fakeNotes,
      );

      const res = await GET();

      expect(NoteModel.query().where).toHaveBeenCalledWith(
        "user_id",
        mockUser.id,
      );
      expect(NoteModel.query().withGraphFetched).toHaveBeenCalledWith(
        "field_values",
      );
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual(fakeNotes);
    });

    it("should return 401 if user is not authenticated", async () => {
      (AppFunctions.getAuthUser as jest.Mock).mockResolvedValue(null);
      const res = await GET();
      expect(res.status).toBe(401);
    });
  });

  describe("POST /", () => {
    it("should create a new note and return 201", async () => {
      const newNoteData = { text: "A new note" };
      const createdNote = { ...newNoteData, id: 2, user_id: mockUser.id };
      (NoteModel.query().insert as jest.Mock).mockResolvedValue(createdNote);
      (NoteModel.query().withGraphFetched as jest.Mock).mockResolvedValue(
        createdNote,
      );

      const req = {
        json: jest.fn().mockResolvedValue(newNoteData),
      } as unknown as NextRequest;

      const res = await POST(req);

      expect(NoteModel.query().insert).toHaveBeenCalledWith(
        expect.objectContaining({
          text: newNoteData.text,
          user_id: mockUser.id,
        }),
      );
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json).toEqual(createdNote);
    });
  });
});
