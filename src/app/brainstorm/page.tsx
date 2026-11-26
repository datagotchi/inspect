"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ConceptEdge, ConceptNode } from "@/app/types";
import {
  createBrainstormNode,
  fetchBrainstormGraph,
  readBrainstormCache,
  updateBrainstormNode,
  writeBrainstormCache,
} from "./BrainstormAPIs";
import {
  COL_STEP,
  DragState,
  GRID_SIZE,
  handleBoardPointerDown,
  handleBoardPointerMove,
  handleBoardPointerUp,
  handleBoardWheel,
  handleConnectorPointerDown,
  handleLayoutDag,
  handleNodePointerDown,
  handlePromoteToWorkflow,
  MarqueeBox,
  NODE_HEIGHT,
  NODE_WIDTH,
  PanState,
  PendingLinkDrag,
  ROW_STEP,
  snapToGrid,
} from "./functions";

export default function BrainstormPage() {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement>(null);
  const noteSaveTimersRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});
  const hasHydratedRef = useRef(false);
  const nodeSeqRef = useRef(1);
  const edgeSeqRef = useRef(1);

  const [nodes, setNodes] = useState<ConceptNode[]>([]);
  const [edges, setEdges] = useState<ConceptEdge[]>([]);
  const [isLoadingGraph, setIsLoadingGraph] = useState(true);
  const [isPromoting, setIsPromoting] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);

  const [draftLabel, setDraftLabel] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);

  const [panState, setPanState] = useState<PanState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [marquee, setMarquee] = useState<MarqueeBox | null>(null);
  const [linkDrag, setLinkDrag] = useState<PendingLinkDrag | null>(null);

  useEffect(() => {
    let active = true;
    const timers = noteSaveTimersRef.current;

    const cached = readBrainstormCache();
    if (cached) {
      setNodes(cached.nodes);
      setEdges(cached.edges);
      if (cached.nodes.length > 0) {
        setSelectedIds([cached.nodes[0].id]);
      }
      setIsLoadingGraph(false);
    }

    fetchBrainstormGraph()
      .then((snapshot) => {
        if (!active) return;
        setNodes(snapshot.nodes);
        setEdges(snapshot.edges);
        setSyncError(null);
        setSelectedIds((prev) => {
          const validPrev = prev.filter((id) =>
            snapshot.nodes.some((n) => n.id === id),
          );
          if (validPrev.length > 0) return validPrev;
          return snapshot.nodes.length > 0 ? [snapshot.nodes[0].id] : [];
        });
      })
      .catch((err: unknown) => {
        if (!active) return;
        console.error("Failed to fetch brainstorm graph:", err);
        setSyncError("Could not load brainstorm items from database");
      })
      .finally(() => {
        if (active) {
          hasHydratedRef.current = true;
          setIsLoadingGraph(false);
        }
      });

    return () => {
      active = false;
      Object.values(timers).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!hasHydratedRef.current) return;
    writeBrainstormCache({ nodes, edges });
  }, [nodes, edges]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const activeNoteNode = useMemo(() => {
    if (selectedIds.length === 0) return null;
    const lastId = selectedIds[selectedIds.length - 1];
    return nodes.find((n) => n.id === lastId) ?? null;
  }, [nodes, selectedIds]);

  const marqueeBox = marquee
    ? {
        left: Math.min(marquee.startX, marquee.currX),
        top: Math.min(marquee.startY, marquee.currY),
        width: Math.abs(marquee.currX - marquee.startX),
        height: Math.abs(marquee.currY - marquee.startY),
      }
    : null;

  const isViewModified = pan.x !== 0 || pan.y !== 0 || zoom !== 1;
  const scaledGridSize = GRID_SIZE * zoom;

  return (
    <main className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 bg-white px-5 py-3">
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Brainstorm</h1>
          <p className="text-xs text-neutral-500">
            Trackpad pinch/scroll to zoom • Drag empty space to pan • Shift+Drag
            to box-select • Drag bottom dot to link
            {isLoadingGraph ? " • Loading concepts..." : ""}
            {syncError ? ` • ${syncError}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isViewModified && (
            <button
              type="button"
              onClick={() => {
                setPan({ x: 0, y: 0 });
                setZoom(1);
              }}
              className="rounded-md border border-neutral-300 bg-white px-2.5 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
            >
              Reset View ({Math.round(zoom * 100)}%)
            </button>
          )}

          <button
            type="button"
            onClick={() =>
              handleLayoutDag({
                nodes,
                edges,
                snapEnabled,
                setNodes,
                setPan,
                setSyncError,
              })
            }
            className="rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100"
          >
            Tidy the Graph
          </button>

          <label className="flex items-center gap-1.5 text-xs text-neutral-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={snapEnabled}
              onChange={(e) => setSnapEnabled(e.target.checked)}
              className="rounded border-neutral-300"
            />
            Snap to grid
          </label>

          {selectedIds.length > 0 && (
            <>
              <button
                type="button"
                disabled={isPromoting}
                onClick={() =>
                  handlePromoteToWorkflow({
                    nodes,
                    edges,
                    selectedSet,
                    isPromoting,
                    router,
                    setIsPromoting,
                    setSyncError,
                    setNodes,
                    setEdges,
                    setSelectedIds,
                  })
                }
                className="rounded-md border border-neutral-900 bg-amber-200 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300 disabled:opacity-50"
              >
                {isPromoting
                  ? "Promoting..."
                  : `Promote (${selectedIds.length}) to /workflows`}
              </button>
              <Link
                href="/causes"
                className="rounded-md border border-neutral-900 bg-amber-200 px-3 py-1.5 text-xs font-semibold text-neutral-950 hover:bg-amber-300"
              >
                Promote ({selectedIds.length}) to /causes
              </Link>
            </>
          )}
        </div>
      </header>

      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const trimmed = draftLabel.trim() || `Concept ${nodes.length + 1}`;
          const col = nodes.length % 5;
          const row = Math.floor(nodes.length / 5);
          const x = snapToGrid(48 + col * COL_STEP, snapEnabled);
          const y = snapToGrid(48 + row * ROW_STEP, snapEnabled);
          const tempId = `temp-n-${nodeSeqRef.current++}`;

          setNodes((prev) => [
            ...prev,
            { id: tempId, label: trimmed, note: "", x, y },
          ]);
          setSelectedIds([tempId]);
          setDraftLabel("");

          try {
            const created = await createBrainstormNode({
              label: trimmed,
              note: "",
              x,
              y,
            });
            setSyncError(null);
            setNodes((prev) =>
              prev.map((n) => (n.id === tempId ? created : n)),
            );
            setSelectedIds((prev) =>
              prev.map((id) => (id === tempId ? created.id : id)),
            );
          } catch (err) {
            console.error("Failed to create brainstorm node:", err);
            setSyncError("Created locally; failed to save concept to database");
          }
        }}
        className="flex flex-wrap items-center gap-2 border-b border-neutral-200 bg-white/90 px-5 py-2.5"
      >
        <input
          type="text"
          value={draftLabel}
          onChange={(e) => setDraftLabel(e.target.value)}
          placeholder="Add an untyped concept, question, or hunch..."
          className="w-full max-w-md rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm focus:border-neutral-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md border border-neutral-900 bg-amber-200 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-amber-300"
        >
          + Add Concept
        </button>

        <span className="ml-auto text-xs text-neutral-500">
          {Math.round(zoom * 100)}% · {nodes.length} concepts · {edges.length}{" "}
          links
          {selectedIds.length > 0 ? ` · ${selectedIds.length} selected` : ""}
        </span>
      </form>

      <div className="flex flex-1 min-h-0">
        <div
          ref={boardRef}
          onWheel={(e) =>
            handleBoardWheel(e, { boardRef, pan, zoom, setZoom, setPan })
          }
          onPointerDown={(e) =>
            handleBoardPointerDown(e, {
              boardRef,
              pan,
              zoom,
              setSelectedIds,
              setMarquee,
              setPanState,
            })
          }
          onPointerMove={(e) =>
            handleBoardPointerMove(e, {
              boardRef,
              nodes,
              pan,
              zoom,
              linkDrag,
              marquee,
              dragState,
              panState,
              setLinkDrag,
              setMarquee,
              setSelectedIds,
              setDragState,
              setNodes,
              setPan,
            })
          }
          onPointerUp={(e) =>
            handleBoardPointerUp(e, {
              boardRef,
              nodes,
              edges,
              pan,
              zoom,
              snapEnabled,
              edgeSeqRef,
              linkDrag,
              marquee,
              dragState,
              panState,
              setLinkDrag,
              setMarquee,
              setDragState,
              setPanState,
              setEdges,
              setNodes,
              setSyncError,
            })
          }
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(115, 115, 115, 0.25) 1px, transparent 1px)",
            backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
            backgroundPosition: `${pan.x}px ${pan.y}px`,
          }}
          className={`relative flex-1 overflow-hidden select-none ${
            panState ? "cursor-grabbing" : "cursor-grab"
          }`}
        >
          <div
            style={{
              transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})`,
              transformOrigin: "0 0",
            }}
            className="absolute inset-0"
          >
            <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
              {edges.map((edge) => {
                const source = nodes.find((n) => n.id === edge.from);
                const target = nodes.find((n) => n.id === edge.to);
                if (!source || !target) return null;

                return (
                  <line
                    key={edge.id}
                    x1={source.x + NODE_WIDTH / 2}
                    y1={source.y + NODE_HEIGHT}
                    x2={target.x + NODE_WIDTH / 2}
                    y2={target.y + NODE_HEIGHT / 2}
                    stroke="#525252"
                    strokeWidth={1.75}
                    strokeDasharray="4 3"
                  />
                );
              })}

              {linkDrag && (
                <line
                  x1={linkDrag.x1}
                  y1={linkDrag.y1}
                  x2={linkDrag.x2}
                  y2={linkDrag.y2}
                  stroke="#2563eb"
                  strokeWidth={2}
                />
              )}
            </svg>

            {marqueeBox && (
              <div
                style={{
                  left: marqueeBox.left,
                  top: marqueeBox.top,
                  width: marqueeBox.width,
                  height: marqueeBox.height,
                }}
                className="pointer-events-none absolute border border-blue-600 bg-blue-500/10"
              />
            )}

            {nodes.map((node) => {
              const isSelected = selectedSet.has(node.id);
              const isLinkingFrom = linkDrag?.fromId === node.id;

              return (
                <div
                  key={node.id}
                  onPointerDown={(e) =>
                    handleNodePointerDown(e, node, {
                      nodes,
                      selectedIds,
                      selectedSet,
                      setSelectedIds,
                      setDragState,
                    })
                  }
                  style={{
                    transform: `translate3d(${node.x}px, ${node.y}px, 0)`,
                    width: NODE_WIDTH,
                    minHeight: NODE_HEIGHT,
                    border: isLinkingFrom
                      ? "2px solid #2563eb"
                      : isSelected
                        ? "2px solid #0a0a0a"
                        : "1px solid #a3a3a3",
                    outline: isSelected
                      ? "2px solid rgba(10, 10, 10, 0.25)"
                      : "none",
                    outlineOffset: "2px",
                    backgroundColor: isLinkingFrom
                      ? "#eff6ff"
                      : isSelected
                        ? "#fef3c7"
                        : "#ffffff",
                    boxShadow: isSelected
                      ? "0 4px 12px rgba(0, 0, 0, 0.14)"
                      : "0 1px 2px rgba(0, 0, 0, 0.06)",
                  }}
                  className="group absolute top-0 left-0 cursor-grab active:cursor-grabbing rounded-lg px-3 py-2.5"
                >
                  <div className="text-sm font-medium pb-0 text-neutral-900 break-words">
                    {node.label}
                  </div>

                  <button
                    type="button"
                    aria-label={`Link from ${node.label}`}
                    title="Drag to another node to connect"
                    onPointerDown={(e) =>
                      handleConnectorPointerDown(e, node, {
                        boardRef,
                        pan,
                        zoom,
                        setLinkDrag,
                      })
                    }
                    style={{
                      position: "absolute",
                      left: "50%",
                      bottom: -7,
                      transform: "translateX(-50%)",
                      width: 14,
                      height: 14,
                      minWidth: 14,
                      minHeight: 14,
                      padding: 0,
                      borderRadius: "9999px",
                      backgroundColor: "#22c55e",
                      border: "2px solid #ffffff",
                      boxShadow: "0 0 0 1px rgba(0, 0, 0, 0.25)",
                      cursor: "crosshair",
                      lineHeight: 0,
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        <aside
          style={{ width: 288, minWidth: 288, maxWidth: 288 }}
          className="shrink-0 border-l border-neutral-200 bg-white p-4 flex flex-col gap-3"
        >
          <div className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
            Selected Concept
          </div>

          {activeNoteNode ? (
            <>
              <label className="flex flex-col gap-1 text-xs text-neutral-600">
                Label
                <input
                  type="text"
                  value={activeNoteNode.label}
                  onChange={(e) => {
                    const targetId = activeNoteNode.id;
                    const label = e.target.value;
                    setNodes((prev) =>
                      prev.map((node) =>
                        node.id === targetId ? { ...node, label } : node,
                      ),
                    );
                    const existingTimer = noteSaveTimersRef.current[targetId];
                    if (existingTimer) clearTimeout(existingTimer);
                    noteSaveTimersRef.current[targetId] = setTimeout(() => {
                      updateBrainstormNode(targetId, { label })
                        .then((saved) => {
                          setSyncError(null);
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === targetId ? { ...n, ...saved } : n,
                            ),
                          );
                        })
                        .catch((err) => {
                          console.error(
                            "Failed to persist brainstorm node patch:",
                            err,
                          );
                          setSyncError(
                            "Changes cached locally; database save failed",
                          );
                        });
                    }, 300);
                  }}
                  className="w-full rounded border border-neutral-300 px-2.5 py-1.5 text-sm text-neutral-900"
                />
              </label>

              <label className="flex flex-col gap-1 text-xs text-neutral-600">
                Why? / How? thoughts (optional)
                <textarea
                  rows={5}
                  value={activeNoteNode.note ?? ""}
                  onChange={(e) => {
                    const targetId = activeNoteNode.id;
                    const note = e.target.value;
                    setNodes((prev) =>
                      prev.map((node) =>
                        node.id === targetId ? { ...node, note } : node,
                      ),
                    );
                    const existingTimer = noteSaveTimersRef.current[targetId];
                    if (existingTimer) clearTimeout(existingTimer);
                    noteSaveTimersRef.current[targetId] = setTimeout(() => {
                      updateBrainstormNode(targetId, { note })
                        .then((saved) => {
                          setSyncError(null);
                          setNodes((prev) =>
                            prev.map((n) =>
                              n.id === targetId ? { ...n, ...saved } : n,
                            ),
                          );
                        })
                        .catch((err) => {
                          console.error(
                            "Failed to persist brainstorm node patch:",
                            err,
                          );
                          setSyncError(
                            "Changes cached locally; database save failed",
                          );
                        });
                    }, 300);
                  }}
                  placeholder="Why does this matter? How could it work better?"
                  className="w-full rounded border border-neutral-300 p-2.5 text-xs text-neutral-800 focus:border-neutral-500 focus:outline-none"
                />
              </label>
            </>
          ) : (
            <div
              style={{ height: 220, overflowWrap: "anywhere" }}
              className="flex items-center justify-center rounded border border-dashed border-neutral-200 p-4 text-center text-xs leading-relaxed text-neutral-400 whitespace-normal break-words"
            >
              Click or box-select a concept to inspect or edit it.
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}
