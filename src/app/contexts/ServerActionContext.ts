import { createContext } from "react";
import { FLVResponse, ServerFunction } from "../types";

export type ServerActionContextType = {
  executeAction: (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    func: ServerFunction<any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    input: any,
  ) => Promise<FLVResponse | FLVResponse[] | void>;
};

const ServerActionContext = createContext<ServerActionContextType | undefined>(
  undefined,
);

export default ServerActionContext;
