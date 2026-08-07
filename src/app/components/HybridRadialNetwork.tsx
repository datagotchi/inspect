import React, { useRef, useEffect } from "react";
import * as d3 from "d3";
import { HierarchyPointNode } from "d3-hierarchy";
import { Insight } from "../types";

interface CrossLink {
  sourceId: string;
  targetId: string;
  label: string;
}

interface HybridNetworkProps {
  data: Insight[];
  crossLinks: CrossLink[];
}

const HybridRadialNetwork: React.FC<HybridNetworkProps> = ({
  data,
  crossLinks,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) return;

    // Create a map for quick lookup and a synthetic root node.
    const insightMap = new Map(data.map((i) => [i.uid!, i]));
    const rootData: Partial<Insight> & { uid: string; title: string } = {
      uid: "synthetic-root",
      title: "All My Insights",
      children: data
        .filter(
          (i) =>
            !i.parents.some(
              (p) => p.parentInsight && insightMap.has(p.parentInsight.uid!),
            ),
        )
        .map((i) => ({
          childInsight: i,
          child_id: i.id!,
          parent_id: 0,
        })),
    };

    const getChildren = (d: Partial<Insight>) =>
      d.children
        ?.map((link) => insightMap.get(link.childInsight!.uid!))
        .filter((i): i is Insight => !!i);

    const width = 800;
    const radius = width / 2;
    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-radius, -radius, width, width]);

    svg.selectAll("*").remove();

    const tree = d3
      .cluster<Partial<Insight>>()
      .size([2 * Math.PI, radius - 100]);
    const root = tree(d3.hierarchy(rootData, getChildren));

    // 1. Draw Hierarchical Links (The "Structure")
    svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#555")
      .attr("stroke-opacity", 0.4)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkRadial<
            d3.HierarchyLink<Partial<Insight>>,
            HierarchyPointNode<Partial<Insight>>
          >()
          .angle((d) => d.x)
          .radius((d) => d.y),
      );

    // 2. Draw Nodes
    const node = svg
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr(
        "transform",
        (d) => `rotate(${(d.x * 180) / Math.PI - 90}) translate(${d.y},0)`,
      );
    // .attr("fill", (d) => (d.children ? "#2ecc71" : "#3498db"));

    node
      .append("circle")
      .attr("fill", (d) => (d.children ? "#2ecc71" : "#3498db"))
      .attr("r", 6);

    node
      .append("text")
      .attr("dy", "0.31em")
      .attr("x", (d) => (d.x < Math.PI ? 10 : -10))
      .attr("text-anchor", (d) => (d.x < Math.PI ? "start" : "end"))
      .attr("transform", (d) => (d.x >= Math.PI ? "rotate(180)" : null))
      .text((d) => d.data.title!)
      .attr("font-size", "12px")
      .attr("fill", "#ecf0f1");

    // 3. Draw Manual Cross-Links (The "Inference Bridge")
    // Note: This requires finding the x,y coordinates of the nodes by ID
    const nodeMap = new Map(root.descendants().map((d) => [d.data.uid, d]));

    svg
      .append("g")
      .attr("stroke", "#e74c3c") // Red for "Inference"
      .attr("stroke-dasharray", "4,4")
      .selectAll("path")
      .data(crossLinks)
      .join("path")
      .attr("d", (d) => {
        const source = nodeMap.get(d.sourceId);
        const target = nodeMap.get(d.targetId);
        if (!source || !target) return "";

        // Simple curve logic between radial points
        const x1 = source.y * Math.cos(source.x - Math.PI / 2);
        const y1 = source.y * Math.sin(source.x - Math.PI / 2);
        const x2 = target.y * Math.cos(target.x - Math.PI / 2);
        const y2 = target.y * Math.sin(target.x - Math.PI / 2);

        return `M${x1},${y1} Q 0,0 ${x2},${y2}`;
      });
  }, [data, crossLinks]);

  return (
    <svg ref={svgRef} style={{ background: "#2c3e50", borderRadius: "8px" }} />
  );
};

export default HybridRadialNetwork;
