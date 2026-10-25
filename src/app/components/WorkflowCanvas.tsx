"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { WorkflowNode } from "@/app/types";

import {
  CanvasNode,
  processWorkflowLayout,
  setupCanvasZoom,
  renderPrimaryLinks,
  renderSecondaryLinks,
  renderDragLine,
  renderNodes,
  renderConnectorHandles,
  createNodeDragBehavior,
  createConnectorHandleDragBehavior,
} from "./WorkflowHelpers";

interface WorkflowCanvasProps {
  data: WorkflowNode[];
  onLinkNodes?: (parentId: number, childId: number) => Promise<void>;
  onEditNodeMetadata?: (node: CanvasNode) => void;
}

export function WorkflowCanvas({
  data = [],
  onLinkNodes,
  onEditNodeMetadata,
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

    const { realNodes, primaryLinks, crossLinks, d3NodeMap } = layout;
    setTotalNodeCount(realNodes.length);

    // Setup viewport & zoom
    const { zoomGroup } = setupCanvasZoom(svgRef.current);

    // Render Link Layers
    const primarySelection = renderPrimaryLinks(
      zoomGroup,
      primaryLinks,
      d3NodeMap,
    );
    const secondarySelection = renderSecondaryLinks(
      zoomGroup,
      crossLinks,
      d3NodeMap,
    );

    // Dynamic drag line for drawing connections
    const dragLine = renderDragLine(zoomGroup);

    // Node Drag Behavior
    const nodeDragBehavior = createNodeDragBehavior(
      primarySelection,
      secondarySelection,
      d3NodeMap,
    );

    // Render Nodes with edit button listener
    const nodeSelection = renderNodes(
      zoomGroup,
      realNodes,
      nodeDragBehavior,
      onEditNodeMetadata,
    );

    // Handle Drag Behavior
    const connectorDragBehavior = createConnectorHandleDragBehavior(
      zoomGroup,
      dragLine,
      realNodes,
      onLinkNodes,
    );

    // Render Bottom Green Connector Handles
    renderConnectorHandles(nodeSelection, connectorDragBehavior);
  }, [data, onLinkNodes, onEditNodeMetadata]);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="text-xs font-semibold text-slate-600 px-2 flex items-center justify-between">
        <span>Showing {totalNodeCount} nodes across workflow</span>
        <span className="text-slate-400 font-normal">
          Drag nodes to arrange layout • Tap ✏️ to edit metadata • Drag green
          bottom dots to connect nodes
        </span>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-[800px] cursor-grab bg-white border border-slate-300 rounded-lg"
      />
    </div>
  );
}
