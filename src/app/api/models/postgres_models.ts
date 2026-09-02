import { Model, snakeCaseMappers } from "objection";

import postgresKnexInstance from "../postgres";

export class PostgresBaseModel extends Model {
  // Override static knex() so Postgres models ALWAYS use postgresKnexInstance
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static knex(knex?: any) {
    if (knex) {
      return super.knex(knex);
    }
    return postgresKnexInstance;
  }

  // Override instance-level $knex() for relation queries
  $knex() {
    return postgresKnexInstance;
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}
