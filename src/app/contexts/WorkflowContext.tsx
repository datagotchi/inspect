"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { Workflow, WorkflowNode, WorkflowNodeLink } from "../types";

export interface CanvasViewport {
  x: number;
  y: number;
  k: number;
}

interface WorkflowContextType {
  workflow: Workflow | undefined;
  setWorkflow: React.Dispatch<React.SetStateAction<Workflow | undefined>>;
  viewport: CanvasViewport | undefined;
  setViewport: (vp: CanvasViewport) => void;
  isHydrated: boolean;
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
  const [workflow, setWorkflow] = useState<Workflow | undefined>(
    initialWorkflow,
  );
  const [viewport, setViewportState] = useState<CanvasViewport | undefined>(
    undefined,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const isHydratedRef = useRef(false);

  // 1. Hydrate nodes AND viewport from sessionStorage on mount
  useEffect(() => {
    if (!initialWorkflow) return;

    const saved = sessionStorage.getItem(getSessionKey(initialWorkflow.id));
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as {
          nodes?: WorkflowNode[];
          links?: WorkflowNodeLink[];
          viewport?: CanvasViewport;
        };

        const cachedCoords = new Map(
          (parsed.nodes ?? [])
            .filter((n) => typeof n.x === "number" && typeof n.y === "number")
            .map((n) => [n.id, { x: n.x, y: n.y }]),
        );

        setWorkflow({
          ...initialWorkflow,
          nodes: (initialWorkflow.nodes ?? []).map((node) => {
            const coords = cachedCoords.get(node.id);
            return coords ? { ...node, x: coords.x, y: coords.y } : node;
          }),
        });

        if (
          parsed.viewport &&
          typeof parsed.viewport.x === "number" &&
          typeof parsed.viewport.y === "number" &&
          typeof parsed.viewport.k === "number"
        ) {
          setViewportState(parsed.viewport);
        }

        isHydratedRef.current = true;
        setIsHydrated(true);
        return;
      } catch (err) {
        console.error("Failed to parse workflow sessionStorage:", err);
      }
    }

    setWorkflow(initialWorkflow);
    isHydratedRef.current = true;
    setIsHydrated(true);
  }, [initialWorkflow]);

  // 2. Persist nodes, links, and viewport to sessionStorage
  useEffect(() => {
    if (!workflow || !isHydratedRef.current) return;

    const hasAnyCoords = (workflow.nodes ?? []).some(
      (n) => typeof n.x === "number" && typeof n.y === "number",
    );
    const existing = sessionStorage.getItem(getSessionKey(workflow.id));
    if (!hasAnyCoords && !viewport && existing) return;

    sessionStorage.setItem(
      getSessionKey(workflow.id),
      JSON.stringify({
        nodes: workflow.nodes ?? [],
        links: workflow.links ?? [],
        viewport,
      }),
    );
  }, [workflow, viewport]);

  const setViewport = useCallback((vp: CanvasViewport) => {
    setViewportState(vp);
  }, []);

  const contextValue = useMemo(
    () => ({ workflow, setWorkflow, viewport, setViewport, isHydrated }),
    [workflow, viewport, setViewport, isHydrated],
  );

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
