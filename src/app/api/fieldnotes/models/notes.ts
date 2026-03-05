import { Model } from "objection";
import { Note } from "../../../types";
import { FieldValueModel } from "./field_values";
import { FieldModel } from "./Fields";

export class NoteModel extends Model implements Note {
  static tableName = "notes";

  id?: number;
  text!: string;
  datetime!: string;
  user_id!: number;
  created_at?: string;
  updated_at?: string;

  field_values?: (FieldValueModel & FieldModel)[];

  static jsonSchema = {
    type: "object",
    required: ["text", "datetime", "user_id"],

    properties: {
      id: { type: "integer" },
      text: { type: "string" },
      datetime: { type: "string", format: "date-time" },
      user_id: { type: "integer" },
    },
  };

  static relationMappings = {
    field_values: {
      relation: Model.HasManyRelation,
      modelClass: FieldValueModel,
      join: {
        from: "notes.id",
        to: "field_values.note_id",
      },
    },
  };

  $beforeInsert() {
    const now = new Date().toISOString();
    this.created_at = now;
    this.updated_at = now;
    if (!this.datetime) {
      this.datetime = now;
    }
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }
}
