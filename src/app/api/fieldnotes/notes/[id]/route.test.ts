/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { NoteModel } from "@/app/api/models/fieldnotes";
import { DELETE, PATCH } from "./route";

jest.mock("@/app/api/models/fieldnotes", () => {
  const mockQueryBuilder = {
    insertAndFetch: jest.fn(),
    patch: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn(),
    first: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    deleteById: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
  };

  return {
    NoteModel: {
      query: jest.fn(() => mockQueryBuilder),
    },
  };
});

jest.mock("../../../../functions", () => ({
  getAuthUser: jest.fn().mockResolvedValue({ id: 2 }),
}));

describe("DELETE /[id]", () => {
  it("should delete a note and return 204", async () => {
    const noteId = "1";
    (NoteModel.query().deleteById as jest.Mock).mockReturnThis();
    (NoteModel.query().where as jest.Mock).mockResolvedValue(1);

    const res = await DELETE({} as NextRequest, {
      params: Promise.resolve({ id: noteId }),
    });

    expect(NoteModel.query().deleteById).toHaveBeenCalledWith(parseInt(noteId));
    expect(NoteModel.query().where).toHaveBeenCalledWith("user_id", 2);
    expect(res.status).toBe(204);
  });
});

describe("PATCH /[id]", () => {
  it("should update a note and return it", async () => {
    const noteId = "1";
    const updates = { text: "Updated text" };
    const updatedNote = { id: 1, ...updates };
    (NoteModel.query().withGraphFetched as jest.Mock).mockResolvedValue(
      updatedNote,
    );

    const req = {
      json: jest.fn().mockResolvedValue(updates),
    } as unknown as NextRequest;

    const res = await PATCH(req, { params: Promise.resolve({ id: noteId }) });

    expect(NoteModel.query().patch).toHaveBeenCalledWith(updates);
    expect(NoteModel.query().where).toHaveBeenCalledWith({
      id: parseInt(noteId, 10),
      user_id: 2,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(updatedNote);
  });

  it("should return 404 if note not found", async () => {
    (NoteModel.query().returning as jest.Mock).mockResolvedValue(undefined);

    const req = {
      json: jest.fn().mockResolvedValue({ text: "update" }),
    } as unknown as NextRequest;

    const res = await PATCH(req, { params: Promise.resolve({ id: "999" }) });
    expect(res.status).toBe(404);
  });
});
