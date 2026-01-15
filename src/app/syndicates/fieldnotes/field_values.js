import { Router } from "express";
const router = Router();

import authenticateuser from "../../../../fieldnotes-tmp/middleware/auth.js";

router.post("/", authenticateuser, async (req, res, next) => {
  try {
    const { note_id, field_id, value } = req.body;
    const result = await req.pool.query({
      text: `insert into field_values (note_id, field_id, value) 
             values ($1, $2, $3)
             returning *`,
      values: [note_id, field_id, value],
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

router.patch(
  "/:note_id/:field_id",
  authenticateuser,
  async (req, res, next) => {
    try {
      const { note_id, field_id } = req.params;
      const { value } = req.body;
      const result = await req.pool.query({
        text: `update field_values set value = $1 
             where note_id = $2 and field_id = $3 
             returning *`,
        values: [value, note_id, field_id],
      });
      return res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  },
);

router.delete(
  "/:note_id/:field_id",
  authenticateuser,
  async (req, res, next) => {
    try {
      const { note_id, field_id } = req.params;
      await req.pool.query({
        text: "delete from field_values where note_id = $1 and field_id = $2",
        values: [note_id, field_id],
      });
      res.sendStatus(204);
    } catch (err) {
      console.error(err);
      next(err);
    }
  },
);

export default router;
