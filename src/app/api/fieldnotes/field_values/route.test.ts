/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "./route";
import { FieldValueModel } from "@/app/api/models/fieldnotes";
import { getAuthUser } from "../../../functions";

jest.mock("../../../functions", () => ({
  getAuthUser: jest.fn(),
}));

jest.mock("@/app/api/models/fieldnotes", () => {
  const mockQueryBuilder = {
    insertAndFetch: jest.fn(),
    deleteById: jest.fn(),
    patch: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    returning: jest.fn(),
  };

  return {
    FieldValueModel: {
      query: jest.fn(() => mockQueryBuilder),
    },
  };
});

describe("field_values routes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthUser as jest.Mock).mockResolvedValue({ id: 1 });
  });

  describe("POST /", () => {
    it("should insert a field value and return 201", async () => {
      const fakeRow = { note_id: 1, field_id: 2, value: "foo" };
      (FieldValueModel.query().insertAndFetch as jest.Mock).mockResolvedValue(
        fakeRow,
      );

      const req = {
        json: jest.fn().mockResolvedValue(fakeRow),
      } as unknown as NextRequest;

      const res = await POST(req);

      expect(FieldValueModel.query().insertAndFetch).toHaveBeenCalledWith(
        fakeRow,
      );
      expect(res?.status).toBe(201);
      const json = await res!.json();
      expect(json).toEqual(fakeRow);
    });

    it("should return 400 if required fields are missing", async () => {
      const req = {
        json: jest.fn().mockResolvedValue({ note_id: 1 }),
      } as unknown as NextRequest;

      const res = await POST(req);
      expect(res?.status).toBe(400);
    });
  });
});
