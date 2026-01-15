import pg from "pg";
const { Client: PGClient } = pg;
import { createClient as createLibSQLClient } from "@libsql/client";

async function migrate() {
  // Config - Adjust connection string if needed
  const pg = new PGClient({
    connectionString: "postgresql://postgres@localhost:5432/fieldnotes",
  });
  const sqlite = createLibSQLClient({ url: "file:fieldnotes.db" });

  await pg.connect();
  console.log("Connected to Postgres. Starting Sovereign Shield migration...");

  // 1. CREATE TABLES (Idempotent)
  const schema = [
    `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password TEXT NOT NULL);`,
    `CREATE TABLE IF NOT EXISTS notes (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, text TEXT NOT NULL, emoji TEXT, datetime TEXT, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`,
    `CREATE TABLE IF NOT EXISTS fields (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE);`,
    `CREATE TABLE IF NOT EXISTS field_values (id INTEGER PRIMARY KEY AUTOINCREMENT, field_id INTEGER, note_id INTEGER, value TEXT, UNIQUE(field_id, note_id), FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE, FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE);`,
    `CREATE TABLE IF NOT EXISTS sessions (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER NOT NULL, token TEXT NOT NULL, UNIQUE(user_id, token), FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE);`,
  ];

  for (const statement of schema) {
    await sqlite.execute(statement);
  }
  console.log("✅ Schema initialized in libSQL.");

  // 2. MIGRATE DATA (Wrapped in a transaction for integrity)
  try {
    // Users
    const users = await pg.query("SELECT * FROM users");
    for (const u of users.rows) {
      await sqlite.execute({
        sql: "INSERT OR IGNORE INTO users (id, email, password) VALUES (?, ?, ?)",
        args: [u.id, u.email, u.password],
      });
    }

    // Notes (Preserve history)
    const notes = await pg.query("SELECT * FROM notes");
    for (const n of notes.rows) {
      const dt = n.datetime
        ? new Date(n.datetime).toISOString()
        : new Date().toISOString();
      await sqlite.execute({
        sql: "INSERT OR IGNORE INTO notes (id, user_id, text, emoji, datetime) VALUES (?, ?, ?, ?, ?)",
        args: [n.id, n.user_id, n.text, n.emoji, dt],
      });
    }

    // Fields
    const fields = await pg.query("SELECT * FROM fields");
    for (const f of fields.rows) {
      await sqlite.execute({
        sql: "INSERT OR IGNORE INTO fields (id, name) VALUES (?, ?)",
        args: [f.id, f.name],
      });
    }

    // Field Values
    const values = await pg.query("SELECT * FROM field_values");
    for (const v of values.rows) {
      await sqlite.execute({
        sql: "INSERT OR IGNORE INTO field_values (id, field_id, note_id, value) VALUES (?, ?, ?, ?)",
        args: [v.id, v.field_id, v.note_id, v.value],
      });
    }

    console.log("🚀 Migration Complete! Your data is now Local-First.");
  } catch (err) {
    console.error("❌ Migration failed mid-stream:", err);
  } finally {
    await pg.end();
  }
}

migrate();
