import { Model } from "objection";

import "../postgres";
import { PostgresBaseModel } from "./postgres_models";
import { Workflow, WorkflowNode } from "@/app/types";

export class WorkflowModel extends PostgresBaseModel implements Workflow {
  static tableName = "workflows";

  id!: number;
  root_id?: number;

  static jsonSchema = {
    type: "object",
    properties: {
      id: { type: "integer" },
      root_id: { type: "integer" },
    },
  };

  // static modifiers = {
  //   selectDisplayColumns(builder: QueryBuilder<WorkflowModel>) {
  //     builder.select("insights.id");
  //   },
  //   selectId(builder: QueryBuilder<WorkflowModel>) {
  //     builder.select("insights.id");
  //   },
  // };

  static get relationMappings() {
    // TODO: delete this commented-out code if it's not needed for LIVE OJS type importing
    // const { InsightLinkModel } = require("./insight_links");
    return {
      root: {
        relation: Model.HasOneRelation,
        modelClass: WorkflowNodeModel,
        join: {
          from: "workflows.root_id",
          to: "workflow_nodes.id",
        },
      },
    };
  }

  // $beforeInsert() {
  //   this.created_at = new Date().toISOString();
  //   this.updated_at = new Date().toISOString();
  // }

  // $beforeUpdate() {
  //   this.updated_at = new Date().toISOString();
  // }
}

export class WorkflowNodeModel
  extends PostgresBaseModel
  implements WorkflowNode
{
  id!: number;
  workflow_id!: number;

  static jsonSchema = {
    type: "object",
    properties: {
      id: { type: "integer" },
    },
  };

  static get relationMappings() {
    // TODO: delete this commented-out code if it's not needed for LIVE OJS type importing
    // const { InsightLinkModel } = require("./insight_links");
    return {
      workflow: {
        relation: Model.HasOneRelation,
        modelClass: WorkflowModel,
        join: {
          from: "workflow_nodes.workflow_id",
          to: "workflows.id",
        },
      },
    };
  }
}
