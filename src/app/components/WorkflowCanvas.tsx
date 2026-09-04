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
    const treeLayout = d3
      .tree<any>()
      .size([width - 300, 250])
      .separation(() => 1.5);

    const root = treeLayout(hierarchyRoot);
    const realNodes = root.descendants().filter((d) => d.depth > 0);
    setTotalNodeCount(realNodes.length);

    // 2. Render Existing Links
    const linkGroup = zoomGroup.append("g").attr("class", "links");
    linkGroup
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2.5)
      .selectAll("path")
      .data(root.links().filter((l) => l.source.depth > 0)) // Exclude synthetic root links
      .join("path")
      .attr("d", (d) => {
        // 1. Calculate Source output point (bottom-center of Root card)
        const sourceX = d.source.x + 150;
        const sourceY = d.source.y + 80 + cardHeight; // Bottom of source card

        // 2. Calculate Target input point (top-center of Child card)
        const targetX = d.target.x + 150;
        const targetY = d.target.y + 80; // Top of target card

        // 3. Draw smooth cubic bezier curve between bottom handle and top of target
        const midY = (sourceY + targetY) / 2;
        return `M${sourceX},${sourceY} C${sourceX},${midY} ${targetX},${midY} ${targetX},${targetY}`;
      });

    // 3. Render Secondary DAG Links
    const d3NodeMap = new Map(
      root
        .descendants()
        .filter((d) => d.data.id)
        .map((d) => [d.data.id, d]),
    );

    if (crossLinks.length > 0) {
      zoomGroup
        .append("g")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .attr("fill", "none")
        .selectAll("path")
        .data(crossLinks)
        .join("path")
        .attr("d", (d) => {
          const source = d3NodeMap.get(d.sourceId);
          const target = d3NodeMap.get(d.targetId);
          if (!source || !target) return "";

          const x1 = source.x + 150;
          const y1 = source.y + 80;
          const x2 = target.x + 150;
          const y2 = target.y + 80;
          return `M${x1},${y1} Q ${(x1 + x2) / 2},${(y1 + y2) / 2 - 50} ${x2},${y2}`;
        });
    }

    // Interactive line drawn while dragging
    const dragLine = zoomGroup
      .append("path")
      .attr("class", "drag-line")
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4")
      .attr("visibility", "hidden");

    // 4. Render Nodes
    const nodeGroup = zoomGroup
      .append("g")
      .selectAll("g")
      .data(realNodes)
      .join("g")
      .attr(
        "transform",
        (d) => `translate(${d.x + 150 - cardWidth / 2}, ${d.y + 80})`,
      );

    nodeGroup
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
        const startX = d.x + 150;
        const startY = d.y + 80 + cardHeight / 2;
        const [mouseX, mouseY] = d3.pointer(event, zoomGroup.node());

        dragLine.attr(
          "d",
          `M${startX},${startY} C${startX},${(startY + mouseY) / 2} ${mouseX},${(startY + mouseY) / 2} ${mouseX},${mouseY}`,
        );
      })
      .on("end", (event, d) => {
        dragLine.attr("visibility", "hidden");

        const [dropX, dropY] = d3.pointer(event, zoomGroup.node());

        // Find drop target node
        const targetNode = realNodes.find((n) => {
          if (n.data.id === d.data.id) return false;
          const nx = n.x + 150 - cardWidth / 2;
          const ny = n.y + 80;
          return (
            dropX >= nx &&
            dropX <= nx + cardWidth &&
            dropY >= ny &&
            dropY <= ny + cardHeight
          );
        });

        if (targetNode && onLinkNodes) {
          onLinkNodes(d.data.id, targetNode.data.id);
        }
      });

    // Render handle on bottom of card
    nodeGroup
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
          Drag green bottom dots to connect nodes
        </span>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-[800px] cursor-grab bg-white border border-slate-300 rounded-lg"
      />
    </div>
  );
}
