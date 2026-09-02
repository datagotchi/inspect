/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "./route";
import { PATCH, DELETE } from "./[id]/route";
import { FieldValueModel } from "../models/field_values";

jest.mock("../models/field_values", () => {
  const mockQueryBuilder = {
    insertAndFetch: jest.fn(),
    patch: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    returning: jest.fn(),
    delete: jest.fn(),
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

  describe("PATCH /", () => {
    it("should update a field value and return it", async () => {
      const fakeRow = { note_id: "1", field_id: "2", value: "bar" };
      (FieldValueModel.query().returning as jest.Mock).mockResolvedValue([
        fakeRow,
      ]);

      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({ field_id: "2" }),
        },
        json: jest.fn().mockResolvedValue({ value: "bar" }),
      } as unknown as NextRequest;

      const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

      expect(FieldValueModel.query().patch).toHaveBeenCalledWith({
        value: "bar",
      });
      expect(FieldValueModel.query().where).toHaveBeenCalledWith({
        note_id: "1",
        field_id: "2",
      });
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual([fakeRow]);
    });
  });

  describe("DELETE /:note_id/:field_id", () => {
    it("should delete a field value and return 204", async () => {
      (FieldValueModel.query().delete as jest.Mock).mockResolvedValue(1);

      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({ field_id: "2" }),
        },
      } as unknown as NextRequest;

      const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
      expect(FieldValueModel.query().where).toHaveBeenCalledWith({
        note_id: "1",
      });
      expect(res?.status).toBe(204);
    });
  });
});
