import { Model, QueryBuilder } from "objection";
import "../postgres";
import { PostgresBaseModel } from "./postgres_models";
import {
  User,
  Workflow,
  WorkflowLinkMetadataItem,
  WorkflowNode,
  WorkflowNodeLink,
  WorkflowNodeMetadataItem,
  WorkflowNodeType,
} from "@/app/types";
import { UserLibSqlModel } from "./users";

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
  links!: WorkflowNodeLink[];

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
      links: {
        relation: Model.HasManyRelation,
        modelClass: WorkflowNodeLinkOJSModel,
        join: {
          from: "workflows.id",
          to: "workflow_node_links.workflow_id",
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
  metadata?: WorkflowNodeMetadataItem[];

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
      metadata: {
        relation: Model.HasManyRelation,
        modelClass: WorkflowNodeMetadataOJSModel,
        join: {
          from: "workflow_nodes.id",
          to: "workflow_node_metadata.node_id",
        },
      },
    };
  }
}

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

export class WorkflowNodeLinkOJSModel
  extends PostgresBaseModel
  implements WorkflowNodeLink
{
  static tableName = "workflow_node_links";

  id?: number;
  parent_id!: number;
  child_id!: number;
  created_at?: string;
  workflow_id!: number;

  parentNode?: WorkflowNode;
  childNode?: WorkflowNode;
  workflow?: Workflow | undefined;
  metadata?: WorkflowLinkMetadataItem[]; // 👈 Hydrated relation

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
      // 👈 Link metadata relation
      metadata: {
        relation: Model.HasManyRelation,
        modelClass: WorkflowLinkMetadataOJSModel,
        join: {
          from: "workflow_node_links.id",
          to: "workflow_link_metadata.link_id",
        },
      },
    };
  }
}

export class WorkflowNodeMetadataOJSModel
  extends PostgresBaseModel
  implements WorkflowNodeMetadataItem
{
  static tableName = "workflow_node_metadata";

  id?: number | undefined;
  node_id!: number;
  node?: WorkflowNode | undefined;
  fieldname!: string;
  value!: string;

  static jsonSchem = {
    type: "object",
    required: ["node_id", "fieldname", "value"],
    properties: {
      id: { type: "integer" },
      node_id: { type: "integer" },
      fieldname: { type: "string" },
      value: { type: "string" },
    },
  };

  static get relationMappings() {
    return {};
  }
}

export class WorkflowLinkMetadataOJSModel
  extends PostgresBaseModel
  implements WorkflowLinkMetadataItem
{
  static tableName = "workflow_link_metadata";

  id?: number;
  link_id!: number;
  fieldname!: string;
  value!: string;
  link?: WorkflowNodeLink;

  static jsonSchema = {
    type: "object",
    required: ["link_id", "fieldname", "value"],
    properties: {
      id: { type: "integer" },
      link_id: { type: "integer" },
      fieldname: { type: "string" },
      value: { type: "string" },
    },
  };
}
