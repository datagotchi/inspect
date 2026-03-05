import readline from "node:readline";
import { createClient } from "@libsql/client";

const db = createClient({ url: "file:fieldnotes.db" });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "sqlite> ",
});

console.log("SQLite Shell (Type 'exit' to quit)");
rl.prompt();

rl.on("line", async (line) => {
  let query = line.trim();
  if (query.toLowerCase() === "exit") process.exit(0);
  if (!query) {
    rl.prompt();
    return;
  }

  // psql-like commands
  if (query === "\\dt") {
    query =
      "SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'";
  } else if (query.startsWith("\\d ")) {
    const tableName = query.split(" ")[1];
    query = `PRAGMA table_info('${tableName}')`;
  } else if (query.startsWith("\\sql ")) {
    const tableName = query.split(" ")[1];
    query = `SELECT sql FROM sqlite_schema WHERE name='${tableName}'`;
  }

  try {
    const result = await db.execute(query);

    if (result.rows.length > 0) {
      console.table(result.rows);
    } else if (result.rowsAffected > 0) {
      console.log(`Success. Rows affected: ${result.rowsAffected}`);
    } else {
      console.log("Query executed successfully.");
    }
  } catch (err: any) {
    console.error(`Error: ${err.message}`);
  }
  rl.prompt();
});
