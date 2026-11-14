/**
 * @jest-environment node
 */

import { NextRequest } from "next/server";

import { FieldModel } from "@/app/api/models/fieldnotes";
import { DELETE } from "./route";

jest.mock("@/app/api/models/fieldnotes", () => {
  const mockQueryBuilder = {
    select: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
  };

  const MockFieldModelConstructor = jest.fn();
  Object.assign(MockFieldModelConstructor, {
    query: jest.fn(() => mockQueryBuilder),
  });

  return {
    FieldModel: MockFieldModelConstructor,
  };
});

describe("DELETE /:id", () => {
  it("should delete a field and return 204", async () => {
    (FieldModel.query().andWhere as jest.Mock).mockResolvedValue(1);
    const req = {
      nextUrl: {
        searchParams: new URLSearchParams({ id: "1" }),
      },
    } as unknown as NextRequest;

    const res = await DELETE(req, { params: Promise.resolve({ id: "2" }) });

    expect(FieldModel.query().delete).toHaveBeenCalled();
    expect(FieldModel.query().where).toHaveBeenCalledWith("id", 2);
    expect(FieldModel.query().andWhere).toHaveBeenCalledWith("user_id", 1);
    expect(res.status).toBe(204);
  });
});
