/**
 * @jest-environment node
 */

import { FieldModel } from "../models/Fields";
import { GET, POST } from "./route";
import { DELETE } from "./[id]/route";
import { getAuthUser } from "../../../functions";
import { NextRequest } from "next/server";

jest.mock("../models/fields", () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhereNull: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  const MockFieldModelConstructor = jest.fn();
  Object.assign(MockFieldModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    FieldModel: MockFieldModelConstructor,
  };
});

const mockFields = [
  { id: 1, name: "Field1" },
  { id: 2, name: "Field2" },
];

describe("fieldnotes/fields routes", () => {
  describe("GET /", () => {
    beforeEach(() => {
      jest.clearAllMocks();
      (FieldModel.query().where as jest.Mock).mockReturnThis();
      (FieldModel.query().withGraphJoined as jest.Mock).mockReturnThis();
      (FieldModel.query().orderBy as jest.Mock).mockReturnThis();
      (FieldModel.query().page as jest.Mock).mockReturnThis();
      (FieldModel.query().insert as jest.Mock).mockReturnThis();
      (FieldModel.query().withGraphFetched as jest.Mock).mockReturnThis();
      (FieldModel.query().then as jest.Mock).mockImplementation((callback) =>
        Promise.resolve(
          callback({
            results: mockFields,
          }),
        ),
      );
      const mockAuthUser = { user_id: 1, name: "Test User" };
      (getAuthUser as jest.Mock).mockResolvedValue(mockAuthUser);
    });

    it("should return 200 with a list of fifelds", async () => {
      const req = {
        nextUrl: {
          searchParams: new URLSearchParams({ offset: "0", limit: "2" }),
        },
      } as NextRequest;

      const res = await GET(req);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toEqual(mockFields);
    });
  });

  describe("POST /", () => {
    it("should return 400 when name is missing", async () => {
      const req = {
        json: jest.fn().mockResolvedValue({}),
      } as unknown as NextRequest;

      const res = await POST(req);
      expect(res.status).toBe(400);
      expect(res.statusText).toEqual({ statusText: "Name is required" });
    });

    it("should return 201 and create field with valid authentication and name", async () => {
      const localMockField = {
        name: "New Field",
      };

      (FieldModel.query().then as jest.Mock).mockImplementationOnce(
        (callback) =>
          Promise.resolve(
            callback({
              ...localMockField,
              id: 1,
            }),
          ),
      );
      const req = {
        json: jest.fn().mockResolvedValue({
          name: "New Field",
        }),
      } as unknown as NextRequest;

      const res = await POST(req);

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json).toEqual({
        ...localMockField,
        id: 1,
      });
    });
  });

  describe("DELETE /:id", () => {
    it("should delete a field and return 204", async () => {
      const req = {
        params: { id: "1" },
      } as unknown as NextRequest;

      const res = await DELETE(req);

      expect(FieldModel.query).toHaveBeenCalledWith({
        text: expect.stringContaining("delete from fields"),
        values: ["1", 1],
      });
      expect(res.status).toBe(204);
    });
  });
});
