"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { HierarchyPointNode } from "d3-hierarchy";
import { Insight } from "@/app/types"; // Adjust import path to your types file

interface RadialNetworkProps {
  data: Insight[];
}

export function RadialNetwork({ data = [] }: RadialNetworkProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [totalNodeCount, setTotalNodeCount] = useState<number>(0);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) {
      setTotalNodeCount(0);
      return;
    }

    const nodeMap = new Map<number, Insight & { childrenNodes: any[] }>();
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
              crossLinks.push({ sourceId: item.id!, targetId: childId });
            }
          }
        });
      }
    });

    const rootNodes = Array.from(nodeMap.values()).filter(
      (node) => node.id && !childVisited.has(node.id),
    );

    const syntheticRoot = {
      id: -1,
      title: "Root",
      childrenNodes: rootNodes,
    };

    const getChildren = (d: any) =>
      d.childrenNodes && d.childrenNodes.length > 0 ? d.childrenNodes : null;

    const width = 1000;
    const radius = width / 2;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    svg.attr("viewBox", [-radius, -radius, width, width]);

    const zoomGroup = svg.append("g").attr("class", "zoom-container");

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => zoomGroup.attr("transform", event.transform));

    svg.call(zoomBehavior);

    const hierarchyRoot = d3.hierarchy(syntheticRoot, getChildren);
    const treeLayout = d3
      .tree<any>()
      .size([2 * Math.PI, radius - 150])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / (a.depth || 1));

    const root = treeLayout(hierarchyRoot);
    root.each((d) => {
      d.y = d.depth * 180;
    });

    const realNodes = root.descendants().filter((d) => d.depth > 0);
    setTotalNodeCount(realNodes.length);

    zoomGroup
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.4)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links().filter((l) => l.source.depth > 0))
      .join("path")
      .attr(
        "d",
        d3
          .linkRadial<any, HierarchyPointNode<any>>()
          .angle((d) => d.x)
          .radius((d) => d.y),
      );

    const d3NodeMap = new Map(
      root
        .descendants()
        .filter((d) => d.data.id)
        .map((d) => [d.data.id, d]),
    );

    if (crossLinks.length > 0) {
      zoomGroup
        .append("g")
        .attr("stroke", "#e74c3c")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,4")
        .attr("fill", "none")
        .selectAll("path")
        .data(crossLinks)
        .join("path")
        .attr("d", (d) => {
          const source = d3NodeMap.get(d.sourceId);
          const target = d3NodeMap.get(d.targetId);
          if (!source || !target) return "";

          const x1 = source.y * Math.cos(source.x - Math.PI / 2);
          const y1 = source.y * Math.sin(source.x - Math.PI / 2);
          const x2 = target.y * Math.cos(target.x - Math.PI / 2);
          const y2 = target.y * Math.sin(target.x - Math.PI / 2);
          return `M${x1},${y1} Q 0,0 ${x2},${y2}`;
        });
    }

    const cardWidth = 160;
    const cardHeight = 70;

    const node = zoomGroup
      .append("g")
      .selectAll("g")
      .data(realNodes)
      .join("g")
      .attr("transform", (d) => {
        if (realNodes.length === 1) return "translate(0, 0)";
        const isLeft = d.x > Math.PI;
        const angle = (d.x * 180) / Math.PI - 90;
        return `rotate(${angle}) translate(${d.y},0) ${isLeft ? "rotate(180)" : ""}`;
      });

    node
      .append("foreignObject")
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .append("xhtml:div")
      .attr("xmlns", "http://www.w3.org/1999/xhtml")
      .style("width", "100%")
      .style("height", "100%")
      .style("box-sizing", "border-box")
      .style("background-color", "#9b59b6")
      .style("color", "#ffffff")
      .style("border-radius", "8px")
      .style("padding", "8px 10px")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("display", "flex")
      .style("flex-direction", "column")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("text-align", "center")
      .style("word-break", "break-word")
      .style("overflow", "hidden")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.15)")
      .html((d) => `<div>${d.data.title || "Untitled Insight"}</div>`);
  }, [data]);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="text-xs font-semibold text-slate-600 px-2 flex items-center justify-between">
        <span>Showing {totalNodeCount} nodes across insights map</span>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-[800px] cursor-grab bg-white border border-slate-300 rounded-lg"
      />
    </div>
  );
}
