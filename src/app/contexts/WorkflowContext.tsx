"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
} from "react";
import { Workflow, WorkflowNode, WorkflowNodeLink } from "../types";

interface WorkflowContextType {
  workflow: Workflow | undefined;
  setWorkflow: React.Dispatch<React.SetStateAction<Workflow | undefined>>;
}

const WorkflowContext = createContext<WorkflowContextType | undefined>(
  undefined,
);

const getSessionKey = (workflowId: number) => `jaw_${workflowId}_session`;

export const WorkflowProvider = ({
  initialWorkflow,
  children,
}: {
  initialWorkflow?: Workflow;
  children: React.ReactNode;
}) => {
  const [workflow, setWorkflow] = useState<Workflow | undefined>(() => {
    if (!initialWorkflow) return undefined;
    if (typeof window === "undefined") return initialWorkflow;

    const saved = sessionStorage.getItem(getSessionKey(initialWorkflow.id));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          nodes?: WorkflowNode[];
          links?: WorkflowNodeLink[];
        };
        return {
          ...initialWorkflow,
          nodes: Array.isArray(parsed.nodes)
            ? parsed.nodes
            : initialWorkflow.nodes,
          links: Array.isArray(parsed.links)
            ? parsed.links
            : initialWorkflow.links,
        };
      } catch (err) {
        console.error("Failed to hydrate workflow from sessionStorage:", err);
      }
    }
    return initialWorkflow;
  });

  // Automatically persist live nodes & links to tab-scoped sessionStorage
  useEffect(() => {
    if (!workflow || typeof window === "undefined") return;
    sessionStorage.setItem(
      getSessionKey(workflow.id),
      JSON.stringify({
        nodes: workflow.nodes ?? [],
        links: workflow.links ?? [],
      }),
    );
  }, [workflow]);

  const contextValue = useMemo(() => ({ workflow, setWorkflow }), [workflow]);

  return (
    <WorkflowContext.Provider value={contextValue}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflowContext = () => {
  const context = useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error(
      "useWorkflowContext must be used within a WorkflowProvider",
    );
  }
  return context;
};
