import readline from "node:readline";
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@libsql/client";

const dbfile = process.argv[2];

// 1. Guard against missing CLI argument
if (!dbfile) {
  console.error("\x1b[31mError: No database file specified.\x1b[0m");
  console.error(
    "Usage: yarn sqlite <path-to-db-file> (e.g., yarn sqlite dev.db)",
  );
  process.exit(1);
}

// 2. Guard against non-existent database file
const resolvedPath = path.resolve(dbfile);
if (!fs.existsSync(resolvedPath)) {
  console.error(
    `\x1b[31mError: Database file not found at "${resolvedPath}"\x1b[0m`,
  );
  process.exit(1);
}

const db = createClient({ url: `file:${dbfile}` });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "sqlite> ",
});

console.info(`Connected to [${dbfile}] (Type 'exit' to quit)`);
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
      console.info(`Success. Rows affected: ${result.rowsAffected}`);
    } else {
      console.info("Query executed successfully.");
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  }
  rl.prompt();
});
