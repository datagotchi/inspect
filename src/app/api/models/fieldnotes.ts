import { Model, QueryBuilder } from "objection";
import { Field, FieldValue, Note } from "@/app/types";
import { LibSqlBaseModel } from "./libsql_models";

// ==========================================
// Field Model
// ==========================================
export class FieldModel extends LibSqlBaseModel implements Field {
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

// ==========================================
// Field Value Model
// ==========================================
export class FieldValueModel extends LibSqlBaseModel implements FieldValue {
  static tableName = "field_values";

  id?: number;
  field_id!: number;
  note_id?: number;
  value!: string;
  user_id?: number;

  static jsonSchema = {
    type: "object",
    required: ["field_id"],
    properties: {
      id: { type: "integer" },
      field_id: { type: "integer" },
      note_id: { type: "integer" },
      value: { type: "string" },
      user_id: { type: "integer" },
    },
  };

  static modifiers = {
    selectDisplayAndSourceJoinColumn(builder: QueryBuilder<FieldValueModel>) {
      builder.select(
        "field_values.id",
        "field_values.field_id",
        "field_values.note_id",
        "field_values.value",
        "field_values.user_id",
      );
    },
  };

  static get relationMappings() {
    return {
      field: {
        relation: Model.BelongsToOneRelation,
        modelClass: FieldModel,
        join: {
          from: "field_values.field_id",
          to: "fields.id",
        },
      },
    };
  }
}

// ==========================================
// Note Model
// ==========================================
export class NoteModel extends LibSqlBaseModel implements Note {
  static tableName = "notes";

  id!: number;
  text!: string;
  user_id!: number;
  created_at!: string;
  updated_at!: string;

  static jsonSchema = {
    type: "object",
    required: ["text", "user_id"],
    properties: {
      id: { type: "integer" },
      text: { type: "string" },
      user_id: { type: "integer" },
      created_at: { type: "string" },
      updated_at: { type: "string" },
    },
  };

  $beforeInsert() {
    const now = new Date().toISOString();
    if (!this.created_at) {
      this.created_at = now;
    }
    this.updated_at = now;
  }

  $beforeUpdate() {
    this.updated_at = new Date().toISOString();
  }

  static get relationMappings() {
    return {
      field_values: {
        relation: Model.HasManyRelation,
        modelClass: FieldValueModel,
        join: {
          from: "notes.id",
          to: "field_values.note_id",
        },
      },
    };
  }
}
