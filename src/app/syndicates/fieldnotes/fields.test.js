/**
 * @jest-environment node
 */

import request from "supertest";
import express from "express";
import router from "./fields.js";

const mockAuthenticateUser = jest.fn((req, res, next) => {
  req.user = { id: 1 }; // Mock authenticated user
  next();
});
jest.mock("../middleware/auth.js", () => {
  return { __esModule: true, default: mockAuthenticateUser };
});

describe("fields routes", () => {
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

  describe("GET /", () => {
    it("should return 401 without authentication", async () => {
      mockAuthenticateUser.mockImplementationOnce((req, res) => {
        res.status(401).json({ error: "No Authentication or email header" });
      });
      const res = await request(app).get("/");
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "No Authentication or email header" });
    });

    it("should return 200 with valid authentication", async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });
      const res = await request(app)
        .get("/")
        .set("Authorization", "Bearer test-token")
        .set("x-email", "bob@datagotchi.net");
      expect(res.status).toBe(200);
      expect(res.body).toEqual([]);
    });
  });

  describe("POST /", () => {
    it("should return 401 without authentication", async () => {
      // FIXME: this is just testing the mock
      mockAuthenticateUser.mockImplementationOnce((req, res) => {
        res.status(401).json({ error: "No Authentication or email header" });
      });
      const res = await request(app).post("/").send({ name: "Test Field" });
      expect(res.status).toBe(401);
      expect(res.body).toEqual({ error: "No Authentication or email header" });
    });

    it("should return 400 when name is missing", async () => {
      const res = await request(app)
        .post("/")
        .set("Content-Type", "application/json")
        .set("Authorization", "Bearer test-token")
        .set("x-email", "bob@datagotchi.net");
      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: "Name is required" });
    });

    it("should return 201 and create field with valid authentication and name", async () => {
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, name: "Test Field", user_id: 1 }],
      });
      const res = await request(app)
        .post("/")
        .set("Content-Type", "application/json")
        .set("Authorization", "Bearer test-token")
        .set("x-email", "bob@datagotchi.net")
        .send({ name: "Test Field" });
      expect(res.status).toBe(201);
      expect(res.body).toEqual({
        id: expect.any(Number),
        name: "Test Field",
        user_id: expect.any(Number),
      });
    });
  });

  describe("DELETE /:id", () => {
    it("should delete a field and return 204", async () => {
      pool.query.mockResolvedValueOnce({});
      const res = await request(app)
        .delete("/1")
        .set("Authorization", "Bearer test-token")
        .set("x-email", "bob@datagotchi.net");
      expect(pool.query).toHaveBeenCalledWith({
        text: expect.stringContaining("delete from fields"),
        values: ["1", 1],
      });
      expect(res.status).toBe(204);
    });
  });
});
