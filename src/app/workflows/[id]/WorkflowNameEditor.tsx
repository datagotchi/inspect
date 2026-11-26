"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWorkflowContext } from "@/app/contexts/WorkflowContext";

export function WorkflowNameEditor() {
  const { workflow, setWorkflow } = useWorkflowContext();
  const router = useRouter();

  const currentName = workflow?.name ?? "Untitled Workflow";
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(currentName);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft(currentName);
  }, [currentName]);

  if (!workflow) return null;

  const handleSave = async () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === currentName) {
      setDraft(currentName);
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Failed to rename workflow (${res.status})`);
      }

      setWorkflow((prev) => (prev ? { ...prev, name: trimmed } : prev));
      setIsEditing(false);
      router.refresh();
    } catch (err) {
      console.error(err);
      alert("Could not rename workflow. Check console for details.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isEditing) {
    return (
      <span className="inline-flex items-center gap-2">
        <input
          type="text"
          value={draft}
          autoFocus
          disabled={isSaving}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSave();
            if (e.key === "Escape") {
              setDraft(currentName);
              setIsEditing(false);
            }
          }}
          className="text-base font-bold text-slate-900 bg-white border border-blue-500 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="px-2.5 py-1 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={() => {
            setDraft(currentName);
            setIsEditing(false);
          }}
          disabled={isSaving}
          className="px-2 py-1 rounded border border-slate-300 bg-white text-slate-600 text-xs font-medium hover:bg-slate-100"
        >
          Cancel
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 group">
      <span
        onClick={() => setIsEditing(true)}
        className="cursor-pointer hover:text-blue-700 transition-colors"
        title="Click to rename workflow"
      >
        {currentName}
      </span>
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="opacity-60 group-hover:opacity-100 px-2 py-0.5 rounded border border-transparent hover:border-slate-300 hover:bg-slate-100 text-xs font-normal text-slate-600 transition-all"
        title="Rename workflow"
      >
        ✏️ Rename
      </button>
    </span>
  );
}
