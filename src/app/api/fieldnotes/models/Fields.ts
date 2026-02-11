import { Model, QueryBuilder } from "objection";
import { Field } from "../../../types";

export class FieldModel extends Model implements Field {
  static tableName = "fields";

  id?: number;
  name!: string;
  user_id?: number;

  static jsonSchema = {
    type: "object",
    required: ["name"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      user_id: { type: "integer" },
    },
  };

  static modifiers = {
    selectDisplayAndSourceJoinColumn(builder: QueryBuilder<FieldModel>) {
      builder.select("fields.id", "fields.name", "fields.user_id");
    },
  };

  static get relationMappings() {
    return {};
  }
}
