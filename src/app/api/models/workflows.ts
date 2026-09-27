import { Model, QueryBuilder } from "objection";
import "../postgres";
import { PostgresBaseModel } from "./postgres_models";
import {
  User,
  Workflow,
  WorkflowNode,
  WorkflowNodeLink,
  WorkflowNodeType,
} from "@/app/types";
import { UserLibSqlModel } from "./users";

export class WorkflowNodeTypeOJSModel
  extends PostgresBaseModel
  implements WorkflowNodeType
{
  static tableName = "workflow_node_types";

  id!: number;
  name!: string;
  icon!: string;
  bg_color!: string;
  border_color!: string;
  text_color!: string;

  static jsonSchema = {
    type: "object",
    required: ["name", "icon"],
    properties: {
      id: { type: "integer" },
      name: { type: "string" },
      icon: { type: "string" },
      bg_color: { type: "string" },
      border_color: { type: "string" },
      text_color: { type: "string" },
    },
  };
}

export class WorkflowOJSModel extends PostgresBaseModel implements Workflow {
  static tableName = "workflows";

  // Database Columns
  id!: number;
  user_id!: number;
  name!: string;
  created_at?: string;
  updated_at?: string;

  // Hydrated Relations
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
    withFullGraph(builder: QueryBuilder<WorkflowOJSModel>) {
      builder.withGraphFetched("[user, nodes.[nodeType, parents, children]]");
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

  // Database Columns
  id!: number;
  workflow_id!: number;
  created_at?: string;
  updated_at?: string;
  label?: string;
  type?: string;

  // Hydrated Relations
  workflow?: Workflow;
  nodeType?: WorkflowNodeType;
  parents?: WorkflowNodeLink[];
  children?: WorkflowNodeLink[];

  static jsonSchema = {
    type: "object",
    required: ["workflow_id"],
    properties: {
      id: { type: "integer" },
      workflow_id: { type: "integer" },
      label: { type: ["string", "null"] },
      type: { type: ["string", "number", "null"] },
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
      nodeType: {
        relation: Model.BelongsToOneRelation,
        modelClass: WorkflowNodeTypeOJSModel,
        join: {
          from: "workflow_nodes.type",
          to: "workflow_node_types.id",
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
