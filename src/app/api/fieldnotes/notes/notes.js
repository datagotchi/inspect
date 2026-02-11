import { Router } from "express";
const router = Router();

import authenticateUser from "../../../../fieldnotes-tmp/middleware/auth.js";

router.get("/", authenticateUser, async (req, res, next) => {
  try {
    const notes = await req.pool
      .query({
        text: "select * from notes where user_id = $1::integer",
        values: [req.user.id],
      })
      .then((response) => response.rows);
    await Promise.all(
      notes.map((n) =>
        req.pool
          .query({
            text: "select * from field_values where note_id = $1::integer",
            values: [n.id],
          })
          .then((result) => {
            n.field_values = result.rows;
          }),
      ),
    );
    return res.json(notes);
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticateUser, async (req, res, next) => {
  try {
    const note = req.body;
    const newNote = await req.pool
      .query({
        text: "insert into notes (text, datetime, user_id) values ($1::text, $2::timestamp, $3::integer) returning *",
        values: [note.text, new Date().toISOString(), req.user.id],
      })
      .then((response) => response.rows[0]);
    return res.json(newNote);
  } catch (err) {
    next(err);
  }
});

router.delete("/:note_id", authenticateUser, async (req, res, next) => {
  try {
    await req.pool.query({
      text: "delete from notes where id = $1::integer",
      values: [req.params.note_id],
    });
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});

router.patch("/:note_id", authenticateUser, async (req, res, next) => {
  try {
    if (Object.keys(req.body).length > 0) {
      const changes = req.body;
      const keys = Object.keys(changes || {});

      if (keys.length === 0) {
        return res
          .status(400)
          .json({ message: "No keys in request body to update." });
      }

      // basic column name validation to avoid injection
      const validKeys = keys.filter((k) => /^[a-z][a-z0-9_]*$/i.test(k));
      if (validKeys.length === 0) {
        return res
          .status(400)
          .json({ message: "No VALID keys in request body to update." });
      }

      const updateKeys = keys.filter((k) => k !== "field_values");
      const set = updateKeys.map((k, i) => `"${k}" = $${i + 1}`).join(", ");
      const values = updateKeys.map((k) => changes[k]);
      values.push(Number(req.params.note_id));
      const updatedNote = await req.pool
        .query({
          text: `update notes set ${set} where id = $${values.length} returning *`,
          values,
        })
        .then((result) => result.rows[0]);
      if (!updatedNote) {
        return res.status(404).json({ error: "Note not found" });
      }
      return res.json(updatedNote);
    }
    return res.sendStatus(400);
  } catch (err) {
    next(err);
  }
});

export default router;
