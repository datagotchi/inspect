/**
 * @jest-environment node
 */

import { InsightModel } from "./api/models/insights";
import { SummaryModel } from "./api/models/summaries";
import {
  getUserFromServer,
  getInsightFromServer,
  getLinkFromServer,
} from "./OJS-SSR-functions";
import { UserLibSqlModel } from "@/app/api/models/users";

describe("Objection.js Server-Side Rendering functions", () => {
  // Reusable query builder spy tree
  const mockQueryBuilder = {
    findById: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    then: jest.fn(),
  };

  it("getUserFromServer should fetch user data from the database directly", async () => {
    const authUser = { id: 1 };
    const mockResponse = { id: 1, name: "John Doe" };

    jest
      .spyOn(UserLibSqlModel, "query")
      .mockReturnValue(mockQueryBuilder as any);
    mockQueryBuilder.then.mockImplementation(function (resolve) {
      return Promise.resolve(mockResponse).then(resolve);
    });

    const result = await getUserFromServer(authUser.id);

    expect(UserLibSqlModel.query).toHaveBeenCalled();
    expect(mockQueryBuilder.findById).toHaveBeenCalledWith(authUser.id);

    expect(result).toEqual(mockResponse);
    jest.clearAllMocks();
  });

  it("getInsightFromServer should fetch insight data from the server", async () => {
    const uid = "insight-uid";
    const mockResponse = { id: 1, title: "Insight Title" };

    jest.spyOn(InsightModel, "query").mockReturnValue(mockQueryBuilder as any);
    mockQueryBuilder.then.mockImplementation(function (resolve) {
      return Promise.resolve(mockResponse).then(resolve);
    });

    const result = await getInsightFromServer({ uid });
    expect(InsightModel.query).toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
    jest.clearAllMocks();
  });

  it("getLinkFromServer should fetch link data from the server", async () => {
    const uid = "link-uid";
    const mockResponse = { id: 1, url: "http://example.com" };

    jest.spyOn(SummaryModel, "query").mockReturnValue(mockQueryBuilder as any);
    mockQueryBuilder.then.mockImplementation(function (resolve) {
      return Promise.resolve(mockResponse).then(resolve);
    });

    const result = await getLinkFromServer(uid);
    expect(SummaryModel.query).toHaveBeenCalled();
    expect(result).toEqual(mockResponse);
    jest.clearAllMocks();
  });
});
