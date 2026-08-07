import { Model, snakeCaseMappers } from "objection";

import postgresKnexInstance from "../postgres";

export class PostgresBaseModel extends Model {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static query(...args: any[]) {
    if (!this.knex()) {
      this.knex(postgresKnexInstance);
    }
    return super.query(...args);
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}
