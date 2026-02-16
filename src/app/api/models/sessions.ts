import { Model } from "objection";
import { UserModel } from "./users";
import { Session } from "../../types";

export class SessionModel extends Model implements Session {
  id!: number;
  sessionToken!: string;
  userId!: number;
  expires!: Date;

  user?: UserModel;

  static tableName = "sessions";

  static relationMappings = () => ({
    user: {
      relation: Model.BelongsToOneRelation,
      modelClass: UserModel,
      join: {
        from: "sessions.userId",
        to: "users.id",
      },
    },
  });

  static jsonSchema = {
    type: "object",
    required: ["sessionToken", "userId", "expires"],

    properties: {
      id: { type: "integer" },
      sessionToken: { type: "string", minLength: 1 },
      userId: { type: "integer" },
      expires: { type: "string", format: "date-time" },
    },
  };
}
