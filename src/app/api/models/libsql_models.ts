import { Model, snakeCaseMappers } from "objection";
import libSqlKnexInstance from "../libsql";

export class LibSqlBaseModel extends Model {
  // Override static knex() so LibSQL models ALWAYS use libSqlKnexInstance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static knex(knex?: any) {
    if (knex) {
      return super.knex(knex);
    }
    return libSqlKnexInstance;
  }

  // Override instance-level $knex() for relation queries
  $knex() {
    return libSqlKnexInstance;
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}
