/* eslint-disable @typescript-eslint/no-explicit-any */
import * as d3 from "d3";
import { WorkflowNode, WorkflowNodeType } from "@/app/types";

export type CanvasNode = Partial<WorkflowNode> & {
  id: number;
  title?: string;
  label?: string;
  nodeType?: WorkflowNodeType;
  childrenNodes?: CanvasNode[];
};

export interface CrossLink {
  sourceId: number;
  targetId: number;
}

export interface ProcessedLayout {
  realNodes: d3.HierarchyPointNode<CanvasNode>[];
  crossLinks: CrossLink[];
  root: d3.HierarchyPointNode<CanvasNode>;
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>;
}

export const CARD_WIDTH = 160;
export const CARD_HEIGHT = 70;
export const CANVAS_WIDTH = 1000;
export const CANVAS_HEIGHT = 800;

// ==========================================
// 1. DATA LAYOUT PROCESSING
// ==========================================

export function processWorkflowLayout(
  data: WorkflowNode[],
): ProcessedLayout | null {
  if (!data || data.length === 0) return null;

  const nodeMap = new Map<number, CanvasNode>();
  data.forEach((item) => {
    if (item.id) nodeMap.set(item.id, { ...item, childrenNodes: [] });
  });

  const childVisited = new Set<number>();
  const crossLinks: CrossLink[] = [];

  data.forEach((item) => {
    if (!item.id) return;
    const parentNode = nodeMap.get(item.id)!;

    if (Array.isArray(item.children)) {
      item.children.forEach((link) => {
        const childId = link.child_id;
        if (childId && nodeMap.has(childId)) {
          if (!childVisited.has(childId)) {
            parentNode.childrenNodes!.push(nodeMap.get(childId)!);
            childVisited.add(childId);
          } else {
            crossLinks.push({ sourceId: item.id, targetId: childId });
          }
        }
      });
    }
  });

  const rootNodes = Array.from(nodeMap.values()).filter(
    (node) => !childVisited.has(node.id),
  );

  const syntheticRoot: CanvasNode = {
    id: -1,
    title: "Root",
    childrenNodes: rootNodes,
  };

  const hierarchyRoot = d3.hierarchy<CanvasNode>(syntheticRoot, (d) =>
    d.childrenNodes && d.childrenNodes.length > 0 ? d.childrenNodes : null,
  );

  const treeLayout = d3
    .tree<CanvasNode>()
    .nodeSize([240, 160])
    .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8));

  const root = treeLayout(hierarchyRoot);
  const realNodes = root.descendants().filter((d) => d.depth > 0);

  realNodes.forEach((d) => {
    d.x = d.x + CANVAS_WIDTH / 2 - CARD_WIDTH / 2;
    d.y = d.y + 100;
  });

  const d3NodeMap = new Map(
    realNodes.filter((d) => d.data.id).map((d) => [d.data.id, d]),
  );

  return { realNodes, crossLinks, root, d3NodeMap };
}

// ==========================================
// 2. PATH GEOMETRY CALCULATION
// ==========================================

export function calculatePrimaryPath(
  d: d3.HierarchyPointLink<CanvasNode>,
): string {
  const sourceX = d.source.x + CARD_WIDTH / 2;
  const sourceY = d.source.y + CARD_HEIGHT;
  const targetX = d.target.x + CARD_WIDTH / 2;
  const targetY = d.target.y;
  const midY = (sourceY + targetY) / 2;
  return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`;
}

export function calculateSecondaryPath(
  d: CrossLink,
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
): string {
  const source = d3NodeMap.get(d.sourceId);
  const target = d3NodeMap.get(d.targetId);
  if (!source || !target) return "";

  const x1 = source.x + CARD_WIDTH / 2;
  const y1 = source.y + CARD_HEIGHT / 2;
  const x2 = target.x + CARD_WIDTH / 2;
  const y2 = target.y + CARD_HEIGHT / 2;
  return `M${x1},${y1} Q ${(x1 + x2) / 2},${(y1 + y2) / 2 - 50} ${x2},${y2}`;
}

// ==========================================
// 3. IMPERATIVE CONTROLLERS (BEHAVIORS)
// ==========================================

export function createNodeDragBehavior(
  primaryLinks: d3.Selection<any, any, any, any>,
  secondaryLinks: d3.Selection<any, any, any, any> | null,
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
) {
  return d3
    .drag<SVGGElement, d3.HierarchyPointNode<CanvasNode>>()
    .on("drag", function (event, d) {
      d.x += event.dx;
      d.y += event.dy;
      d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`);

      primaryLinks.attr("d", calculatePrimaryPath);
      if (secondaryLinks) {
        secondaryLinks.attr("d", (linkData: CrossLink) =>
          calculateSecondaryPath(linkData, d3NodeMap),
        );
      }
    });
}

export function createConnectorHandleDragBehavior(
  zoomGroup: d3.Selection<any, any, any, any>,
  dragLine: d3.Selection<any, any, any, any>,
  realNodes: d3.HierarchyPointNode<CanvasNode>[],
  onLinkNodes?: (parentId: number, childId: number) => Promise<void>,
) {
  return d3
    .drag<SVGCircleElement, d3.HierarchyPointNode<CanvasNode>>()
    .on("start", (event) => {
      event.sourceEvent.stopPropagation();
      dragLine.attr("visibility", "visible");
    })
    .on("drag", (event, d) => {
      event.sourceEvent.stopPropagation();
      const startX = d.x + CARD_WIDTH / 2;
      const startY = d.y + CARD_HEIGHT;
      const [mouseX, mouseY] = d3.pointer(event, zoomGroup.node());

      dragLine.attr(
        "d",
        `M${startX},${startY} C${startX},${(startY + mouseY) / 2} ${mouseX},${(startY + mouseY) / 2} ${mouseX},${mouseY}`,
      );
    })
    .on("end", (event, d) => {
      event.sourceEvent.stopPropagation();
      dragLine.attr("visibility", "hidden");

      const [dropX, dropY] = d3.pointer(event, zoomGroup.node());

      const targetNode = realNodes.find((n) => {
        if (n.data.id === d.data.id) return false;
        return (
          dropX >= n.x &&
          dropX <= n.x + CARD_WIDTH &&
          dropY >= n.y &&
          dropY <= n.y + CARD_HEIGHT
        );
      });

      if (targetNode && onLinkNodes) {
        onLinkNodes(d.data.id, targetNode.data.id);
      }
    });
}
