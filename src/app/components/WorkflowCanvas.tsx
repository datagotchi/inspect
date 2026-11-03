"use client";

import React, { useRef, useEffect, useState } from "react";
import * as d3 from "d3";
import { WorkflowNode, WorkflowNodeLink } from "@/app/types";

import {
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
  nodes: WorkflowNode[];
  links: WorkflowNodeLink[];
  workflowCategory?: string;
  onNodeDragEnd?: (nodeId: number, x: number, y: number) => void;
  onDeleteNode?: (nodeId: number) => Promise<void>;
  onLinkNodes?: (parentId: number, childId: number) => Promise<void>;
  onEditNodeMetadata?: (node: WorkflowNode) => void;
  onEditLink?: (link: WorkflowNodeLink) => void;
  onDeleteLink?: (linkId: number) => Promise<void>;
}

export function WorkflowCanvas({
  nodes = [],
  links = [],
  workflowCategory,
  onNodeDragEnd,
  onDeleteNode,
  onLinkNodes,
  onEditNodeMetadata,
  onEditLink,
  onDeleteLink,
}: WorkflowCanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [totalNodeCount, setTotalNodeCount] = useState<number>(0);

  // d3 rendering effect
  useEffect(() => {
    if (!svgRef.current) return;

    const layout = processWorkflowLayout({
      nodes,
      links,
      category: workflowCategory,
    });

    if (!layout) {
      if (totalNodeCount !== 0) {
        setTotalNodeCount(0);
      }
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const { realNodes, primaryLinks, crossLinks, d3NodeMap } = layout;
    if (totalNodeCount !== realNodes.length) {
      setTotalNodeCount(realNodes.length);
    }

    const { zoomGroup } = setupCanvasZoom(svgRef.current);

    const primarySelection = renderPrimaryLinks(
      zoomGroup,
      primaryLinks,
      d3NodeMap,
      onEditLink,
      onDeleteLink,
      workflowCategory,
    );

    const secondarySelection = renderSecondaryLinks(
      zoomGroup,
      crossLinks,
      d3NodeMap,
      onEditLink,
      onDeleteLink,
      workflowCategory,
    );

    const dragLine = renderDragLine(zoomGroup);

    const nodeDragBehavior = createNodeDragBehavior(
      primarySelection,
      secondarySelection,
      d3NodeMap,
      onNodeDragEnd,
      workflowCategory,
    );

    const nodeSelection = renderNodes(
      zoomGroup,
      realNodes,
      nodeDragBehavior,
      onEditNodeMetadata,
      onDeleteNode,
    );

    const connectorDragBehavior = createConnectorHandleDragBehavior(
      zoomGroup,
      dragLine,
      realNodes,
      onLinkNodes,
      workflowCategory,
    );

    // Render Connector Handles (Positioned Right for GTM, Bottom for vertical)
    renderConnectorHandles(
      nodeSelection,
      connectorDragBehavior,
      workflowCategory,
    );
  }, [
    nodes,
    links,
    workflowCategory,
    onDeleteNode,
    onLinkNodes,
    onEditNodeMetadata,
    onEditLink,
    onDeleteLink,
    totalNodeCount,
    onNodeDragEnd,
  ]);

  return (
    <div className="w-full flex flex-col gap-2">
      <div className="text-xs font-semibold text-slate-600 px-2 flex items-center justify-between">
        <span>Showing {totalNodeCount} nodes across workflow</span>
        <span className="text-slate-400 font-normal">
          Drag nodes to arrange layout • Tap ✏️ to edit metadata • Click links
          to edit/delete
        </span>
      </div>
      <svg
        ref={svgRef}
        className="w-full h-[800px] cursor-grab bg-white border border-slate-300 rounded-lg"
      />
    </div>
  );
}
