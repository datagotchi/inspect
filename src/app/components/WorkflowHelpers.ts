/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { WorkflowNode, WorkflowNodeLink } from "@/app/types";

export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 80;
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export interface CanvasNode extends WorkflowNode {
  x?: number;
  y?: number;
}

export interface LinkData {
  id?: number;
  sourceId: number;
  targetId: number;
}

export interface WorkflowLayoutResult {
  realNodes: d3.HierarchyPointNode<CanvasNode>[];
  primaryLinks: LinkData[];
  crossLinks: LinkData[];
  root: d3.HierarchyPointNode<CanvasNode>;
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>;
}

export function calculatePrimaryPath(
  link: LinkData,
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
): string {
  const source = d3NodeMap.get(link.sourceId);
  const target = d3NodeMap.get(link.targetId);
  if (!source || !target) return "";

  const sourceX = source.x + CARD_WIDTH / 2;
  const sourceY = source.y + CARD_HEIGHT;
  const targetX = target.x + CARD_WIDTH / 2;
  const targetY = target.y;
  const midY = (sourceY + targetY) / 2;

  return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`;
}

export function calculateSecondaryPath(
  link: LinkData,
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
): string {
  const source = d3NodeMap.get(link.sourceId);
  const target = d3NodeMap.get(link.targetId);
  if (!source || !target) return "";

  const sourceX = source.x + CARD_WIDTH / 2;
  const sourceY = source.y + CARD_HEIGHT / 2;
  const targetX = target.x + CARD_WIDTH / 2;
  const targetY = target.y + CARD_HEIGHT / 2;

  return `M${sourceX},${sourceY} Q ${(sourceX + targetX) / 2},${(sourceY + targetY) / 2 - 50} ${targetX},${targetY}`;
}

export function processWorkflowLayout(
  nodes: WorkflowNode[],
): WorkflowLayoutResult | null {
  if (!nodes || nodes.length === 0) return null;

  const nodeMap = new Map<number, WorkflowNode>();
  nodes.forEach((n) => nodeMap.set(n.id, { ...n }));

  const primaryLinks: LinkData[] = [];
  const crossLinks: LinkData[] = [];

  // Identify nodes that act as explicit Validation/Audit Gates
  const isGateNode = (n?: WorkflowNode) => {
    const label = n?.label?.toLowerCase() || "";
    return (
      label.includes("gate") ||
      label.includes("audit") ||
      label.includes("validation")
    );
  };

  // 1. Classify Primary vs Cross-Links
  nodes.forEach((node) => {
    const parent = nodeMap.get(node.id);
    if (parent && parent.children && parent.children.length > 0) {
      const sorted = [...parent.children].sort(
        (a, b) => (a.id || 0) - (b.id || 0),
      );
      parent.children = sorted;

      sorted.forEach((link, index) => {
        const child = link.childNode || nodeMap.get(link.child_id);

        // Validation Gates ALWAYS produce primary (Blue) outputs for all their branches!
        // Standard nodes' first created link is also Primary (Blue).
        if (isGateNode(parent) || index === 0) {
          primaryLinks.push({
            id: link.id,
            sourceId: link.parent_id,
            targetId: link.child_id,
          });
        } else {
          // Secondary bypass/cross-link (Red)
          crossLinks.push({
            id: link.id,
            sourceId: link.parent_id,
            targetId: link.child_id,
          });
        }
      });
    }
  });

  // 2. Build root & tree hierarchy with all primary nodes
  const allChildIds = new Set<number>();
  primaryLinks.forEach((l) => allChildIds.add(l.targetId));

  const rootNodes = nodes.filter((n) => !allChildIds.has(n.id));

  const virtualRoot: WorkflowNode = {
    id: -999,
    label: "VIRTUAL_ROOT",
    children: (rootNodes.length > 0 ? rootNodes : nodes).map((n) => ({
      child_id: n.id,
      parent_id: -999,
      childNode: nodeMap.get(n.id),
    })),
  };

  const baseHierarchy = d3.hierarchy<CanvasNode>(
    virtualRoot as CanvasNode,
    (d) => {
      if (!d.children) return [];
      const seen = new Set<number>();
      const result: WorkflowNode[] = [];

      d.children.forEach((link: WorkflowNodeLink) => {
        const child = link.childNode || nodeMap.get(link.child_id);
        if (child && !seen.has(child.id)) {
          seen.add(child.id);
          result.push(child);
        }
      });
      return result;
    },
  );

  const treeLayout = d3
    .tree<CanvasNode>()
    .nodeSize([CARD_WIDTH + 60, CARD_HEIGHT + 80]);

  const root = treeLayout(baseHierarchy) as d3.HierarchyPointNode<CanvasNode>;

  const d3NodeMap = new Map<number, d3.HierarchyPointNode<CanvasNode>>();
  const realNodes: d3.HierarchyPointNode<CanvasNode>[] = [];

  const minX = d3.min(root.descendants(), (d) => d.x) || 0;
  const xOffset = CANVAS_WIDTH / 2 - minX - CARD_WIDTH / 2;
  const yOffset = 60;

  root.each((node) => {
    if (node.data && node.data.id !== -999 && node.data.id !== undefined) {
      if (!d3NodeMap.has(node.data.id)) {
        node.x = node.x + xOffset;
        node.y = node.y + yOffset;

        d3NodeMap.set(node.data.id, node);
        realNodes.push(node);
      }
    }
  });

  return {
    realNodes,
    primaryLinks,
    crossLinks,
    root,
    d3NodeMap,
  };
}

export function createNodeDragBehavior(
  primarySelection: d3.Selection<SVGPathElement, any, any, any>,
  secondarySelection: d3.Selection<SVGPathElement, any, any, any> | null,
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
) {
  return d3
    .drag<SVGGElement, d3.HierarchyPointNode<CanvasNode>>()
    .on("drag", (event, d) => {
      d.x += event.dx;
      d.y += event.dy;

      d3.select(event.sourceEvent.target.closest("g")).attr(
        "transform",
        `translate(${d.x}, ${d.y})`,
      );

      primarySelection.attr("d", (l: any) =>
        calculatePrimaryPath(l, d3NodeMap),
      );

      if (secondarySelection) {
        secondarySelection.attr("d", (cl: any) =>
          calculateSecondaryPath(cl, d3NodeMap),
        );
      }
    });
}

export function createConnectorHandleDragBehavior(
  zoomGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  dragLine: d3.Selection<SVGPathElement, unknown, null, undefined>,
  realNodes: d3.HierarchyPointNode<CanvasNode>[],
  onLinkNodes?: (parentId: number, childId: number) => Promise<void>,
) {
  return d3
    .drag<SVGCircleElement, d3.HierarchyPointNode<CanvasNode>>()
    .on("start", (event, d) => {
      event.sourceEvent.stopPropagation();
      const startX = d.x + CARD_WIDTH / 2;
      const startY = d.y + CARD_HEIGHT;
      dragLine
        .attr("d", `M${startX},${startY} L${startX},${startY}`)
        .attr("visibility", "visible");
    })
    .on("drag", (event, d) => {
      const startX = d.x + CARD_WIDTH / 2;
      const startY = d.y + CARD_HEIGHT;
      const [mouseX, mouseY] = d3.pointer(event, zoomGroup.node());
      dragLine.attr("d", `M${startX},${startY} L${mouseX},${mouseY}`);
    })
    .on("end", async (event, d) => {
      dragLine.attr("visibility", "hidden");
      const [mouseX, mouseY] = d3.pointer(event, zoomGroup.node());

      const targetNode = realNodes.find((n) => {
        if (n.data.id === d.data.id) return false;
        return (
          mouseX >= n.x &&
          mouseX <= n.x + CARD_WIDTH &&
          mouseY >= n.y &&
          mouseY <= n.y + CARD_HEIGHT
        );
      });

      if (targetNode && onLinkNodes) {
        await onLinkNodes(d.data.id, targetNode.data.id);
      }
    });
}
