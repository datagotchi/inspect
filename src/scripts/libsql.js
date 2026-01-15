import { createClient } from "@libsql/client";
import readline from "node:readline";

const db = createClient({ url: "file:fieldnotes.db" });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "fieldnotes> ",
});

console.log("Fieldnotes LibSQL Shell (Type 'exit' to quit)");
rl.prompt();

rl.on("line", async (line) => {
  let query = line.trim();
  if (query.toLowerCase() === "exit") process.exit(0);
  if (!query) {
    rl.prompt();
    return;
  }

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
    } else {
      console.log(`Success. Rows affected: ${result.rowsAffected}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
  rl.prompt();
});
