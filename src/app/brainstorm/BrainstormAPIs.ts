import { ConceptEdge, ConceptNode } from "@/app/types";

const SESSION_CACHE_KEY = "brainstorm_canvas_cache_v1";

export interface BrainstormSnapshot {
  nodes: ConceptNode[];
  edges: ConceptEdge[];
}

export interface CreateBrainstormNodeInput {
  label: string;
  note?: string;
  x: number;
  y: number;
  sourceType?: "workflow_node" | "insight" | "session_storage" | null;
  sourceId?: number | null;
}

export interface UpdateBrainstormNodeInput {
  label?: string;
  note?: string;
  x?: number;
  y?: number;
}

export interface CreateBrainstormEdgeInput {
  from: string;
  to: string;
}

export function readBrainstormCache(): BrainstormSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as BrainstormSnapshot;
    if (!Array.isArray(parsed.nodes) || !Array.isArray(parsed.edges)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeBrainstormCache(snapshot: BrainstormSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore sessionStorage quota or privacy-mode errors
  }
}

export async function fetchBrainstormGraph(): Promise<BrainstormSnapshot> {
  const res = await fetch("/api/brainstorm", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load brainstorm graph (${res.status})`);
  }
  const data = (await res.json()) as BrainstormSnapshot;
  writeBrainstormCache(data);
  return data;
}

export async function createBrainstormNode(
  input: CreateBrainstormNodeInput,
): Promise<ConceptNode> {
  const res = await fetch("/api/brainstorm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "node", ...input }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create brainstorm node (${res.status})`);
  }
  const data = (await res.json()) as { node: ConceptNode };
  return data.node;
}

export async function updateBrainstormNode(
  id: string,
  patch: UpdateBrainstormNodeInput,
): Promise<ConceptNode> {
  const res = await fetch(`/api/brainstorm/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    throw new Error(`Failed to update brainstorm node ${id} (${res.status})`);
  }
  const data = (await res.json()) as { node: ConceptNode };
  return data.node;
}

export async function deleteBrainstormNode(id: string): Promise<void> {
  const res = await fetch(`/api/brainstorm/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete brainstorm node ${id} (${res.status})`);
  }
}

export async function createBrainstormEdge(
  input: CreateBrainstormEdgeInput,
): Promise<ConceptEdge> {
  const res = await fetch("/api/brainstorm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "edge", ...input }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create brainstorm edge (${res.status})`);
  }
  const data = (await res.json()) as { edge: ConceptEdge };
  return data.edge;
}

export async function deleteBrainstormEdge(edgeId: string): Promise<void> {
  const res = await fetch("/api/brainstorm", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind: "edge", id: edgeId }),
  });
  if (!res.ok) {
    throw new Error(
      `Failed to delete brainstorm edge ${edgeId} (${res.status})`,
    );
  }
}
