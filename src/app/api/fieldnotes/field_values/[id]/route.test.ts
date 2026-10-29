/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { FieldValueModel } from "@/app/api/models/fieldnotes";
import { DELETE, PATCH } from "./route";
// import { getAuthUser } from "@/app/functions";

jest.mock("next/headers");

jest.mock("@/app/functions", () => ({
  getAuthUser: jest.fn().mockResolvedValue({ id: 2 }),
}));

jest.mock("@/app/api/models/fieldnotes", () => {
  const mockQueryBuilder = {
    insertAndFetch: jest.fn(),
    deleteById: jest.fn().mockReturnThis(),
    patch: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    first: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    withGraphFetched: jest.fn(),
    returning: jest.fn(),
  };

  return {
    FieldValueModel: {
      query: jest.fn(() => mockQueryBuilder),
    },
  };
});

describe("PATCH /", () => {
  it("should update a field value and return it", async () => {
    const fakeRow = { field_id: 1, value: "bar" };

    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ field_id: "2" }),
      },
      json: jest.fn().mockResolvedValue({ value: "bar", field_id: 1 }),
      headers: new Headers(),
    } as unknown as NextRequest;

    (FieldValueModel.query().withGraphFetched as jest.Mock).mockResolvedValue(
      fakeRow,
    );

    const res = await PATCH(req, { params: Promise.resolve({ id: "1" }) });

    expect(FieldValueModel.query().patch).toHaveBeenCalledWith(fakeRow);
    expect(FieldValueModel.query().where).toHaveBeenCalledWith({
      id: 1,
      user_id: 2,
    });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(fakeRow);
  });
});

describe("DELETE /:note_id/:field_id", () => {
  it("should delete a field value and return 204", async () => {
    (FieldValueModel.query().where as jest.Mock).mockResolvedValue(1);

    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ field_id: "2" }),
      },
      headers: new Headers(),
    } as unknown as NextRequest;

    const res = await DELETE(req, { params: Promise.resolve({ id: "1" }) });
    expect(FieldValueModel.query().deleteById).toHaveBeenCalledWith(1);
    expect(res?.status).toBe(204);
  });
});
