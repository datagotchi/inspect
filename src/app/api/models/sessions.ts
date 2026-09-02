import { Model } from "objection";

import { UserLibSqlModel } from "./users";
import { Session } from "../../types";
import { LibSqlBaseModel } from "./libsql_models";

export class SessionModel extends LibSqlBaseModel implements Session {
  id!: number;
  token!: string;
  user_id!: number;
  expires!: string;

  user?: UserLibSqlModel;

  static tableName = "sessions";

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserLibSqlModel,
      join: {
        from: "sessions.user_id",
        to: "users.id",
      },
    },
  });

  static jsonSchema = {
    type: "object",
    required: ["token", "user_id", "expires"],

    properties: {
      id: { type: "integer" },
      token: { type: "string", minLength: 1 },
      user_id: { type: "integer" },
      expires: { type: ["string"] },
    },
  };
}
