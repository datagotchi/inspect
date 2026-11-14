"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
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
  // 1. Always initialize with initialWorkflow so SSR and first client render match (zero hydration mismatch)
  const [workflow, setWorkflow] = useState<Workflow | undefined>(
    initialWorkflow,
  );
  const hasHydratedSession = useRef(false);

  // 2. Sync fresh server data on mount / router.refresh(), preserving cached canvas (x, y) coordinates
  useEffect(() => {
    if (!initialWorkflow) return;

    const saved = sessionStorage.getItem(getSessionKey(initialWorkflow.id));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          nodes?: WorkflowNode[];
          links?: WorkflowNodeLink[];
        };
        const cachedCoords = new Map(
          (parsed.nodes ?? [])
            .filter((n) => n.x !== undefined && n.y !== undefined)
            .map((n) => [n.id, { x: n.x, y: n.y }]),
        );

        setWorkflow({
          ...initialWorkflow,
          nodes: (initialWorkflow.nodes ?? []).map((node) => {
            const coords = cachedCoords.get(node.id);
            return coords ? { ...node, x: coords.x, y: coords.y } : node;
          }),
        });
        hasHydratedSession.current = true;
        return;
      } catch (err) {
        console.error("Failed to parse workflow sessionStorage:", err);
      }
    }

    setWorkflow(initialWorkflow);
    hasHydratedSession.current = true;
  }, [initialWorkflow]);

  // 3. Persist updated nodes & links to tab-scoped sessionStorage after initial sync
  useEffect(() => {
    if (!workflow || !hasHydratedSession.current) return;
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
