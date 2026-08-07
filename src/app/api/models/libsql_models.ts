import { Model, snakeCaseMappers } from "objection";
import libSqlKnexInstance from "../libsql";

export class LibSqlBaseModel extends Model {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static query(...args: any[]) {
    if (this.knex() !== libSqlKnexInstance) {
      this.knex(libSqlKnexInstance);
    }
    return super.query(...args);
  }

  static get columnNameMappers() {
    return snakeCaseMappers();
  }
}
