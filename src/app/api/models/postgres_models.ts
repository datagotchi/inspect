import { Model } from "objection";
import postgresKnexInstance from "../postgres";

export class PostgresBaseModel extends Model {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static knex(knex?: any) {
    if (knex) {
      return super.knex(knex);
    }
    return postgresKnexInstance;
  }

  $knex() {
    return postgresKnexInstance;
  }
}
