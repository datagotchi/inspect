import Knex from "knex";
import { Model } from "objection";

declare global {
  var libSqlKnexInstance: Knex.Knex;
}

let libSqlKnexInstance: Knex.Knex;

if (!global.libSqlKnexInstance || process.env.NODE_ENV === "development") {
  libSqlKnexInstance = Knex({
    client: "better-sqlite3",
    connection: "fieldnotes.db", // TODO: make this dynamic for multiple syndicates
    useNullAsDefault: true,
  });

  Model.knex(libSqlKnexInstance);

  global.libSqlKnexInstance = libSqlKnexInstance;
} else {
  libSqlKnexInstance = global.libSqlKnexInstance;
}

export default libSqlKnexInstance;
