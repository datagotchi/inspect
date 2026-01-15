import { createClient, Client } from "@libsql/client";

declare global {
  var libSql: Client;
}

let libSqlInstance: Client;

if (!global.libSql || process.env.NODE_ENV === "development") {
  libSqlInstance = createClient({
    url: "file:fieldnotes.db", // TODO: make this dynamic once there are more syndicates
  });
  global.libSql = libSqlInstance;
} else {
  libSqlInstance = global.libSql;
}

export default libSqlInstance;
