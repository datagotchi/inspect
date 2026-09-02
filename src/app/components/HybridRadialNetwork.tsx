import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { HierarchyPointNode } from "d3-hierarchy";
import { Fact, Insight, InsightLink } from "../types";

interface CrossLink {
  sourceId: string;
  targetId: string;
  label: string;
}

interface HybridNetworkProps {
  data: Fact[];
  crossLinks: CrossLink[];
}

const HybridRadialNetwork: React.FC<HybridNetworkProps> = ({
  data,
  crossLinks,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [totalNodeCount, setTotalNodeCount] = useState<number>(0);

  useEffect(() => {
    if (!data || data.length === 0 || !svgRef.current) {
      setTotalNodeCount(0);
      return;
    }

    // Populate insightMap recursively
    const insightMap = new Map<string, Fact>();

    const populateMap = (items: Fact[]) => {
      for (const item of items) {
        if (item.uid && !insightMap.has(item.uid)) {
          insightMap.set(item.uid, item);
        }

        // if (item.children && item.children.length > 0) {
        //   const childNodes = item.children
        //     .map(
        //       (link: InsightLink) =>
        //         link.childInsight || (link as unknown as Insight),
        //     )
        //     .filter((c): c is Insight => !!c && typeof c === "object");
        //   populateMap(childNodes);
        // }
      }
    };

    populateMap(data);

    // Create synthetic root containing top-level root insights
    const rootData: Partial<Fact> /*& { uid: string; title: string }*/ = {
      uid: "synthetic-root",
      title: "All My Insights",
      // children: data
      //   .filter(
      //     (i) =>
      //       !i.parents ||
      //       i.parents.length === 0 ||
      //       !i.parents.some(
      //         (p) => p.parentInsight && insightMap.has(p.parentInsight.uid!),
      //       ),
      //   )
      //   .map((i) => ({
      //     childInsight: i,
      //     child_id: i.id!,
      //     parent_id: 0,
      //   })),
    };

    const getChildren = (d: Partial<Fact>) => {
      // if (!d.children || d.children.length === 0) return null;

      if (!d.children && !d.root_id) return null;
      if (d.children) {
        return d.children
          .map((link: InsightLink) => {
            const fallbackUid = (link as unknown as Partial<Insight>).uid;
            const childObj = link.childInsight
              ? insightMap.get(link.childInsight.uid!) || link.childInsight
              : fallbackUid
                ? insightMap.get(fallbackUid) || (link as unknown as Insight)
                : undefined;
            return childObj;
          })
          .filter((i: Insight): i is Insight => !!i && !!i.title);
      } else if (d.root_id) {
        // TODO:
        // get this node
        // get its children by recursing
        // return combined nodes
        return [];
      }
    };

    const width = 1000;
    const radius = width / 2;

    const svg = d3
      .select(svgRef.current)
      .attr("viewBox", [-radius, -radius, width, width]);

    svg.selectAll("*").remove();

    const zoomGroup = svg.append("g").attr("class", "zoom-container");

    const zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.2, 3])
      .on("zoom", (event) => {
        zoomGroup.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);

    const treeLayout = d3
      .tree<Partial<Fact>>()
      .size([2 * Math.PI, radius - 150])
      .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);

    const root = treeLayout(d3.hierarchy(rootData, getChildren));

    // Update state with total real nodes (excluding synthetic root)
    const realNodesCount = root.descendants().filter((d) => d.parent).length;
    setTotalNodeCount(realNodesCount);

    const levelRadiusStep = 180;
    root.each((d) => {
      d.y = d.depth * levelRadiusStep;
    });

    // 1. Draw Hierarchical Links
    zoomGroup
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "#64748b")
      .attr("stroke-opacity", 0.5)
      .attr("stroke-width", 1.5)
      .selectAll("path")
      .data(root.links())
      .join("path")
      .attr(
        "d",
        d3
          .linkRadial<
            d3.HierarchyLink<Partial<Fact>>,
            HierarchyPointNode<Partial<Fact>>
          >()
          .angle((d) => d.x)
          .radius((d) => d.y),
      );

    // 2. Draw Nodes
    const cardWidth = 160;
    const cardHeight = 70;

    const node = zoomGroup
      .append("g")
      .selectAll("g")
      .data(root.descendants())
      .join("g")
      .attr("transform", (d) => {
        if (!d.parent) return "translate(0,0)";
        const isRightHalf = d.x < Math.PI;
        const angle = (d.x * 180) / Math.PI - 90;
        return `rotate(${angle}) translate(${d.y},0) ${
          isRightHalf ? "" : "rotate(180)"
        }`;
      });

    node
      .append("foreignObject")
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .attr("x", (d) => {
        if (!d.parent) return -cardWidth / 2;
        return d.x < Math.PI ? 12 : -cardWidth - 12;
      })
      .attr("y", -cardHeight / 2)
      .append("xhtml:div")
      .style("width", "100%")
      .style("height", "100%")
      .style("box-sizing", "border-box")
      .style("background-color", (d) =>
        !d.parent ? "#27ae60" : d.children ? "#2ecc71" : "#3498db",
      )
      .style("color", "#ffffff")
      .style("border-radius", "8px")
      .style("padding", "10px 12px")
      .style("font-size", "11px")
      .style("font-weight", "600")
      .style("line-height", "1.3")
      .style("display", "flex")
      .style("align-items", "center")
      .style("justify-content", "center")
      .style("text-align", "center")
      .style("word-break", "break-word")
      .style("overflow", "hidden")
      .style("box-shadow", "0 2px 4px rgba(0,0,0,0.15)")
      .html((d) => d.data.title!);

    // 3. Draw Cross-Links
    const nodeMap = new Map(
      root
        .descendants()
        .filter((d) => d.data.uid)
        .map((d) => [d.data.uid!, d]),
    );

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
        const source = nodeMap.get(d.sourceId);
        const target = nodeMap.get(d.targetId);
        if (!source || !target) return "";

        const x1 = source.y * Math.cos(source.x - Math.PI / 2);
        const y1 = source.y * Math.sin(source.x - Math.PI / 2);
        const x2 = target.y * Math.cos(target.x - Math.PI / 2);
        const y2 = target.y * Math.sin(target.x - Math.PI / 2);

        return `M${x1},${y1} Q 0,0 ${x2},${y2}`;
      });
  }, [data, crossLinks]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* Node Count FYI Banner directly above the SVG canvas */}
      <div
        style={{
          fontSize: "12px",
          fontWeight: "600",
          color: "#475569",
          padding: "4px 8px",
          display: "flex",
          alignItems: "center",
          gap: "6px",
        }}
      >
        <span>
          Showing {totalNodeCount} total nodes across all network levels
        </span>
      </div>

      <svg
        ref={svgRef}
        style={{
          width: "100%",
          height: "100%",
          cursor: "grab",
          background: "#ffffff",
          border: "1px solid #cbd5e1",
          borderRadius: "8px",
        }}
      />
    </div>
  );
};

export default HybridRadialNetwork;
