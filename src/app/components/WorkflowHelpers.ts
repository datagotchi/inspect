import * as d3 from "d3";
import {
  WorkflowNode,
  WorkflowNodeLink,
  WorkflowNodeMetadataItem,
} from "@/app/types";

export interface CanvasNode extends WorkflowNode {
  x?: number;
  y?: number;
  metadata?: WorkflowNodeMetadataItem[];
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

export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 80;
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export function calculatePrimaryPath(
  link: LinkData,
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
): string {
  const source = d3NodeMap.get(link.sourceId);
  const target = d3NodeMap.get(link.targetId);
  if (
    !source ||
    !target ||
    source.x === undefined ||
    source.y === undefined ||
    target.x === undefined ||
    target.y === undefined
  ) {
    return "";
  }

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
  if (
    !source ||
    !target ||
    source.x === undefined ||
    source.y === undefined ||
    target.x === undefined ||
    target.y === undefined
  ) {
    return "";
  }

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
  nodes.forEach((n) => nodeMap.set(n.id!, { ...n }));

  const primaryLinks: LinkData[] = [];
  const crossLinks: LinkData[] = [];

  const isGateNode = (n?: WorkflowNode) => {
    const label = n?.label?.toLowerCase() || "";
    return (
      label.includes("gate") ||
      label.includes("audit") ||
      label.includes("validation")
    );
  };

  nodes.forEach((node) => {
    const parent = nodeMap.get(node.id!);
    if (parent && parent.children && parent.children.length > 0) {
      const sorted = [...parent.children].sort(
        (a, b) => (a.id || 0) - (b.id || 0),
      );
      parent.children = sorted;

      sorted.forEach((link, index) => {
        if (isGateNode(parent) || index === 0) {
          primaryLinks.push({
            id: link.id,
            sourceId: link.parent_id,
            targetId: link.child_id,
          });
        } else {
          crossLinks.push({
            id: link.id,
            sourceId: link.parent_id,
            targetId: link.child_id,
          });
        }
      });
    }
  });

  const allChildIds = new Set<number>();
  primaryLinks.forEach((l) => allChildIds.add(l.targetId));

  const rootNodes = nodes.filter((n) => !allChildIds.has(n.id!));

  const virtualRoot: WorkflowNode = {
    id: -999,
    label: "VIRTUAL_ROOT",
    children: (rootNodes.length > 0 ? rootNodes : nodes).map((n) => ({
      child_id: n.id!,
      parent_id: -999,
      childNode: nodeMap.get(n.id!),
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
        if (child && !seen.has(child.id!)) {
          seen.add(child.id!);
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

// Canvas Initialization & Zoom Helper
export function setupCanvasZoom(svgElement: SVGSVGElement) {
  const svg = d3.select(svgElement);
  svg.selectAll("*").remove();
  svg.attr("viewBox", `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);

  const zoomGroup = svg.append("g").attr("class", "zoom-container");
  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 3])
    .on("zoom", (e) => zoomGroup.attr("transform", e.transform));

  svg.call(zoomBehavior);
  return { svg, zoomGroup };
}

// Link Rendering Helpers
export function renderPrimaryLinks(
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  primaryLinksData: LinkData[],
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
) {
  return parentGroup
    .append("g")
    .attr("fill", "none")
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 2.5)
    .selectAll<SVGPathElement, LinkData>("path")
    .data(primaryLinksData)
    .join("path")
    .attr("d", (l) => calculatePrimaryPath(l, d3NodeMap));
}

export function renderSecondaryLinks(
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  crossLinksData: LinkData[],
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
) {
  if (!crossLinksData || crossLinksData.length === 0) return null;
  return parentGroup
    .append("g")
    .attr("stroke", "#ef4444")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4")
    .attr("fill", "none")
    .selectAll<SVGPathElement, LinkData>("path")
    .data(crossLinksData)
    .join("path")
    .attr("d", (d) => calculateSecondaryPath(d, d3NodeMap));
}

export function renderDragLine(
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
) {
  return parentGroup
    .append("path")
    .attr("fill", "none")
    .attr("stroke", "#22c55e")
    .attr("stroke-width", 2)
    .attr("stroke-dasharray", "4,4")
    .attr("visibility", "hidden");
}

// Node Drag Behavior
export function createNodeDragBehavior(
  primarySelection: d3.Selection<
    SVGPathElement,
    LinkData,
    SVGGElement,
    unknown
  >,
  secondarySelection: d3.Selection<
    SVGPathElement,
    LinkData,
    SVGGElement,
    unknown
  > | null,
  d3NodeMap: Map<number, d3.HierarchyPointNode<CanvasNode>>,
) {
  return d3
    .drag<SVGGElement, d3.HierarchyPointNode<CanvasNode>>()
    .filter((event) => {
      // Prevent drag initiation when tapping or clicking the edit button
      if (
        event.target &&
        (event.target as HTMLElement).closest(".node-edit-btn")
      ) {
        return false;
      }
      return !event.ctrlKey && event.button === 0;
    })
    .on("drag", (event, d) => {
      d.x += event.dx;
      d.y += event.dy;

      d3.select(event.sourceEvent.target.closest("g")).attr(
        "transform",
        `translate(${d.x}, ${d.y})`,
      );

      primarySelection.attr("d", (l: LinkData) =>
        calculatePrimaryPath(l, d3NodeMap),
      );

      if (secondarySelection) {
        secondarySelection.attr("d", (cl: LinkData) =>
          calculateSecondaryPath(cl, d3NodeMap),
        );
      }
    });
}

// Connector Handle Drag Behavior
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
        await onLinkNodes(d.data.id!, targetNode.data.id!);
      }
    });
}

// Node Cards Rendering Helper
export function renderNodes(
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  realNodes: d3.HierarchyPointNode<CanvasNode>[],
  dragBehavior: d3.DragBehavior<
    SVGGElement,
    d3.HierarchyPointNode<CanvasNode>,
    unknown
  >,
  onEditNodeMetadata?: (node: CanvasNode) => void,
) {
  const nodeSelection = parentGroup
    .append("g")
    .selectAll<SVGGElement, d3.HierarchyPointNode<CanvasNode>>("g")
    .data(realNodes)
    .join("g")
    .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
    .style("cursor", "move")
    .call(dragBehavior);

  const foreign = nodeSelection
    .append("foreignObject")
    .attr("width", CARD_WIDTH)
    .attr("height", CARD_HEIGHT);

  const div = foreign
    .append("xhtml:div")
    .style("width", "100%")
    .style("height", "100%")
    .style("position", "relative")
    .style("background-color", (d) => d.data.nodeType?.bg_color || "#3498DB")
    .style(
      "border",
      (d) => `2px solid ${d.data.nodeType?.bg_color || "#cbd5e1"}`,
    )
    .style("border-radius", "8px")
    .style("box-shadow", "0 2px 6px rgba(0, 0, 0, 0.08)")
    .style("display", "flex")
    .style("flex-direction", "column")
    .style("align-items", "center")
    .style("justify-content", "center")
    .style("padding", "8px")
    .style("box-sizing", "border-box");

  // Edit Metadata Button
  div
    .append("xhtml:button")
    .attr("class", "node-edit-btn")
    .style("position", "absolute")
    .style("top", "4px")
    .style("right", "4px")
    .style("background", "rgba(255, 255, 255, 0.85)")
    .style("border", "1px solid #cbd5e1")
    .style("border-radius", "4px")
    .style("padding", "2px 5px")
    .style("font-size", "11px")
    .style("cursor", "pointer")
    .style("line-height", "1")
    .attr("title", "Edit Node Metadata")
    .html("✏️")
    .on("click", (event, d) => {
      event.stopPropagation();
      if (onEditNodeMetadata) {
        onEditNodeMetadata(d.data);
      }
    });

  div
    .append("xhtml:div")
    .style("font-size", "20px")
    .style("line-height", "1")
    .style("margin-bottom", "4px")
    .text((d) => d.data.nodeType?.icon || "📌");

  div
    .append("xhtml:div")
    .style("font-size", "11px")
    .style("font-weight", "700")
    .style("line-height", "1.25")
    .style("color", "#1e293b")
    .style("text-align", "center")
    .text((d) => d.data.label || "");

  return nodeSelection;
}

// Connector Handle Rendering Helper
export function renderConnectorHandles(
  nodeSelection: d3.Selection<
    SVGGElement,
    d3.HierarchyPointNode<CanvasNode>,
    SVGGElement,
    unknown
  >,
  connectorDragBehavior: d3.DragBehavior<
    SVGCircleElement,
    d3.HierarchyPointNode<CanvasNode>,
    unknown
  >,
) {
  nodeSelection
    .append("circle")
    .attr("cx", CARD_WIDTH / 2)
    .attr("cy", CARD_HEIGHT)
    .attr("r", 6)
    .attr("fill", "#22c55e")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2)
    .style("cursor", "crosshair")
    .call(connectorDragBehavior);
}
