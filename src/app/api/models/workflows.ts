import { Model, QueryBuilder } from "objection";
import "../postgres";
import { PostgresBaseModel } from "./postgres_models";
import { User, Workflow, WorkflowNode, WorkflowNodeLink } from "@/app/types";
import { UserLibSqlModel } from "./users"; // Adjust path as needed

export class WorkflowOJSModel extends PostgresBaseModel implements Workflow {
  static tableName = "workflows";

  // Database Columns
  id!: number;
  user_id!: number;
  name!: string;
  created_at?: string;
  updated_at?: string;

  // Hydrated Relations (from TS Workflow interface)
  user!: User;
  nodes!: WorkflowNode[];

  static jsonSchema = {
    type: "object",
    required: ["user_id", "name"],
    properties: {
      id: { type: "integer" },
      user_id: { type: "integer" },
      name: { type: "string" },
    },
  };

  static modifiers = {
    // Fetch workflow with user and all nodes attached
    withFullGraph(builder: QueryBuilder<WorkflowOJSModel>) {
      builder.withGraphFetched("[user, nodes.[parents, children]]");
    },
  };

  static get relationMappings() {
    return {
      user: {
        relation: Model.BelongsToOneRelation,
        modelClass: UserLibSqlModel,
        join: {
          from: "workflows.user_id",
          to: "users.id",
        },
      },
      nodes: {
        relation: Model.HasManyRelation,
        modelClass: WorkflowNodeOJSModel,
        join: {
          from: "workflows.id",
          to: "workflow_nodes.workflow_id",
        },
      },
    };
  }
}

export class WorkflowNodeOJSModel
  extends PostgresBaseModel
  implements WorkflowNode
{
  static tableName = "workflow_nodes";

  // Database Columns (Exact match to psql \d workflow_nodes)
  id!: number;
  workflow_id!: number;
  created_at?: string;
  updated_at?: string;
  label?: string;
  type?: string;

  // Hydrated Relations (Exact match to types.d.ts)
  workflow?: Workflow;
  parents?: WorkflowNodeLink[];
  children?: WorkflowNodeLink[];

  static jsonSchema = {
    type: "object",
    required: ["workflow_id"],
    properties: {
      id: { type: "integer" },
      workflow_id: { type: "integer" },
      label: { type: ["string", "null"] },
      type: { type: ["string", "null"] },
    },
  };

  static get relationMappings() {
    return {
      workflow: {
        relation: Model.BelongsToOneRelation,
        modelClass: WorkflowOJSModel,
        join: {
          from: "workflow_nodes.workflow_id",
          to: "workflows.id",
        },
      },
      parents: {
        relation: Model.HasManyRelation,
        modelClass: WorkflowNodeLinkOJSModel,
        join: {
          from: "workflow_nodes.id",
          to: "workflow_node_links.child_id",
        },
      },
      children: {
        relation: Model.HasManyRelation,
        modelClass: WorkflowNodeLinkOJSModel,
        join: {
          from: "workflow_nodes.id",
          to: "workflow_node_links.parent_id",
        },
      },
    };
  }
}

export class WorkflowNodeLinkOJSModel
  extends PostgresBaseModel
  implements WorkflowNodeLink
{
  static tableName = "workflow_node_links";

  id?: number;
  parent_id!: number;
  child_id!: number;
  created_at?: string;

  parentNode?: WorkflowNode;
  childNode?: WorkflowNode;

  static jsonSchema = {
    type: "object",
    required: ["parent_id", "child_id"],
    properties: {
      id: { type: "integer" },
      parent_id: { type: "integer" },
      child_id: { type: "integer" },
    },
  };

  static get relationMappings() {
    return {
      parentNode: {
        relation: Model.BelongsToOneRelation,
        modelClass: WorkflowNodeOJSModel,
        join: {
          from: "workflow_node_links.parent_id",
          to: "workflow_nodes.id",
        },
      },
      childNode: {
        relation: Model.BelongsToOneRelation,
        modelClass: WorkflowNodeOJSModel,
        join: {
          from: "workflow_node_links.child_id",
          to: "workflow_nodes.id",
        },
      },
    };
  }
}
