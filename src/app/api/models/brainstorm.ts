import { Model, RelationMappings } from "objection";
import "@/app/api/postgres";
import { PostgresBaseModel } from "./postgres_models";

export class BrainstormNodeOJSModel extends PostgresBaseModel {
  static tableName = "brainstorm_nodes";

  id!: number;
  label!: string;
  note!: string;
  x!: number;
  y!: number;
  source_type?: string | null;
  source_id?: number | null;
  created_at?: string;
  updated_at?: string;

  static jsonSchema = {
    type: "object",
    required: ["label"],
    properties: {
      id: { type: "integer" },
      label: { type: "string" },
      note: { type: "string" },
      x: { type: "number" },
      y: { type: "number" },
    },
  };

  static get relationMappings(): RelationMappings {
    return {
      outgoingEdges: {
        relation: Model.HasManyRelation,
        modelClass: BrainstormEdgeOJSModel,
        join: {
          from: "brainstorm_nodes.id",
          to: "brainstorm_edges.from_id",
        },
      },
      incomingEdges: {
        relation: Model.HasManyRelation,
        modelClass: BrainstormEdgeOJSModel,
        join: {
          from: "brainstorm_nodes.id",
          to: "brainstorm_edges.to_id",
        },
      },
    };
  }
}

export class BrainstormEdgeOJSModel extends PostgresBaseModel {
  static tableName = "brainstorm_edges";

  id!: number;
  from_id!: number;
  to_id!: number;
  created_at?: string;

  static jsonSchema = {
    type: "object",
    required: ["from_id", "to_id"],
    properties: {
      id: { type: "integer" },
      from_id: { type: "integer" },
      to_id: { type: "integer" },
    },
  };

  static get relationMappings(): RelationMappings {
    return {
      fromNode: {
        relation: Model.BelongsToOneRelation,
        modelClass: BrainstormNodeOJSModel,
        join: {
          from: "brainstorm_edges.from_id",
          to: "brainstorm_nodes.id",
        },
      },
      toNode: {
        relation: Model.BelongsToOneRelation,
        modelClass: BrainstormNodeOJSModel,
        join: {
          from: "brainstorm_edges.to_id",
          to: "brainstorm_nodes.id",
        },
      },
    };
  }
}
