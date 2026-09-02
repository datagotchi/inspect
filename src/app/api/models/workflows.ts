import { Model, QueryBuilder } from "objection";

import "../postgres";
import { PostgresBaseModel } from "./postgres_models";
import {
  EvidenceRecord,
  FactComment,
  FactReaction,
  Workflow,
  WorkflowNode,
} from "@/app/types";

export class WorkflowModel extends PostgresBaseModel implements Workflow {
  static tableName = "workflows";

  id!: number;
  name!: string;
  user_id!: number;
  root_id?: number;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  uid?: string | undefined;
  title?: string | undefined;
  reactions?: FactReaction[] | undefined;
  comments?: FactComment[] | undefined;
  evidence?: EvidenceRecord[] | undefined;
  created_at?: string | undefined;
  updated_at?: string | undefined;

  static jsonSchema = {
    type: "object",
    properties: {
      id: { type: "integer" },
      root_id: { type: "integer" },
    },
  };

  static modifiers = {
    selectNodes(builder: QueryBuilder<WorkflowModel>) {
      // FIXME: recursively get nodes in the workflow by calling selectChildren on the root node
    },
  };

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

  static modifiers = {
    selectChildren(builder: QueryBuilder<WorkflowModel>, rootId: number) {
      return (
        builder
          .withRecursive("node_tree", (cte) => {
            // Anchor member: select the starting root node
            cte
              .select("id", "parentId", "name") // Add any other columns you need
              .from("nodes")
              .where("id", rootId)
              .unionAll((union) => {
                // Recursive member: join the table back to the CTE
                union
                  .select("n.id", "n.parentId", "n.name")
                  .from("nodes as n")
                  .join("node_tree as nt", "n.parentId", "nt.id");
              });
          })
          // Join your main query builder to the CTE results
          .from("node_tree")
      );
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
