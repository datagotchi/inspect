/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { WorkflowNode } from "@/app/types";

import {
  CanvasNode,
  LinkData,
  processWorkflowLayout,
  calculatePrimaryPath,
  calculateSecondaryPath,
  createNodeDragBehavior,
  createConnectorHandleDragBehavior,
  CARD_WIDTH,
  CARD_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
} from "./WorkflowHelpers";

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
    if (!svgRef.current) return;

    const layout = processWorkflowLayout(data);
    if (!layout) {
      setTotalNodeCount(0);
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const {
      realNodes,
      primaryLinks: primaryLinksData,
      crossLinks,
      d3NodeMap,
    } = layout;
    setTotalNodeCount(realNodes.length);

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", [0, 0, CANVAS_WIDTH, CANVAS_HEIGHT]);

    const zoomGroup = svg.append("g").attr("class", "zoom-container");
    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (e) => zoomGroup.attr("transform", e.transform));
    svg.call(zoomBehavior);

    // Primary Links (Solid Blue) using link source/target IDs
    const primaryLinks = zoomGroup
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#3b82f6")
      .attr("stroke-width", 2.5)
      .selectAll<SVGPathElement, LinkData>("path")
      .data(primaryLinksData)
      .join("path")
      .attr("d", (l) => calculatePrimaryPath(l, d3NodeMap));

    // Secondary Cross Links (Dashed Red)
    let secondaryLinks = null;
    if (crossLinks && crossLinks.length > 0) {
      secondaryLinks = zoomGroup
        .append("g")
        .attr("stroke", "#ef4444")
        .attr("stroke-width", 2)
        .attr("stroke-dasharray", "4,4")
        .attr("fill", "none")
        .selectAll<SVGPathElement, LinkData>("path")
        .data(crossLinks)
        .join("path")
        .attr("d", (d) => calculateSecondaryPath(d, d3NodeMap));
    }

    const dragLine = zoomGroup
      .append("path")
      .attr("fill", "none")
      .attr("stroke", "#22c55e")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "4,4")
      .attr("visibility", "hidden");

    const nodeSelection = zoomGroup
      .append("g")
      .selectAll<SVGGElement, d3.HierarchyPointNode<CanvasNode>>("g")
      .data(realNodes)
      .join("g")
      .attr("transform", (d) => `translate(${d.x}, ${d.y})`)
      .style("cursor", "move")
      .call(createNodeDragBehavior(primaryLinks, secondaryLinks, d3NodeMap));

    nodeSelection
      .append("foreignObject")
      .attr("width", CARD_WIDTH)
      .attr("height", CARD_HEIGHT)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style(
        "background-color",
        (d: any) => d.data.nodeType?.bg_color || "#3498DB",
      )
      .style(
        "border",
        (d: any) => `2px solid ${d.data.nodeType?.border_color || "#cbd5e1"}`,
      )
      .style("border-radius", "8px")
      .style("box-shadow", "0 2px 6px rgba(0, 0, 0, 0.08)")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("padding", "8px")
      .style("box-sizing", "border-box")
      .html(
        (d: any) => `
      <div style="font-size: 20px; line-height: 1; margin-bottom: 4px;">
        ${d.data.nodeType?.icon || "📌"}
      </div>
      <div style="font-size: 11px; font-weight: 700; line-height: 1.25; color: #1e293b; text-align: center;">
        ${d.data.label || ""}
      </div>
    `,
      );

    nodeSelection
      .append("circle")
      .attr("cx", CARD_WIDTH / 2)
      .attr("cy", CARD_HEIGHT)
      .attr("r", 6)
      .attr("fill", "#22c55e")
      .attr("stroke", "#ffffff")
      .attr("stroke-width", 2)
      .style("cursor", "crosshair")
      .call(
        createConnectorHandleDragBehavior(
          zoomGroup,
          dragLine,
          realNodes,
          onLinkNodes,
        ),
      );
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
