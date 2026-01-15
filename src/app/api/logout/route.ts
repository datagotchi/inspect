router.delete("/logout/:email", authenticateUser, async (req, res, next) => {
  try {
    const email = decodeURIComponent(req.params.email);
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    await req.pool.query({
      text: "delete from sessions where user_id = (select id from users where email = $1::text) and token = $2::text",
      values: [email, token],
    });
    return res.sendStatus(204);
  } catch (err) {
    next(err);
  }
});
