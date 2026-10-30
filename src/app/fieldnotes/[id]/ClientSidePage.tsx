"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface Field {
  id: number;
  name: string;
}

interface FieldValue {
  id?: number;
  field_id: number;
  value: string;
  field?: Field;
}

interface NoteDetail {
  id: number;
  text: string;
  emoji?: string;
  created_at?: string;
  updated_at?: string;
  user_id: number;
  field_values?: FieldValue[];
}

interface ClientSidePageProps {
  note: NoteDetail;
  availableFields: Field[];
}

export default function ClientSidePage({
  note: initialNote,
  availableFields,
}: ClientSidePageProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialNote.text);
  const [fieldValues, setFieldValues] = useState<FieldValue[]>(
    initialNote.field_values || [],
  );
  const [isSaving, setIsSaving] = useState(false);

  const handleAddField = (fieldId: number) => {
    if (fieldValues.some((fv) => fv.field_id === fieldId)) return;
    const fieldDef = availableFields.find((f) => f.id === fieldId);
    setFieldValues([
      ...fieldValues,
      { field_id: fieldId, value: "", field: fieldDef },
    ]);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/fieldnotes/notes/${initialNote.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          field_values: fieldValues.filter((fv) => fv.value.trim() !== ""),
        }),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        alert("Failed to save changes.");
      }
    } catch (err) {
      console.error("Error saving note:", err);
      alert("Error saving note.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this fieldnote?")) return;
    try {
      const res = await fetch(`/api/fieldnotes/notes/${initialNote.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/fieldnotes");
        router.refresh();
      } else {
        alert("Failed to delete note.");
      }
    } catch (err) {
      console.error("Error deleting note:", err);
      alert("Error deleting note.");
    }
  };

  const isEdited =
    initialNote.updated_at &&
    initialNote.created_at &&
    new Date(initialNote.updated_at).getTime() -
      new Date(initialNote.created_at).getTime() >
      1000;

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#111111] p-8 font-sans">
      <div className="max-w-3xl mx-auto bg-[#FAF9F6] border border-[#E5E5E5] rounded-lg p-6 shadow-sm">
        {/* Navigation & Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-[#C05621] hover:underline flex items-center gap-1"
          >
            ← Back to Fieldnotes
          </button>

          <div className="flex gap-2">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1 bg-[#EAEAEA] border border-[#CCCCCC] rounded text-xs text-[#222222] hover:bg-[#E0E0E0]"
                >
                  Edit Note
                </button>
                <button
                  onClick={handleDelete}
                  className="px-3 py-1 bg-red-100 border border-red-300 text-red-700 rounded text-xs hover:bg-red-200"
                >
                  Delete
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setText(initialNote.text);
                    setFieldValues(initialNote.field_values || []);
                  }}
                  className="px-3 py-1 bg-gray-200 rounded text-xs text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-3 py-1 bg-[#C05621] text-white rounded text-xs hover:bg-[#A0461B]"
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Creation Date & Edit Indicator */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs text-[#C05621] underline">
            {initialNote.created_at
              ? new Date(initialNote.created_at).toLocaleString()
              : "No date"}
          </span>
          {isEdited && (
            <span className="text-[10px] text-gray-400 italic">
              (Edited{" "}
              {new Date(initialNote.updated_at!).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
              )
            </span>
          )}
        </div>

        {/* Text Area vs Rendered Text */}
        {!isEditing ? (
          <div className="text-lg leading-relaxed whitespace-pre-wrap text-[#111111] mb-8">
            {initialNote.emoji ? `${initialNote.emoji} ` : ""}
            {text}
          </div>
        ) : (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full p-3 border border-gray-300 rounded mb-6 text-lg focus:outline-none focus:ring-2 focus:ring-[#C05621]"
          />
        )}

        {/* Attached Fields */}
        <div className="border-t border-[#E5E5E5] pt-4">
          <h2 className="text-xs font-bold text-[#222222] uppercase tracking-wider mb-3">
            Fields
          </h2>

          {isEditing && (
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="text-xs text-gray-500 self-center">
                Add field:
              </span>
              {availableFields.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleAddField(f.id)}
                  className="text-xs px-2 py-0.5 bg-[#EAEAEA] border border-[#CCCCCC] rounded hover:bg-[#DDD]"
                >
                  + {f.name}
                </button>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {fieldValues.map((fv, idx) => (
              <span
                key={fv.field_id}
                className="inline-flex items-center text-xs px-3 py-1 bg-[#EFEFEF] border border-[#DDDDDD] rounded-full text-[#222222]"
              >
                <span className="font-semibold text-[#8B0000] underline mr-1">
                  {fv.field?.name || `Field #${fv.field_id}`}:
                </span>
                {!isEditing ? (
                  <span className="text-[#8B0000] underline">{fv.value}</span>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    <input
                      type="text"
                      value={fv.value}
                      onChange={(e) => {
                        const next = [...fieldValues];
                        next[idx].value = e.target.value;
                        setFieldValues(next);
                      }}
                      className="bg-white border rounded px-1 text-xs text-[#111111] focus:outline-none w-28"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setFieldValues(fieldValues.filter((_, i) => i !== idx))
                      }
                      className="text-red-500 hover:text-red-700 ml-1 font-bold"
                    >
                      ×
                    </button>
                  </div>
                )}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
