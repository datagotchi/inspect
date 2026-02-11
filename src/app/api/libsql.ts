import { createClient, Client } from "@libsql/client";

declare global {
  var libSql: Client;
}

let libSqlInstance: Client;

if (!global.libSql || process.env.NODE_ENV === "development") {
  libSqlInstance = createClient({
    url: "file:fieldnotes.db", // FIXME: make this dynamic/shared once there are more syndicates
  });
  global.libSql = libSqlInstance;
} else {
  libSqlInstance = global.libSql;
}

export default libSqlInstance;
