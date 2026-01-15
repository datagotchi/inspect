/**
 * @jest-environment node
 */

import request from "supertest";
import express from "express";
import router from "./field_values.js";

jest.mock("../middleware/auth.js", () => (req, res, next) => next());

describe("field_values routes", () => {
  let app, pool;

  beforeEach(() => {
    pool = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
    };
    app = express();
    app.use(express.json());
    app.use((req, res, next) => {
      req.pool = pool;
      next();
    });
    app.use("/", router);
    app.use((err, req, res) => {
      res.status(500).json({ error: err.message });
    });
  });

  describe("POST /", () => {
    // TODO: figure out how to test auth middleware
    it("should insert a field value and return 201", async () => {
      const fakeRow = { note_id: 1, field_id: 2, value: "foo" };
      pool.query.mockResolvedValueOnce({ rows: [fakeRow] });

      const res = await request(app)
        .post("/")
        .send({ note_id: 1, field_id: 2, value: "foo" });

      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining("insert into field_values"),
        values: [1, 2, "foo"],
      });
      expect(res.status).toBe(201);
      expect(res.body).toEqual(fakeRow);
    });

    it("should handle errors", async () => {
      pool.query.mockRejectedValue(new Error("fail"));
      const res = await request(app)
        .post("/")
        .send({ note_id: 1, field_id: 2, value: "foo" });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("fail");
    });
  });

  describe("PATCH /:note_id/:field_id", () => {
    // TODO: figure out how to test auth middleware
    it("should update a field value and return it", async () => {
      const fakeRow = { note_id: "1", field_id: "2", value: "bar" };
      pool.query.mockResolvedValueOnce({ rows: [fakeRow] });

      const res = await request(app).patch("/1/2").send({ value: "bar" });

      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining("update field_values"),
        values: ["bar", "1", "2"],
      });
      expect(res.status).toBe(200);
      expect(res.body).toEqual(fakeRow);
    });

    it("should handle errors", async () => {
      pool.query.mockRejectedValue(new Error("fail"));
      const res = await request(app).patch("/1/2").send({ value: "bar" });
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("fail");
    });
  });

  describe("DELETE /:note_id/:field_id", () => {
    it("should delete a field value and return 204", async () => {
      pool.query.mockResolvedValueOnce({});
      const res = await request(app).delete("/1/2");
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining("delete from field_values"),
        values: ["1", "2"],
      });
      expect(res.status).toBe(204);
    });

    it("should handle errors", async () => {
      pool.query.mockRejectedValue(new Error("fail"));
      const res = await request(app).delete("/1/2");
      expect(res.status).toBe(500);
      expect(res.body.error).toBe("fail");
    });
  });
});
