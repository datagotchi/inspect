/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import * as d3 from "d3";
import { WorkflowNode, WorkflowNodeLink } from "@/app/types";

export interface LinkData {
  id?: number;
  sourceId: number;
  targetId: number;
  rawLink?: WorkflowNodeLink;
}

export interface WorkflowLayoutResult {
  realNodes: d3.HierarchyPointNode<WorkflowNode>[];
  primaryLinks: LinkData[];
  crossLinks: LinkData[];
  root: d3.HierarchyPointNode<WorkflowNode>;
  d3NodeMap: Map<number, d3.HierarchyPointNode<WorkflowNode>>;
}

export const CARD_WIDTH = 180;
export const CARD_HEIGHT = 80;
export const CANVAS_WIDTH = 1200;
export const CANVAS_HEIGHT = 800;

export function getViewportCenterCoords(viewport?: {
  x: number;
  y: number;
  k: number;
}): { x: number; y: number } {
  const vx = viewport?.x ?? CANVAS_WIDTH / 2;
  const vy = viewport?.y ?? 60;
  const vk = viewport?.k ?? 1;

  return {
    x: (CANVAS_WIDTH / 2 - vx) / vk - CARD_WIDTH / 2,
    y: (CANVAS_HEIGHT / 2 - vy) / vk - CARD_HEIGHT / 2,
  };
}

export function calculatePrimaryPath(
  link: LinkData,
  d3NodeMap: Map<number, d3.HierarchyPointNode<WorkflowNode>>,
  isGtm: boolean = false,
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

  if (isGtm) {
    // Horizontal layout: Source Right-Center -> Target Left-Center
    const sourceX = source.x + CARD_WIDTH;
    const sourceY = source.y + CARD_HEIGHT / 2;
    const targetX = target.x;
    const targetY = target.y + CARD_HEIGHT / 2;
    const midX = (sourceX + targetX) / 2;

    return `M${sourceX},${sourceY} C${midX},${sourceY} ${midX},${targetY} ${targetX},${targetY}`;
  }

  // Vertical layout: Source Bottom-Center -> Target Top-Center
  const sourceX = source.x + CARD_WIDTH / 2;
  const sourceY = source.y + CARD_HEIGHT;
  const targetX = target.x + CARD_WIDTH / 2;
  const targetY = target.y;
  const midY = (sourceY + targetY) / 2;

  return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`;
}

export function calculateSecondaryPath(
  link: LinkData,
  d3NodeMap: Map<number, d3.HierarchyPointNode<WorkflowNode>>,
  isGtm: boolean = false,
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

  if (isGtm) {
    return `M${sourceX},${sourceY} Q ${(sourceX + targetX) / 2 - 50},${(sourceY + targetY) / 2} ${targetX},${targetY}`;
  }

  return `M${sourceX},${sourceY} Q ${(sourceX + targetX) / 2},${(sourceY + targetY) / 2 - 50} ${targetX},${targetY}`;
}

export interface LayoutParams {
  nodes: WorkflowNode[];
  links: WorkflowNodeLink[];
  category?: string;
}

export function processWorkflowLayout({
  nodes,
  links,
}: LayoutParams): WorkflowLayoutResult | null {
  if (!nodes || nodes.length === 0) return null;

  const isGtm = false;

  const realNodesMap = new Map<number, WorkflowNode>();
  nodes.forEach((n) => realNodesMap.set(n.id!, { ...n }));

  // Find root nodes (nodes with no incoming links)
  const childSet = new Set<number>();
  links.forEach((l) => childSet.add(l.child_id));

  const rootCandidates = nodes.filter((n) => !childSet.has(n.id!));

  let virtualRoot: any;
  if (rootCandidates.length === 1) {
    virtualRoot = rootCandidates[0];
  } else {
    virtualRoot = {
      id: -1,
      label: "Virtual Root",
      children: rootCandidates,
    };
  }

  const rootHierarchy = d3.hierarchy<WorkflowNode>(virtualRoot, (d: any) => {
    if (d.id === -1) return d.children;
    const outgoing = links.filter((l) => l.parent_id === d.id);
    return outgoing.map((l) => realNodesMap.get(l.child_id)).filter(Boolean);
  });

  if (isGtm) {
    // Horizontal layout: height along Y, depth along X
    const treeLayout = d3
      .tree<WorkflowNode>()
      .nodeSize([CARD_HEIGHT + 40, CARD_WIDTH + 120]);

    treeLayout(rootHierarchy);

    // Swap and project coordinates
    rootHierarchy.each((node: any) => {
      const originalBreadthY = node.x;
      node.x = node.depth * (CARD_WIDTH + 120);
      node.y = originalBreadthY;
    });
  } else {
    // Standard top-down layout
    const treeLayout = d3
      .tree<WorkflowNode>()
      .nodeSize([CARD_WIDTH + 60, CARD_HEIGHT + 100]);

    treeLayout(rootHierarchy);
  }

  // Preserve manual (x, y) coordinates from state / sessionStorage
  rootHierarchy.each((node: any) => {
    if (
      node.data &&
      node.data.id !== -1 &&
      typeof node.data.x === "number" &&
      typeof node.data.y === "number"
    ) {
      node.x = node.data.x;
      node.y = node.data.y;
    }
  });

  const d3NodeMap = new Map<number, d3.HierarchyPointNode<WorkflowNode>>();
  const realNodesList: d3.HierarchyPointNode<WorkflowNode>[] = [];

  rootHierarchy.each((node: any) => {
    if (node.data && node.data.id !== -1) {
      d3NodeMap.set(node.data.id, node);
      realNodesList.push(node);
    }
  });

  const primaryLinks: LinkData[] = links.map((l) => ({
    id: l.id,
    sourceId: l.parent_id,
    targetId: l.child_id,
    rawLink: l,
  }));

  const crossLinks: LinkData[] = [];

  return {
    realNodes: realNodesList,
    primaryLinks,
    crossLinks,
    root: rootHierarchy as any,
    d3NodeMap,
  };
}

export function setupCanvasZoom(
  svgElement: SVGSVGElement,
  savedViewport?: { x: number; y: number; k: number },
  onViewportChange?: (vp: { x: number; y: number; k: number }) => void,
) {
  const svg = d3.select(svgElement);
  let zoomGroup = svg.select<SVGGElement>("g.zoom-container");
  const isFirstMount = zoomGroup.empty();

  if (isFirstMount) {
    svg.attr("viewBox", `0 0 ${CANVAS_WIDTH} ${CANVAS_HEIGHT}`);
    zoomGroup = svg.append("g").attr("class", "zoom-container");
  } else {
    zoomGroup.selectAll("*").remove();
  }

  const zoomBehavior = d3
    .zoom<SVGSVGElement, unknown>()
    .scaleExtent([0.2, 3])
    .filter((event) => {
      // Always allow wheel / trackpad pinch zoom
      if (event.type === "wheel") return true;
      // Reserve Shift+Drag on blank space for marquee box-selection;
      // normal left-click drag pans the canvas
      if (event.shiftKey) return false;
      return !event.ctrlKey && event.button === 0;
    })
    .on("zoom", (e) => zoomGroup.attr("transform", e.transform))
    .on("end", (e) => {
      if (onViewportChange) {
        onViewportChange({
          x: e.transform.x,
          y: e.transform.y,
          k: e.transform.k,
        });
      }
    });

  // Updates filter/handlers while preserving existing svgElement.__zoom state
  svg.call(zoomBehavior);

  if (isFirstMount) {
    const initialTransform = savedViewport
      ? d3.zoomIdentity
          .translate(savedViewport.x, savedViewport.y)
          .scale(savedViewport.k)
      : d3.zoomIdentity.translate(CANVAS_WIDTH / 2, 60);

    svg.call(zoomBehavior.transform, initialTransform);
  }

  return { svg, zoomGroup };
}

export function applySelectionHighlight(
  zoomGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  selectedIds: Set<number>,
) {
  zoomGroup
    .selectAll<
      SVGGElement,
      d3.HierarchyPointNode<WorkflowNode>
    >("g.workflow-node-group")
    .each(function (d) {
      const isSelected = d.data.id !== undefined && selectedIds.has(d.data.id);
      d3.select(this)
        .select("foreignObject > div")
        .style(
          "box-shadow",
          isSelected
            ? "0 0 0 3px #2563eb, 0 6px 16px rgba(37, 99, 235, 0.25)"
            : "0 2px 6px rgba(0, 0, 0, 0.08)",
        );
    });

  zoomGroup
    .selectAll<SVGPathElement, LinkData>("g.primary-links path")
    .attr("stroke", (l) =>
      selectedIds.has(l.sourceId) && selectedIds.has(l.targetId)
        ? "#1d4ed8"
        : "#3b82f6",
    )
    .attr("stroke-width", (l) =>
      selectedIds.has(l.sourceId) && selectedIds.has(l.targetId) ? 4.5 : 3.5,
    );
}

export function renderPrimaryLinks(
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  primaryLinksData: LinkData[],
  d3NodeMap: Map<number, d3.HierarchyPointNode<WorkflowNode>>,
  onEditLink?: (link: WorkflowNodeLink) => void,
  onDeleteLink?: (linkId: number) => Promise<void>,
) {
  const isGtm = false;
  const g = parentGroup.append("g").attr("class", "primary-links");

  // Render Optional Link Labels
  g.selectAll<SVGTextElement, LinkData>("text")
    .data(primaryLinksData.filter((l) => Boolean(getLinkLabel(l))))
    .join("text")
    .attr("x", (l) => {
      const src = d3NodeMap.get(l.sourceId);
      const tgt = d3NodeMap.get(l.targetId);
      return src && tgt ? (src.x + tgt.x + CARD_WIDTH) / 2 : 0;
    })
    .attr("y", (l) => {
      const src = d3NodeMap.get(l.sourceId);
      const tgt = d3NodeMap.get(l.targetId);
      return src && tgt ? (src.y + tgt.y + CARD_HEIGHT) / 2 : 0;
    })
    .attr("text-anchor", "middle")
    .attr("dy", "-4")
    .attr("fill", "#1e293b")
    .attr("font-size", "11px")
    .attr("font-weight", "600")
    .style("pointer-events", "none")
    .text((l) => getLinkLabel(l) || "");

  return g
    .attr("fill", "none")
    .attr("stroke", "#3b82f6")
    .attr("stroke-width", 3.5)
    .selectAll<SVGPathElement, LinkData>("path")
    .data(primaryLinksData)
    .join("path")
    .attr("d", (l) => calculatePrimaryPath(l, d3NodeMap, isGtm))
    .style("cursor", "pointer")
    .style("pointer-events", "stroke")
    .on("mousedown", (event) => event.stopPropagation())
    .on("click", async (event, d) => {
      event.stopPropagation();
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      if (onEditLink && d.rawLink) {
        onEditLink(d.rawLink);
      } else if (onDeleteLink && d.id !== undefined) {
        if (confirm(`Delete connection #${d.id}?`)) {
          onDeleteLink(d.id);
        }
      }
    });
}

export function renderSecondaryLinks(
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  crossLinksData: LinkData[],
  d3NodeMap: Map<number, d3.HierarchyPointNode<WorkflowNode>>,
  onEditLink?: (link: WorkflowNodeLink) => void,
  onDeleteLink?: (linkId: number) => Promise<void>,
) {
  if (!crossLinksData || crossLinksData.length === 0) return null;

  const isGtm = false;
  const g = parentGroup.append("g").attr("class", "secondary-links");

  // Render Optional Link Labels for Secondary Connections
  g.selectAll<SVGTextElement, LinkData>("text")
    .data(crossLinksData.filter((l) => Boolean(getLinkLabel(l))))
    .join("text")
    .attr("x", (l) => {
      const src = d3NodeMap.get(l.sourceId);
      const tgt = d3NodeMap.get(l.targetId);
      return src && tgt ? (src.x + tgt.x + CARD_WIDTH) / 2 : 0;
    })
    .attr("y", (l) => {
      const src = d3NodeMap.get(l.sourceId);
      const tgt = d3NodeMap.get(l.targetId);
      return src && tgt ? (src.y + tgt.y + CARD_HEIGHT) / 2 - 25 : 0;
    })
    .attr("text-anchor", "middle")
    .attr("dy", "-4")
    .attr("fill", "#dc2626")
    .attr("font-size", "11px")
    .attr("font-weight", "600")
    .style("pointer-events", "none")
    .text((l) => getLinkLabel(l) || "");

  return g
    .attr("stroke", "#ef4444")
    .attr("stroke-width", 3)
    .attr("stroke-dasharray", "4,4")
    .attr("fill", "none")
    .selectAll<SVGPathElement, LinkData>("path")
    .data(crossLinksData)
    .join("path")
    .attr("d", (d) => calculateSecondaryPath(d, d3NodeMap, isGtm))
    .style("cursor", "pointer")
    .style("pointer-events", "stroke")
    .on("mousedown", (event) => event.stopPropagation())
    .on("click", async (event, d) => {
      event.stopPropagation();
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      if (onEditLink && d.rawLink) {
        onEditLink(d.rawLink);
      } else if (onDeleteLink && d.id !== undefined) {
        if (confirm(`Delete connection #${d.id}?`)) {
          onDeleteLink(d.id);
        }
      }
    });
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

export function createNodeDragBehavior(
  zoomGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  realNodes: d3.HierarchyPointNode<WorkflowNode>[],
  selectedIdsRef: React.RefObject<Set<number>>,
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
  d3NodeMap: Map<number, d3.HierarchyPointNode<WorkflowNode>>,
  onNodeDragEnd?: (nodeId: number, x: number, y: number) => void,
  onBatchNodeDragEnd?: (
    updates: Array<{ id: number; x: number; y: number }>,
  ) => void,
) {
  const isGtm = false;

  return d3
    .drag<SVGGElement, d3.HierarchyPointNode<WorkflowNode>>()
    .filter((event) => {
      if (
        event.target &&
        (event.target as HTMLElement).closest(
          "button, .node-edit-btn, .node-delete-btn",
        )
      ) {
        return false;
      }
      return !event.ctrlKey && event.button === 0;
    })
    .on("drag", function (event, d) {
      const draggedId = d.data.id;
      const isGroupDrag =
        draggedId !== undefined &&
        selectedIdsRef.current.has(draggedId) &&
        selectedIdsRef.current.size > 1;

      if (isGroupDrag) {
        realNodes.forEach((n) => {
          if (
            n.data.id !== undefined &&
            selectedIdsRef.current.has(n.data.id)
          ) {
            n.x += event.dx;
            n.y += event.dy;
          }
        });

        zoomGroup
          .selectAll<SVGGElement, d3.HierarchyPointNode<WorkflowNode>>(
            "g.workflow-node-group",
          )
          .filter(
            (n) =>
              n.data.id !== undefined && selectedIdsRef.current.has(n.data.id),
          )
          .attr("transform", (n) => `translate(${n.x}, ${n.y})`);
      } else {
        d.x += event.dx;
        d.y += event.dy;
        d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`);
      }

      primarySelection.attr("d", (l: LinkData) =>
        calculatePrimaryPath(l, d3NodeMap, isGtm),
      );

      if (secondarySelection) {
        secondarySelection.attr("d", (cl: LinkData) =>
          calculateSecondaryPath(cl, d3NodeMap, isGtm),
        );
      }
    })
    .on("end", (_event, d) => {
      const draggedId = d.data.id;
      const isGroupDrag =
        draggedId !== undefined &&
        selectedIdsRef.current.has(draggedId) &&
        selectedIdsRef.current.size > 1;

      if (isGroupDrag && onBatchNodeDragEnd) {
        const updates = realNodes
          .filter(
            (n) =>
              n.data.id !== undefined && selectedIdsRef.current.has(n.data.id),
          )
          .map((n) => ({ id: n.data.id!, x: n.x, y: n.y }));
        onBatchNodeDragEnd(updates);
      } else if (onNodeDragEnd && draggedId !== undefined) {
        onNodeDragEnd(draggedId, d.x, d.y);
      }
    });
}

export function createConnectorHandleDragBehavior(
  zoomGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  dragLine: d3.Selection<SVGPathElement, unknown, null, undefined>,
  realNodes: d3.HierarchyPointNode<WorkflowNode>[],
  onLinkNodes?: (parentId: number, childId: number) => Promise<void>,
) {
  const isGtm = false;

  return d3
    .drag<SVGCircleElement, d3.HierarchyPointNode<WorkflowNode>>()
    .on("start", (event, d) => {
      event.sourceEvent.stopPropagation();
      const startX = isGtm ? d.x + CARD_WIDTH : d.x + CARD_WIDTH / 2;
      const startY = isGtm ? d.y + CARD_HEIGHT / 2 : d.y + CARD_HEIGHT;
      dragLine
        .attr("d", `M${startX},${startY} L${startX},${startY}`)
        .attr("visibility", "visible");
    })
    .on("drag", (event, d) => {
      const startX = isGtm ? d.x + CARD_WIDTH : d.x + CARD_WIDTH / 2;
      const startY = isGtm ? d.y + CARD_HEIGHT / 2 : d.y + CARD_HEIGHT;
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

export function renderNodes(
  parentGroup: d3.Selection<SVGGElement, unknown, null, undefined>,
  realNodes: d3.HierarchyPointNode<WorkflowNode>[],
  dragBehavior: d3.DragBehavior<
    SVGGElement,
    d3.HierarchyPointNode<WorkflowNode>,
    unknown
  >,
  onEditNodeMetadata?: (node: WorkflowNode) => void,
  onDeleteNode?: (nodeId: number) => Promise<void>,
) {
  const nodeSelection = parentGroup
    .append("g")
    .selectAll<SVGGElement, d3.HierarchyPointNode<WorkflowNode>>("g")
    .data(realNodes)
    .join("g")
    .attr("class", "workflow-node-group")
    .attr("data-node-id", (d) => d.data.id ?? "")
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

  const actionsDiv = div
    .append("xhtml:div")
    .style("position", "absolute")
    .style("top", "4px")
    .style("right", "4px")
    .style("display", "flex")
    .style("gap", "4px");

  actionsDiv
    .append("xhtml:button")
    .attr("class", "node-delete-btn")
    .style("background", "rgba(255, 255, 255, 0.85)")
    .style("border", "1px solid #fca5a5")
    .style("border-radius", "4px")
    .style("padding", "2px 5px")
    .style("font-size", "11px")
    .style("cursor", "pointer")
    .style("line-height", "1")
    .attr("title", "Delete Node")
    .html("🗑️")
    .on("mousedown", (event) => event.stopPropagation())
    .on("click", async (event, d) => {
      event.stopPropagation();
      if (onDeleteNode && d.data.id !== undefined) {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
        if (
          confirm(`Are you sure you want to delete node "${d.data.label}"?`)
        ) {
          onDeleteNode(d.data.id);
        }
      }
    });

  actionsDiv
    .append("xhtml:button")
    .attr("class", "node-edit-btn")
    .style("background", "rgba(255, 255, 255, 0.85)")
    .style("border", "1px solid #cbd5e1")
    .style("border-radius", "4px")
    .style("padding", "2px 5px")
    .style("font-size", "11px")
    .style("cursor", "pointer")
    .style("line-height", "1")
    .attr("title", "Edit Node Metadata")
    .html("✏️")
    .on("mousedown", (event) => event.stopPropagation())
    .on("click", async (event, d) => {
      event.stopPropagation();
      if (onEditNodeMetadata) {
        if (document.fullscreenElement) {
          await document.exitFullscreen();
        }
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

export function renderConnectorHandles(
  nodeSelection: d3.Selection<
    SVGGElement,
    d3.HierarchyPointNode<WorkflowNode>,
    SVGGElement,
    unknown
  >,
  connectorDragBehavior: d3.DragBehavior<
    SVGCircleElement,
    d3.HierarchyPointNode<WorkflowNode>,
    unknown
  >,
) {
  const isGtm = false;

  nodeSelection
    .append("circle")
    .attr("cx", isGtm ? CARD_WIDTH : CARD_WIDTH / 2)
    .attr("cy", isGtm ? CARD_HEIGHT / 2 : CARD_HEIGHT)
    .attr("r", 6)
    .attr("fill", "#22c55e")
    .attr("stroke", "#ffffff")
    .attr("stroke-width", 2)
    .style("cursor", "crosshair")
    .call(connectorDragBehavior);
}

function getLinkLabel(link: LinkData): string | null {
  if (!link.rawLink?.metadata) return null;
  const labelItem = link.rawLink.metadata.find(
    (item) => item.fieldname.toLowerCase() === "label",
  );
  return labelItem?.value || null;
}
