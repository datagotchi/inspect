"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import * as d3 from "d3";

import { WorkflowNode, WorkflowNodeLink } from "@/app/types";
import { useWorkflowContext } from "@/app/contexts/WorkflowContext";

import {
  CARD_WIDTH,
  CARD_HEIGHT,
  processWorkflowLayout,
  setupCanvasZoom,
  renderPrimaryLinks,
  renderSecondaryLinks,
  renderDragLine,
  renderNodes,
  renderConnectorHandles,
  createNodeDragBehavior,
  createConnectorHandleDragBehavior,
  applySelectionHighlight,
} from "../WorkflowHelpers";

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
  const { setWorkflow, viewport, setViewport, isHydrated } =
    useWorkflowContext();
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [totalNodeCount, setTotalNodeCount] = useState<number>(0);
  const [selectedCount, setSelectedCount] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const selectedIdsRef = useRef<Set<number>>(new Set());

  // Sync native browser Fullscreen state (handles Esc key automatically)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  // Persist multi-node group drag locally to WorkflowContext + sessionStorage
  const handleBatchNodeDragEnd = useCallback(
    (updates: Array<{ id: number; x: number; y: number }>) => {
      if (updates.length === 0) return;

      const coordMap = new Map(updates.map((u) => [u.id, { x: u.x, y: u.y }]));
      const nowIso = new Date().toISOString();

      setWorkflow((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          updated_at: nowIso,
          nodes: (prev.nodes ?? []).map((n) => {
            const next = n.id !== undefined ? coordMap.get(n.id) : undefined;
            return next ? { ...n, x: next.x, y: next.y } : n;
          }),
        };
      });
    },
    [setWorkflow],
  );

  // D3 rendering effect
  useEffect(() => {
    if (!svgRef.current || !isHydrated) return;

    const layout = processWorkflowLayout({
      nodes,
      links,
      category: workflowCategory,
    });

    if (!layout) {
      if (totalNodeCount !== 0) setTotalNodeCount(0);
      d3.select(svgRef.current).selectAll("*").remove();
      return;
    }

    const { realNodes, primaryLinks, crossLinks, d3NodeMap } = layout;
    if (totalNodeCount !== realNodes.length) {
      setTotalNodeCount(realNodes.length);
    }

    const { svg, zoomGroup } = setupCanvasZoom(
      svgRef.current,
      viewport,
      setViewport,
    );

    const primarySelection = renderPrimaryLinks(
      zoomGroup,
      primaryLinks,
      d3NodeMap,
      onEditLink,
      onDeleteLink,
    );

    const secondarySelection = renderSecondaryLinks(
      zoomGroup,
      crossLinks,
      d3NodeMap,
      onEditLink,
      onDeleteLink,
    );

    const dragLine = renderDragLine(zoomGroup);

    const nodeDragBehavior = createNodeDragBehavior(
      zoomGroup,
      realNodes,
      selectedIdsRef,
      primarySelection,
      secondarySelection,
      d3NodeMap,
      onNodeDragEnd,
      handleBatchNodeDragEnd,
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
    );

    renderConnectorHandles(nodeSelection, connectorDragBehavior);
    applySelectionHighlight(zoomGroup, selectedIdsRef.current);

    // Shift+Drag draws marquee box-select; plain click on empty space clears selection
    svg.on("mousedown.marquee", (event: MouseEvent) => {
      if (event.button !== 0) return;

      const target = event.target as Element;
      if (target.closest(".workflow-node-group, circle, button")) return;

      // Plain mousedown without Shift: let d3.zoom pan, and clear selection on a stationary click
      if (!event.shiftKey) {
        const downClientX = event.clientX;
        const downClientY = event.clientY;
        const handlePlainMouseUp = (upEvent: MouseEvent) => {
          const moved = Math.hypot(
            upEvent.clientX - downClientX,
            upEvent.clientY - downClientY,
          );
          if (moved < 8 && selectedIdsRef.current.size > 0) {
            selectedIdsRef.current = new Set();
            setSelectedCount(0);
            applySelectionHighlight(zoomGroup, selectedIdsRef.current);
          }
          window.removeEventListener("mouseup", handlePlainMouseUp);
        };
        window.addEventListener("mouseup", handlePlainMouseUp);
        return;
      }

      const zoomNode = zoomGroup.node();
      if (!zoomNode) return;

      event.preventDefault();
      const startPt = d3.pointer(event, zoomNode);
      const marqueeRect = zoomGroup
        .append("rect")
        .attr("class", "selection-marquee")
        .attr("x", startPt[0])
        .attr("y", startPt[1])
        .attr("width", 0)
        .attr("height", 0)
        .attr("fill", "rgba(37, 99, 235, 0.08)")
        .attr("stroke", "#2563eb")
        .attr("stroke-width", 1.5)
        .attr("stroke-dasharray", "4,4")
        .style("pointer-events", "none");

      const handleWindowMouseMove = (moveEvent: MouseEvent) => {
        const [currX, currY] = d3.pointer(moveEvent, zoomNode);
        const minX = Math.min(startPt[0], currX);
        const minY = Math.min(startPt[1], currY);
        const width = Math.abs(currX - startPt[0]);
        const height = Math.abs(currY - startPt[1]);

        marqueeRect
          .attr("x", minX)
          .attr("y", minY)
          .attr("width", width)
          .attr("height", height);

        const nextSelected = new Set<number>();
        realNodes.forEach((n) => {
          if (
            n.data.id !== undefined &&
            n.x < minX + width &&
            n.x + CARD_WIDTH > minX &&
            n.y < minY + height &&
            n.y + CARD_HEIGHT > minY
          ) {
            nextSelected.add(n.data.id);
          }
        });

        selectedIdsRef.current = nextSelected;
        applySelectionHighlight(zoomGroup, nextSelected);
      };

      const handleWindowMouseUp = () => {
        marqueeRect.remove();
        setSelectedCount(selectedIdsRef.current.size);
        window.removeEventListener("mousemove", handleWindowMouseMove);
        window.removeEventListener("mouseup", handleWindowMouseUp);
      };

      window.addEventListener("mousemove", handleWindowMouseMove);
      window.addEventListener("mouseup", handleWindowMouseUp);
    });

    return () => {
      svg.on("mousedown.marquee", null);
    };
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
    handleBatchNodeDragEnd,
    isHydrated,
    setViewport,
    viewport,
  ]);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? "w-screen h-screen bg-slate-50 p-4 flex flex-col gap-2"
          : "w-full flex flex-col gap-2"
      }
    >
      <div className="text-xs font-semibold text-slate-600 px-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>Showing {totalNodeCount} nodes across workflow</span>
          {selectedCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
              {selectedCount} selected (drag any selected card to move group)
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 font-normal hidden md:inline">
            Drag blank space to pan • Shift+Drag to box-select • Wheel to zoom
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="px-2.5 py-1 rounded border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-xs font-medium transition-colors"
            title={
              isFullscreen
                ? "Exit Full Screen (Esc)"
                : "Maximize Canvas to Full Screen"
            }
          >
            {isFullscreen ? "↙ Exit Full Screen" : "⛶ Full Screen"}
          </button>
        </div>
      </div>

      <div
        className={`relative w-full ${
          isFullscreen ? "flex-1 min-h-0" : "h-[800px]"
        }`}
      >
        {!isHydrated && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-white/90 border border-slate-300 rounded-lg">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
            <span className="text-xs font-medium text-slate-500">
              Restoring canvas layout...
            </span>
          </div>
        )}
        <svg
          ref={svgRef}
          className={`w-full h-full cursor-grab bg-white border border-slate-300 rounded-lg transition-opacity duration-150 ${
            isHydrated ? "opacity-100" : "opacity-0"
          }`}
        />
      </div>
    </div>
  );
}
