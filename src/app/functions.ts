import { ReadonlyHeaders } from "next/dist/server/web/spec-extension/adapters/headers";
import {
  DeleteCommentRouteProps,
  DeleteCommentRouteResponse,
} from "./api/comments/[id]/route";
import {
  PostCommentRequestBody,
  PostCommentResponse,
} from "./api/comments/route";
import { PostRequestRouteRequestBody } from "./api/reactions/route";
import {
  FactComment,
  FactReaction,
  Indexable,
  Insight,
  InsightEvidence,
  JsonLdCausalLink,
  JsonLdWorkflowDocument,
  JsonLdWorkflowNode,
  Link,
  User,
  Workflow,
  WorkflowLinkMetadataItem,
  WorkflowNode,
  WorkflowNodeLink,
  WorkflowNodeMetadataItem,
} from "./types";
import { SortDir } from "./components/FactsTable";
import { NODE_TYPE_REGISTRY, WORKFLOW_JSONLD_SCHEMA } from "./constants";

export const getUnreadSummariesForCurrentUser = (
  origin: string,
  offset: number,
  token: string,
): Promise<Link[]> =>
  fetch(`${origin}/api/unread_summaries?offset=${offset}&limit=${20}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  }).then((response) => response.json());

async function readResponseJson<T = unknown>(
  response: Response,
): Promise<T | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function errorMessageFromBody(
  body: { message?: string; statusText?: string } | null,
  fallback: string,
): string {
  return body?.message || body?.statusText || fallback;
}

export const submitComment = async (
  requestBody: Awaited<PostCommentRequestBody>,
  token: string,
): Promise<FactComment | void> => {
  const response = (await fetch("/api/comments", {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  })) as PostCommentResponse;

  const body = await readResponseJson<
    FactComment | { message?: string; statusText?: string }
  >(response);

  if (response.ok && body && "comment" in body) {
    return body as FactComment;
  }

  throw new Error(
    errorMessageFromBody(
      body as { message?: string; statusText?: string } | null,
      response.statusText || "Unable to save comment.",
    ),
  );
};

export const deleteComment = async (
  params: Awaited<DeleteCommentRouteProps["params"]>,
  token: string,
): Promise<boolean> => {
  const response = (await fetch(`/api/comments/${params.id!}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  })) as DeleteCommentRouteResponse;
  if (response.ok) {
    return true;
  }
  const body = await readResponseJson<{
    message?: string;
    statusText?: string;
  }>(response);
  throw new Error(
    errorMessageFromBody(
      body,
      response.statusText || "Unable to delete comment.",
    ),
  );
};

export const submitReaction = async (
  requestBody: Awaited<PostRequestRouteRequestBody>,
  token: string,
): Promise<FactReaction | void> => {
  const response = await fetch("/api/reactions", {
    method: "POST",
    body: JSON.stringify(requestBody),
    headers: {
      "Content-Type": "application/json",
      "x-access-token": token,
    },
  });

  const body = await readResponseJson<
    FactReaction | { message?: string; statusText?: string }
  >(response);

  if (response.ok && body && "reaction" in body) {
    return body as FactReaction;
  }

  throw new Error(
    errorMessageFromBody(
      body as { message?: string; statusText?: string } | null,
      response.statusText || "Unable to save reaction.",
    ),
  );
};

const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

export function debounce({
  func,
  key = "default",
  wait = 300,
}: {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  func: Function;
  key?: string;
  wait?: number;
}) {
  if (timeouts[key]) {
    clearTimeout(timeouts[key]);
  }
  timeouts[key] = setTimeout(() => {
    func();
  }, wait);
}

export const getDisabledInsightIds = (
  potentialInsights: Insight[],
  selectedCitations: InsightEvidence[],
): number[] => {
  if (selectedCitations.length > 0) {
    const disabledInsights: Insight[] = selectedCitations.reduce(
      (insights: Insight[], citation: InsightEvidence) => {
        const existingInsights = potentialInsights.filter((i) => {
          return i.evidence
            ? i.evidence.map((e) => e.summary_id).includes(citation.summary_id)
            : false;
        });
        insights.push(...existingInsights);
        return insights;
      },
      [] as Insight[],
    );
    return disabledInsights.map((i) => i.id ?? 0);
  }
  return [];
};

export const getAuthUser = async (
  headers: () => Promise<ReadonlyHeaders>,
): Promise<User | null> => {
  const authUserString = (await headers()).get("x-authUser");
  return authUserString ? (JSON.parse(authUserString) as User) : null;
};

export const getColumnName = (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[],
  ...possibilities: string[]
): undefined | string => {
  if (data) {
    const columns = Object.keys(data[0]);
    for (const possibility of possibilities) {
      if (columns.includes(possibility)) {
        return possibility;
      }
    }
  }
  return undefined;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const areSameType = (a: any, b: any) => typeof a == typeof b && typeof a;

export const getSortFunction =
  <T extends Indexable>(sortDir?: SortDir) =>
  (a: T, b: T): number => {
    if (sortDir) {
      let aValue = a[sortDir.column];
      let bValue = b[sortDir.column];

      if (sortDir.column.includes(".")) {
        const parts = sortDir.column.split(".");
        aValue = parts.reduce((prev, current) => {
          return prev && prev[current] !== undefined
            ? prev[current]
            : undefined;
        }, a);
        bValue = parts.reduce((prev, current) => {
          return prev && prev[current] !== undefined
            ? prev[current]
            : undefined;
        }, b);
      }

      if (aValue !== undefined && bValue !== undefined) {
        if (sortDir.dir == "asc") {
          if (
            areSameType(aValue, bValue) == "number" ||
            areSameType(aValue, bValue) == "boolean"
          ) {
            return Number(aValue) - Number(bValue);
          } else if (typeof aValue == "string") {
            return aValue.localeCompare(bValue);
          } else if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
            return Date.parse(aValue) - Date.parse(bValue);
          } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
            return aValue.length - bValue.length;
          }
        } else {
          if (
            areSameType(aValue, bValue) == "number" ||
            areSameType(aValue, bValue) == "boolean"
          ) {
            return Number(bValue) - Number(aValue);
          } else if (typeof aValue == "string") {
            return bValue.localeCompare(aValue);
          } else if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
            return Date.parse(bValue) - Date.parse(aValue);
          } else if (Array.isArray(aValue) && Array.isArray(bValue)) {
            return bValue.length - aValue.length;
          }
        }
      }
    }
    return 0;
  };

function normalizeFieldname(fieldname: string): string {
  const cleaned = fieldname.replace(/[^a-zA-Z0-9]/g, "");
  return cleaned || `inspect:${fieldname}`;
}

function reduceMetadata(
  items?: { fieldname: string; value: string }[],
  ignoreSingleCharKeys = false,
): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  if (!items?.length) return result;

  for (const item of items) {
    if (!item.fieldname || item.value === undefined || item.value === "")
      continue;
    if (ignoreSingleCharKeys && item.fieldname.trim().length <= 1) continue;

    const term = normalizeFieldname(item.fieldname);
    const asNum = Number(item.value);
    result[term] =
      !Number.isNaN(asNum) &&
      item.value.trim() !== "" &&
      ["conditionalProbability", "epistemicUncertainty"].includes(term)
        ? asNum
        : item.value;
  }
  return result;
}

export function serializeWorkflowToJsonLd(
  workflow: Workflow,
  inlineContext = true,
): JsonLdWorkflowDocument {
  const wfUri = `urn:inspect:workflow:${workflow.id}`;

  const nodeGraph: JsonLdWorkflowNode[] = (workflow.nodes ?? []).map((node) => {
    const typeInfo = node.node_type_id
      ? NODE_TYPE_REGISTRY[node.node_type_id]
      : undefined;

    return {
      id: `${wfUri}:node:${node.id}`,
      type: typeInfo?.term ?? "prov:Entity",
      title: node.label ?? `Node ${node.id}`,
      category:
        node.nodeType?.category ??
        typeInfo?.category ??
        workflow.category ??
        "system",
      icon: node.nodeType?.icon ?? typeInfo?.icon ?? "•",
      bgColor: node.nodeType?.bg_color ?? typeInfo?.bgColor ?? "#ffffff",
      ...(node.x !== undefined && node.y !== undefined
        ? { canvasPosition: { x: node.x, y: node.y } }
        : {}),
      ...reduceMetadata(node.metadata),
    };
  });

  const linkGraph: JsonLdCausalLink[] = (workflow.links ?? []).map((link) => {
    const sourceUri = `${wfUri}:node:${link.parent_id}`;
    const targetUri = `${wfUri}:node:${link.child_id}`;

    return {
      id: `${wfUri}:link:${link.id ?? `${link.parent_id}-${link.child_id}`}`,
      type: "CausalLink",
      source: sourceUri,
      target: targetUri,
      derivedFrom: sourceUri,
      ...reduceMetadata(link.metadata, true),
    };
  });

  return {
    "@context": inlineContext
      ? WORKFLOW_JSONLD_SCHEMA
      : "/api/contexts/workflow-v1.jsonld",
    id: wfUri,
    type: "WorkflowGraph",
    title: workflow.name,
    ...(workflow.category ? { category: workflow.category } : {}),
    ...(workflow.user?.username || workflow.user?.email
      ? { creator: workflow.user.username ?? workflow.user.email }
      : {}),
    ...(workflow.created_at ? { created: workflow.created_at } : {}),
    ...(workflow.updated_at ? { modified: workflow.updated_at } : {}),
    graph: [...nodeGraph, ...linkGraph],
  };
}

const TERM_TO_NODE_TYPE_ID: Record<string, number> = Object.entries(
  NODE_TYPE_REGISTRY,
).reduce(
  (acc, [idStr, info]) => {
    acc[info.term] = Number(idStr);
    return acc;
  },
  {} as Record<string, number>,
);

const TERM_TO_FIELDNAME: Record<string, string> = {
  Format: "Format",
  AffectSpikes: "Affect Spikes",
  Objective: "Objective",
  CoreNeed: "Core Need",
  IncludedServices: "Included Services",
  Neurotype: "Neurotype",
  Framework: "Framework",
  TargetSegment: "Target Segment",
  TechStack: "Tech Stack",
  Visibility: "Visibility",
  GTMStrategy: "GTM Strategy",
  Goal: "Goal",
  FeatureScope: "Feature Scope",
  DistributionVector: "Distribution Vector",
  ProcessingEngine: "Processing Engine",
  UXResearchGrounding: "UX Research Grounding",
  Medium: "Medium",
  NeurologicalLayer: "Neurological Layer",
  TriggerVector: "Trigger Vector",
  UserBenefit: "User Benefit",
  UXCXBenefit: "UX/CX Benefit",
};

const RESERVED_NODE_KEYS = new Set([
  "id",
  "type",
  "title",
  "category",
  "icon",
  "bgColor",
  "canvasPosition",
]);

const RESERVED_LINK_KEYS = new Set([
  "id",
  "type",
  "source",
  "target",
  "derivedFrom",
]);

function extractUriId(uri: string): number {
  const match = uri.match(/:(\d+)$/);
  if (!match) {
    throw new Error(`Invalid JSON-LD node/link URI: "${uri}"`);
  }
  return Number(match[1]);
}

export function deserializeJsonLdToWorkflow(
  raw: unknown,
  targetWorkflowId: number,
): { nodes: WorkflowNode[]; links: WorkflowNodeLink[] } {
  const doc = raw as Partial<JsonLdWorkflowDocument>;

  if (!doc || doc.type !== "WorkflowGraph" || !Array.isArray(doc.graph)) {
    throw new Error(
      'Invalid JSON-LD workflow: expected "@type": "WorkflowGraph" with a "@graph" array.',
    );
  }

  const nodes: WorkflowNode[] = [];
  const links: WorkflowNodeLink[] = [];

  for (const entity of doc.graph) {
    if (entity.type === "CausalLink") {
      const linkEntity = entity as JsonLdCausalLink;
      const linkId = extractUriId(linkEntity.id);
      const parent_id = extractUriId(linkEntity.source);
      const child_id = extractUriId(linkEntity.target);

      const metadata: WorkflowLinkMetadataItem[] = Object.entries(linkEntity)
        .filter(
          ([k, v]) => !RESERVED_LINK_KEYS.has(k) && v !== undefined && v !== "",
        )
        .map(([k, v]) => ({
          link_id: linkId,
          fieldname: TERM_TO_FIELDNAME[k] ?? k,
          value: String(v),
        }));

      links.push({
        id: linkId,
        workflow_id: targetWorkflowId,
        parent_id,
        child_id,
        metadata,
      });
    } else {
      const nodeEntity = entity as JsonLdWorkflowNode;
      const nodeId = extractUriId(nodeEntity.id);
      const node_type_id = TERM_TO_NODE_TYPE_ID[nodeEntity.type];

      const metadata: WorkflowNodeMetadataItem[] = Object.entries(nodeEntity)
        .filter(
          ([k, v]) => !RESERVED_NODE_KEYS.has(k) && v !== undefined && v !== "",
        )
        .map(([k, v]) => ({
          node_id: nodeId,
          fieldname: TERM_TO_FIELDNAME[k] ?? k,
          value: String(v),
        }));

      nodes.push({
        id: nodeId,
        workflow_id: targetWorkflowId,
        node_type_id,
        label: nodeEntity.title,
        x: nodeEntity.canvasPosition?.x,
        y: nodeEntity.canvasPosition?.y,
        metadata,
      });
    }
  }

  return { nodes, links };
}
