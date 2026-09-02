import { Model, QueryBuilder } from "objection";
import { FieldValue } from "../../../types";

export class FieldValueModel extends Model implements FieldValue {
  static tableName = "field_values";

  id?: number;
  field_id!: number;
  value!: string;
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
    selectDisplayAndSourceJoinColumn(builder: QueryBuilder<FieldValueModel>) {
      builder.select("fields.id", "fields.field_id", "fields.user_id");
    },
  };

  static get relationMappings() {
    return {};
  }
}
