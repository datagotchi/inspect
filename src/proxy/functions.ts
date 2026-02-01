import bcrypt from "bcryptjs";

import { User } from "../app/types";

export const getEncryptedToken = (user: User): Promise<string> => {
  return bcrypt.hash(user.email + Date.now(), 10);
};
