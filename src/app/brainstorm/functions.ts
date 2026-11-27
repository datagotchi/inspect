import React from "react";
import { graphStratify, sugiyama } from "d3-dag";
import { useRouter } from "next/navigation";

type AppRouter = ReturnType<typeof useRouter>;

import { ConceptEdge, ConceptNode } from "@/app/types";
import {
  createBrainstormEdge,
  deleteBrainstormNode,
  updateBrainstormNode,
  writeBrainstormCache,
} from "./BrainstormAPIs";

export const GRID_SIZE = 24;
export const NODE_WIDTH = 160;
export const NODE_HEIGHT = 54;
export const COL_STEP = 216;
export const ROW_STEP = 120;
export const MIN_ZOOM = 0.35;
export const MAX_ZOOM = 2.0;

export interface MarqueeBox {
  startX: number;
  startY: number;
  currX: number;
  currY: number;
}

export interface PendingLinkDrag {
  fromId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PanState {
  startClientX: number;
  startClientY: number;
  initialPanX: number;
  initialPanY: number;
}

export interface DragState {
  anchorId: string;
  startClientX: number;
  startClientY: number;
  initialPositions: Record<string, { x: number; y: number }>;
  moved: boolean;
}

export function snapToGrid(value: number, enabled: boolean): number {
  if (!enabled) return Math.round(value);
  return Math.round(value / GRID_SIZE) * GRID_SIZE;
}

export function wrapIntoGrid(
  nodes: ConceptNode[],
  snapEnabled: boolean,
): Record<string, { x: number; y: number }> {
  const cols = Math.min(7, Math.max(4, Math.ceil(Math.sqrt(nodes.length))));
  const positions: Record<string, { x: number; y: number }> = {};
  nodes.forEach((n, idx) => {
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    positions[n.id] = {
      x: snapToGrid(48 + col * COL_STEP, snapEnabled),
      y: snapToGrid(48 + row * ROW_STEP, snapEnabled),
    };
  });
  return positions;
}

/**
 * Computes DAG coordinates using d3-dag while safely skipping edges
 * that would create a cycle so freeform concept maps never choke layout.
 */
export function computeDagPositions(
  nodes: ConceptNode[],
  edges: ConceptEdge[],
  snapEnabled: boolean,
): Record<string, { x: number; y: number }> {
  if (nodes.length === 0) return {};
  if (edges.length === 0) {
    return wrapIntoGrid(nodes, snapEnabled);
  }
  if (nodes.length === 1) {
    return {
      [nodes[0].id]: {
        x: snapToGrid(72, snapEnabled),
        y: snapToGrid(72, snapEnabled),
      },
    };
  }

  const nodeIds = new Set(nodes.map((n) => n.id));
  const adjacency = new Map<string, Set<string>>();
  for (const id of nodeIds) adjacency.set(id, new Set());

  function hasPath(start: string, target: string): boolean {
    const visited = new Set<string>();
    const stack = [start];
    while (stack.length > 0) {
      const current = stack.pop()!;
      if (current === target) return true;
      if (visited.has(current)) continue;
      visited.add(current);
      for (const next of adjacency.get(current) ?? []) {
        if (!visited.has(next)) stack.push(next);
      }
    }
    return false;
  }

  const parentMap = new Map<string, string[]>();
  for (const id of nodeIds) parentMap.set(id, []);

  for (const edge of edges) {
    if (
      !nodeIds.has(edge.from) ||
      !nodeIds.has(edge.to) ||
      edge.from === edge.to
    ) {
      continue;
    }
    if (!hasPath(edge.to, edge.from)) {
      adjacency.get(edge.from)!.add(edge.to);
      parentMap.get(edge.to)!.push(edge.from);
    }
  }

  const stratifyData = nodes.map((n) => ({
    id: n.id,
    parentIds: parentMap.get(n.id) ?? [],
  }));

  try {
    const stratify = graphStratify();
    const dag = stratify(stratifyData);

    const layout = sugiyama().nodeSize([COL_STEP + 24, ROW_STEP + 24]);
    layout(dag);

    let minRawX = Infinity;
    let minRawY = Infinity;
    for (const dNode of dag.nodes()) {
      const rx = dNode.x ?? 0;
      const ry = dNode.y ?? 0;
      if (rx < minRawX) minRawX = rx;
      if (ry < minRawY) minRawY = ry;
    }

    const offsetX = 72 - (Number.isFinite(minRawX) ? minRawX : 0);
    const offsetY = 72 - (Number.isFinite(minRawY) ? minRawY : 0);

    const positions: Record<string, { x: number; y: number }> = {};
    for (const dNode of dag.nodes()) {
      const rawX = (dNode.x ?? 0) + offsetX;
      const rawY = (dNode.y ?? 0) + offsetY;
      positions[dNode.data.id] = {
        x: Math.max(24, snapToGrid(rawX, snapEnabled)),
        y: Math.max(24, snapToGrid(rawY, snapEnabled)),
      };
    }
    return positions;
  } catch {
    return wrapIntoGrid(nodes, snapEnabled);
  }
}

export function getBoardWorldCoords(
  clientX: number,
  clientY: number,
  rect: DOMRect | undefined,
  pan: { x: number; y: number },
  zoom: number,
): { x: number; y: number } {
  if (!rect) {
    return {
      x: (clientX - pan.x) / zoom,
      y: (clientY - pan.y) / zoom,
    };
  }
  return {
    x: (clientX - rect.left - pan.x) / zoom,
    y: (clientY - rect.top - pan.y) / zoom,
  };
}

export function getMarqueeHitIds(
  nodes: ConceptNode[],
  box: MarqueeBox,
): string[] {
  const minX = Math.min(box.startX, box.currX);
  const maxX = Math.max(box.startX, box.currX);
  const minY = Math.min(box.startY, box.currY);
  const maxY = Math.max(box.startY, box.currY);

  return nodes
    .filter(
      (n) =>
        n.x < maxX &&
        n.x + NODE_WIDTH > minX &&
        n.y < maxY &&
        n.y + NODE_HEIGHT > minY,
    )
    .map((n) => n.id);
}

export function computeDraggedNodePositions(
  nodes: ConceptNode[],
  initialPositions: Record<string, { x: number; y: number }>,
  dx: number,
  dy: number,
): ConceptNode[] {
  return nodes.map((node) => {
    const base = initialPositions[node.id];
    if (!base) return node;
    return {
      ...node,
      x: Math.max(16, base.x + dx),
      y: Math.max(16, base.y + dy),
    };
  });
}

export async function handlePromoteToWorkflow(params: {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  selectedSet: Set<string>;
  isPromoting: boolean;
  router: AppRouter;
  setIsPromoting: React.Dispatch<React.SetStateAction<boolean>>;
  setSyncError: React.Dispatch<React.SetStateAction<string | null>>;
  setNodes: React.Dispatch<React.SetStateAction<ConceptNode[]>>;
  setEdges: React.Dispatch<React.SetStateAction<ConceptEdge[]>>;
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const {
    nodes,
    edges,
    selectedSet,
    isPromoting,
    router,
    setIsPromoting,
    setSyncError,
    setNodes,
    setEdges,
    setSelectedIds,
  } = params;

  const selectedNodes = nodes.filter((n) => selectedSet.has(n.id));
  if (selectedNodes.length === 0 || isPromoting) return;

  const selectedEdges = edges.filter(
    (e) => selectedSet.has(e.from) && selectedSet.has(e.to),
  );
  const title = `GTM: ${selectedNodes
    .slice(0, 3)
    .map((n) => n.label)
    .join(" + ")}`;

  setIsPromoting(true);
  setSyncError(null);

  try {
    const wfRes = await fetch("/api/workflows", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: title,
        category: "gtm",
        nodes: selectedNodes.map((n) => ({
          label: n.label,
          note: n.note ?? "",
        })),
        links: selectedEdges.map((e) => ({
          from: e.from,
          to: e.to,
        })),
      }),
    });

    if (!wfRes.ok) {
      throw new Error(`Create workflow failed (${wfRes.status})`);
    }

    const createdWorkflow = await wfRes.json();

    for (const node of selectedNodes) {
      await deleteBrainstormNode(node.id);
    }

    const remainingNodes = nodes.filter((n) => !selectedSet.has(n.id));
    const remainingEdges = edges.filter(
      (e) => !selectedSet.has(e.from) && !selectedSet.has(e.to),
    );

    setNodes(remainingNodes);
    setEdges(remainingEdges);
    setSelectedIds([]);
    writeBrainstormCache({ nodes: remainingNodes, edges: remainingEdges });

    const workflowId = createdWorkflow?.workflowId ?? createdWorkflow?.id ?? "";
    router.push(
      workflowId
        ? `/workflows?workflowId=${encodeURIComponent(String(workflowId))}`
        : "/workflows",
    );
  } catch (err) {
    console.error("Failed to promote selection to workflow:", err);
    setSyncError("Could not promote selection to workflow");
  } finally {
    setIsPromoting(false);
  }
}

export function handleLayoutDag(params: {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
  snapEnabled: boolean;
  setNodes: React.Dispatch<React.SetStateAction<ConceptNode[]>>;
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  setSyncError: React.Dispatch<React.SetStateAction<string | null>>;
}) {
  const { nodes, edges, snapEnabled, setNodes, setPan, setSyncError } = params;
  const nextPositions = computeDagPositions(nodes, edges, snapEnabled);
  const movedNodes: ConceptNode[] = [];

  setNodes((prev) =>
    prev.map((node) => {
      const pos = nextPositions[node.id];
      if (!pos) return node;
      const updatedNode = { ...node, x: pos.x, y: pos.y };
      movedNodes.push(updatedNode);
      return updatedNode;
    }),
  );

  setPan({ x: 0, y: 0 });

  movedNodes.forEach((node) => {
    updateBrainstormNode(node.id, { x: node.x, y: node.y }).catch((err) => {
      console.error("Failed to save tidied node position:", err);
      setSyncError("Layout updated locally; database save failed");
    });
  });
}

export function handleBoardWheel(
  e: React.WheelEvent<HTMLDivElement>,
  params: {
    boardRef: React.RefObject<HTMLDivElement | null>;
    pan: { x: number; y: number };
    zoom: number;
    setZoom: React.Dispatch<React.SetStateAction<number>>;
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  },
) {
  e.preventDefault();
  const { boardRef, pan, zoom, setZoom, setPan } = params;
  const rect = boardRef.current?.getBoundingClientRect();
  const factor =
    e.ctrlKey || e.metaKey
      ? Math.exp(-e.deltaY * 0.01)
      : e.deltaY < 0
        ? 1.08
        : 0.92;

  const nextZoom = Math.min(
    MAX_ZOOM,
    Math.max(MIN_ZOOM, Math.round(zoom * factor * 1000) / 1000),
  );
  if (nextZoom === zoom) return;

  const cursorX = rect ? e.clientX - rect.left : 0;
  const cursorY = rect ? e.clientY - rect.top : 0;
  const worldX = (cursorX - pan.x) / zoom;
  const worldY = (cursorY - pan.y) / zoom;

  setZoom(nextZoom);
  setPan({ x: cursorX - worldX * nextZoom, y: cursorY - worldY * nextZoom });
}

export function handleBoardPointerDown(
  e: React.PointerEvent<HTMLDivElement>,
  params: {
    boardRef: React.RefObject<HTMLDivElement | null>;
    pan: { x: number; y: number };
    zoom: number;
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    setMarquee: React.Dispatch<React.SetStateAction<MarqueeBox | null>>;
    setPanState: React.Dispatch<React.SetStateAction<PanState | null>>;
  },
) {
  if (e.button !== 0) return;
  const { boardRef, pan, zoom, setSelectedIds, setMarquee, setPanState } =
    params;
  const pt = getBoardWorldCoords(
    e.clientX,
    e.clientY,
    boardRef.current?.getBoundingClientRect(),
    pan,
    zoom,
  );
  e.currentTarget.setPointerCapture(e.pointerId);

  if (e.shiftKey) {
    setMarquee({ startX: pt.x, startY: pt.y, currX: pt.x, currY: pt.y });
    return;
  }

  setSelectedIds([]);
  setPanState({
    startClientX: e.clientX,
    startClientY: e.clientY,
    initialPanX: pan.x,
    initialPanY: pan.y,
  });
}

export function handleNodePointerDown(
  e: React.PointerEvent<HTMLDivElement>,
  node: ConceptNode,
  params: {
    nodes: ConceptNode[];
    selectedIds: string[];
    selectedSet: Set<string>;
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    setDragState: React.Dispatch<React.SetStateAction<DragState | null>>;
  },
) {
  if (e.button !== 0) return;
  e.stopPropagation();

  const { nodes, selectedIds, selectedSet, setSelectedIds, setDragState } =
    params;

  const nextIds = e.shiftKey
    ? selectedSet.has(node.id)
      ? selectedIds.filter((id) => id !== node.id)
      : [...selectedIds, node.id]
    : selectedSet.has(node.id)
      ? selectedIds
      : [node.id];

  setSelectedIds(nextIds);

  const moveTargets = nextIds.includes(node.id) ? nextIds : [node.id];
  const initialPositions: Record<string, { x: number; y: number }> = {};
  for (const n of nodes) {
    if (moveTargets.includes(n.id)) {
      initialPositions[n.id] = { x: n.x, y: n.y };
    }
  }

  setDragState({
    anchorId: node.id,
    startClientX: e.clientX,
    startClientY: e.clientY,
    initialPositions,
    moved: false,
  });
}

export function handleConnectorPointerDown(
  e: React.PointerEvent<HTMLButtonElement>,
  fromNode: ConceptNode,
  params: {
    boardRef: React.RefObject<HTMLDivElement | null>;
    pan: { x: number; y: number };
    zoom: number;
    setLinkDrag: React.Dispatch<React.SetStateAction<PendingLinkDrag | null>>;
  },
) {
  if (e.button !== 0) return;
  e.stopPropagation();
  const { boardRef, pan, zoom, setLinkDrag } = params;
  const pt = getBoardWorldCoords(
    e.clientX,
    e.clientY,
    boardRef.current?.getBoundingClientRect(),
    pan,
    zoom,
  );

  setLinkDrag({
    fromId: fromNode.id,
    x1: fromNode.x + NODE_WIDTH / 2,
    y1: fromNode.y + NODE_HEIGHT,
    x2: pt.x,
    y2: pt.y,
  });
}

export function handleBoardPointerMove(
  e: React.PointerEvent<HTMLDivElement>,
  params: {
    boardRef: React.RefObject<HTMLDivElement | null>;
    nodes: ConceptNode[];
    pan: { x: number; y: number };
    zoom: number;
    linkDrag: PendingLinkDrag | null;
    marquee: MarqueeBox | null;
    dragState: DragState | null;
    panState: PanState | null;
    setLinkDrag: React.Dispatch<React.SetStateAction<PendingLinkDrag | null>>;
    setMarquee: React.Dispatch<React.SetStateAction<MarqueeBox | null>>;
    setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
    setDragState: React.Dispatch<React.SetStateAction<DragState | null>>;
    setNodes: React.Dispatch<React.SetStateAction<ConceptNode[]>>;
    setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  },
) {
  const {
    boardRef,
    nodes,
    pan,
    zoom,
    linkDrag,
    marquee,
    dragState,
    panState,
    setLinkDrag,
    setMarquee,
    setSelectedIds,
    setDragState,
    setNodes,
    setPan,
  } = params;

  const rect = boardRef.current?.getBoundingClientRect();

  if (linkDrag) {
    const pt = getBoardWorldCoords(e.clientX, e.clientY, rect, pan, zoom);
    setLinkDrag((prev) => (prev ? { ...prev, x2: pt.x, y2: pt.y } : null));
    return;
  }

  if (marquee) {
    const pt = getBoardWorldCoords(e.clientX, e.clientY, rect, pan, zoom);
    const nextMarquee = { ...marquee, currX: pt.x, currY: pt.y };
    setMarquee(nextMarquee);
    setSelectedIds(getMarqueeHitIds(nodes, nextMarquee));
    return;
  }

  if (dragState) {
    const dx = (e.clientX - dragState.startClientX) / zoom;
    const dy = (e.clientY - dragState.startClientY) / zoom;
    const moved = dragState.moved || Math.hypot(dx, dy) > 3;
    setDragState((prev) => (prev ? { ...prev, moved } : null));
    setNodes((prev) =>
      computeDraggedNodePositions(prev, dragState.initialPositions, dx, dy),
    );
    return;
  }

  if (panState) {
    setPan({
      x: panState.initialPanX + (e.clientX - panState.startClientX),
      y: panState.initialPanY + (e.clientY - panState.startClientY),
    });
  }
}

export function handleBoardPointerUp(
  e: React.PointerEvent<HTMLDivElement>,
  params: {
    boardRef: React.RefObject<HTMLDivElement | null>;
    nodes: ConceptNode[];
    edges: ConceptEdge[];
    pan: { x: number; y: number };
    zoom: number;
    snapEnabled: boolean;
    edgeSeqRef: React.MutableRefObject<number>;
    linkDrag: PendingLinkDrag | null;
    marquee: MarqueeBox | null;
    dragState: DragState | null;
    panState: PanState | null;
    setLinkDrag: React.Dispatch<React.SetStateAction<PendingLinkDrag | null>>;
    setMarquee: React.Dispatch<React.SetStateAction<MarqueeBox | null>>;
    setDragState: React.Dispatch<React.SetStateAction<DragState | null>>;
    setPanState: React.Dispatch<React.SetStateAction<PanState | null>>;
    setEdges: React.Dispatch<React.SetStateAction<ConceptEdge[]>>;
    setNodes: React.Dispatch<React.SetStateAction<ConceptNode[]>>;
    setSyncError: React.Dispatch<React.SetStateAction<string | null>>;
  },
) {
  if (e.currentTarget.hasPointerCapture(e.pointerId)) {
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  const {
    boardRef,
    nodes,
    edges,
    pan,
    zoom,
    snapEnabled,
    edgeSeqRef,
    linkDrag,
    marquee,
    dragState,
    panState,
    setLinkDrag,
    setMarquee,
    setDragState,
    setPanState,
    setEdges,
    setNodes,
    setSyncError,
  } = params;

  if (linkDrag) {
    const pt = getBoardWorldCoords(
      e.clientX,
      e.clientY,
      boardRef.current?.getBoundingClientRect(),
      pan,
      zoom,
    );
    const targetNode = nodes.find(
      (n) =>
        n.id !== linkDrag.fromId &&
        pt.x >= n.x - 10 &&
        pt.x <= n.x + NODE_WIDTH + 10 &&
        pt.y >= n.y - 10 &&
        pt.y <= n.y + NODE_HEIGHT + 10,
    );

    if (targetNode) {
      const exists = edges.some(
        (edge) =>
          (edge.from === linkDrag.fromId && edge.to === targetNode.id) ||
          (edge.from === targetNode.id && edge.to === linkDrag.fromId),
      );
      if (!exists) {
        const tempEdgeId = `temp-e-${edgeSeqRef.current++}-${linkDrag.fromId}-${targetNode.id}`;
        setEdges((prev) => [
          ...prev,
          { id: tempEdgeId, from: linkDrag.fromId, to: targetNode.id },
        ]);

        createBrainstormEdge({ from: linkDrag.fromId, to: targetNode.id })
          .then((createdEdge) => {
            setSyncError(null);
            setEdges((prev) =>
              prev.map((edge) => (edge.id === tempEdgeId ? createdEdge : edge)),
            );
          })
          .catch((err) => {
            console.error("Failed to create brainstorm edge:", err);
            setSyncError("Link created locally; database save failed");
          });
      }
    }

    setLinkDrag(null);
    return;
  }

  if (marquee) {
    setMarquee(null);
    return;
  }

  if (dragState) {
    const movedIdSet = new Set(Object.keys(dragState.initialPositions));
    const snappedUpdates: Array<{ id: string; x: number; y: number }> = [];

    setNodes((prev) =>
      prev.map((node) => {
        if (!movedIdSet.has(node.id)) return node;
        const snappedX = snapToGrid(node.x, snapEnabled);
        const snappedY = snapToGrid(node.y, snapEnabled);
        snappedUpdates.push({ id: node.id, x: snappedX, y: snappedY });
        return { ...node, x: snappedX, y: snappedY };
      }),
    );

    if (dragState.moved) {
      snappedUpdates.forEach(({ id, x, y }) => {
        updateBrainstormNode(id, { x, y }).catch((err) => {
          console.error("Failed to persist dragged node position:", err);
          setSyncError("Position cached locally; database save failed");
        });
      });
    }

    setDragState(null);
    return;
  }

  if (panState) {
    setPanState(null);
  }
}
