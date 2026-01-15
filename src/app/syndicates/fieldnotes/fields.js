import { Router } from "express";
const router = Router();

import authenticateUser from "../../../../fieldnotes-tmp/middleware/auth.js";

router.get("/", authenticateUser, async (req, res, next) => {
  try {
    const user_id = req.user.id;
    const fields = await req.pool
      .query(
        `select 
        f.id, 
        f.name, 
        count(fv.id) as use_count
      from fields f
      left join field_values fv on f.id = fv.field_id
      where f.user_id = $1 or f.user_id is null
      group by f.id, f.name
      order by use_count desc, f.name asc`,
        [user_id],
      )
      .then((result) => result.rows);
    return res.json(fields);
  } catch (err) {
    next(err);
  }
});

router.post("/", authenticateUser, async (req, res, next) => {
  try {
    const { name } = req.body;
    if (name) {
      const user_id = req.user.id;
      const newField = await req.pool
        .query({
          text: "insert into fields (name, user_id) values ($1, $2) returning *",
          values: [name, user_id],
        })
        .then((result) => result.rows[0]);

      return res.status(201).json(newField);
    } else {
      return res.status(400).json({ error: "Name is required" });
    }
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", authenticateUser, async (req, res, next) => {
  try {
    const fieldId = req.params.id;
    const user_id = req.user.id;

    await req.pool.query({
      text: "delete from fields where id = $1 and user_id = $2",
      values: [fieldId, user_id],
    });

    return res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
