"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";

import { WorkflowNode } from "@/app/types";

interface WorkflowCanvasProps {
  data: WorkflowNode[];
  onLinkNodes?: (parentId: number, childId: number) => Promise<void>;
}

export function WorkflowCanvas({
  data = [],
  onLinkNodes,
}: WorkflowCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [totalNodeCount, setTotalNodeCount] = useState<number>(0);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) {
      setTotalNodeCount(0);
      return;
    }

    // 1. Build Node Lookup & Traversal Structure
    const nodeMap = new Map<number, WorkflowNode & { childrenNodes: any[] }>();
    data.forEach((item) => {
      if (item.id) nodeMap.set(item.id, { ...item, childrenNodes: [] });
    });

    const childVisited = new Set<number>();
    const crossLinks: { sourceId: number; targetId: number }[] = [];

    data.forEach((item) => {
      if (!item.id) return;
      const parentNode = nodeMap.get(item.id)!;

      if (Array.isArray(item.children)) {
        item.children.forEach((link) => {
          const childId = link.child_id;
          if (childId && nodeMap.has(childId)) {
            if (!childVisited.has(childId)) {
              parentNode.childrenNodes.push(nodeMap.get(childId));
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

    const syntheticRoot = {
      id: -1,
      title: "Root",
      childrenNodes: rootNodes,
    };

    const getChildren = (d: any) =>
      d.childrenNodes && d.childrenNodes.length > 0 ? d.childrenNodes : null;

    const width = 1000;
    const height = 800;
    const cardWidth = 160;
    const cardHeight = 70;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", [0, 0, width, height]);

    const zoomGroup = svg.append("g").attr("class", "zoom-container");

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => zoomGroup.attr("transform", event.transform));

    svg.call(zoomBehavior);

    const hierarchyRoot = d3.hierarchy(syntheticRoot, getChildren);

    // Increased horizontal/vertical node size and separation to prevent stacking
    const treeLayout = d3
      .tree<any>()
      .nodeSize([240, 160])
      .separation((a, b) => (a.parent === b.parent ? 1.2 : 1.8));

    const root = treeLayout(hierarchyRoot);
    const realNodes = root.descendants().filter((d) => d.depth > 0);
    setTotalNodeCount(realNodes.length);

    // Initial offset positions to center the tree in the SVG viewport
    realNodes.forEach((d) => {
      d.x = d.x + width / 2 - cardWidth / 2;
      d.y = d.y + 100;
    });

    // Helper functions for link paths
    const getPrimaryPath = (d: any) => {
      const sourceX = d.source.x + cardWidth / 2;
      const sourceY = d.source.y + cardHeight;
      const targetX = d.target.x + cardWidth / 2;
      const targetY = d.target.y;
      const midY = (sourceY + targetY) / 2;
      return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`;
    };

    const d3NodeMap = new Map(
      realNodes.filter((d) => d.data.id).map((d) => [d.data.id, d]),
    );

    const getSecondaryPath = (d: { sourceId: number; targetId: number }) => {
      const source = d3NodeMap.get(d.sourceId);
      const target = d3NodeMap.get(d.targetId);
      if (!source || !target) return "";

      const x1 = source.x + cardWidth / 2;
      const y1 = source.y + cardHeight / 2;
      const x2 = target.x + cardWidth / 2;
      const y2 = target.y + cardHeight / 2;
      return `M${x1},${y1} Q ${(x1 + x2) / 2},${(y1 + y2) / 2 - 50} ${x2},${y2}`;
    };

    // 2. Render Existing Tree Links
    const primaryLinkSelection = zoomGroup
      .append("g")
      .attr("class", "links")
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2.5)
      .selectAll("path")
      .data(root.links().filter((l) => l.source.depth > 0))
      .join("path")
      .attr("d", getPrimaryPath);

    // 3. Render Secondary DAG Links
    let secondaryLinkSelection: any = null;
    if (crossLinks.length > 0) {
      secondaryLinkSelection = zoomGroup
        .append("g")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .attr("fill", "none")
        .selectAll("path")
        .data(crossLinks)
        .join("path")
        .attr("d", getSecondaryPath);
    }

    // Interactive line drawn while dragging handle
    const dragLine = zoomGroup
      .append("path")
      .attr("class", "drag-line")
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4")
      .attr("visibility", "hidden");

    // 4. Render Nodes
    const nodeSelection = zoomGroup
      .append("g")
      .attr("class", "nodes")
      .selectAll("g")
      .data(realNodes)
      .join("g")
      .attr("class", "node")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .style("cursor", "move");

    // Enable Individual Node Dragging
    const dragNode = d3
      .drag<SVGGElement, any>()
      .on("drag", function (event, d) {
        d.x += event.dx;
        d.y += event.dy;
        d3.select(this).attr("transform", `translate(${d.x}, ${d.y})`);

        // Update link coordinates dynamically
        primaryLinkSelection.attr("d", getPrimaryPath);
        if (secondaryLinkSelection) {
          secondaryLinkSelection.attr("d", getSecondaryPath);
        }
      });

    nodeSelection.call(dragNode as any);

    nodeSelection
      .append("foreignObject")
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .append("xhtml:div")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .style("width", "100%")
      .style("height", "100%")
      .style("box-sizing", "border-box")
      .style("background-color", "#3498db")
      .style("color", "#ffffff")
      .style("border-radius", "8px")
      .style("padding", "8px 10px")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("text-align", "center")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.15)")
      .style("user-select", "none")
      .html(
        (d) =>
          `<div>${d.data.label || d.data.title || `Node #${d.data.id}`}</div>`,
      );

    // 5. Drag behavior on green output handle
    const handleDrag = d3
      .drag<SVGCircleElement, any>()
      .on("start", (event) => {
        event.sourceEvent.stopPropagation();
        dragLine.attr("visibility", "visible");
      })
      .on("drag", (event, d) => {
        event.sourceEvent.stopPropagation();
        const startX = d.x + cardWidth / 2;
        const startY = d.y + cardHeight;
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
            dropX <= n.x + cardWidth &&
            dropY >= n.y &&
            dropY <= n.y + cardHeight
          );
        });

        if (targetNode && onLinkNodes) {
          onLinkNodes(d.data.id, targetNode.data.id);
        }
      });

    // Render handle on bottom center of card
    nodeSelection
      .append("circle")
      .attr("cx", cardWidth / 2)
      .attr("cy", cardHeight)
      .attr("r", 6)
      .attr("fill", "#22c55e")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "crosshair")
      .call(handleDrag);
  }, [data, onLinkNodes]);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="text-xs font-semibold text-slate-600 px-2 flex items-center justify-between">
        <span>Showing {totalNodeCount} nodes across workflow</span>
        <span className="text-slate-400 font-normal">
          Drag nodes to arrange layout • Drag green bottom dots to connect nodes
        </span>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-[800px] cursor-grab bg-white border border-slate-300 rounded-lg"
      />
    </div>
  );
}
