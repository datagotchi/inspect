"use client";

import React, { useState } from "react";
import Link from "next/link";
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

interface Note {
  id: number;
  text: string;
  emoji?: string;
  created_at: string;
  updated_at?: string;
  user_id: number;
  field_values?: FieldValue[];
}

interface ClientSidePageProps {
  initialNotes: Note[];
  availableFields: Field[];
}

export default function ClientSidePage({
  initialNotes,
  availableFields,
}: ClientSidePageProps) {
  const router = useRouter();
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Note Form State
  const [newText, setNewText] = useState("");
  const [selectedFields, setSelectedFields] = useState<
    { field_id: number; value: string }[]
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddFieldInput = (fieldId: number) => {
    if (selectedFields.some((f) => f.field_id === fieldId)) return;
    setSelectedFields([...selectedFields, { field_id: fieldId, value: "" }]);
  };

  const handleCreateNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/fieldnotes/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: newText,
          field_values: selectedFields.filter((f) => f.value.trim() !== ""),
        }),
      });

      if (res.ok) {
        const createdNote: Note = await res.json();

        // 1. Instantly update React state so the UI re-renders immediately
        setNotes((prevNotes) => [createdNote, ...(prevNotes || [])]);

        // 2. Reset form & close modal
        setNewText("");
        setSelectedFields([]);
        setIsModalOpen(false);

        // 3. Keep Server Component data in sync
        router.refresh();
      } else {
        alert("Failed to create note");
      }
    } catch (err) {
      console.error("Error creating note:", err);
      alert("Error creating note");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F4F4] text-[#111111] p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-black">
            Fieldnotes
          </h1>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-2.5 bg-[#EAEAEA] border border-[#CCCCCC] rounded-md text-[#111111] text-sm font-medium hover:bg-[#E0E0E0] transition-colors shadow-sm"
          >
            + New Fieldnote
          </button>
        </div>

        {/* Notes List */}
        {notes.length === 0 ? (
          <p className="text-gray-500">No fieldnotes found.</p>
        ) : (
          <div className="space-y-6">
            {notes.map((note) => (
              <div
                key={note.id}
                className="p-6 bg-[#FAF9F6] border border-[#E5E5E5] rounded-lg shadow-sm hover:border-[#D0D0D0] transition-all"
              >
                <div className="flex justify-between items-start gap-6 mb-4">
                  <Link
                    href={`/fieldnotes/${note.id}`}
                    className="text-[#C05621] text-lg font-normal leading-snug hover:underline flex-1"
                  >
                    {note.emoji ? `${note.emoji} ` : ""}
                    {note.text}
                  </Link>

                  <span className="text-xs text-[#C05621] underline whitespace-nowrap pt-1">
                    {note.created_at
                      ? new Date(note.created_at).toLocaleDateString("en-US", {
                          month: "2-digit",
                          day: "2-digit",
                          year: "numeric",
                        })
                      : "No date"}
                  </span>
                </div>

                {/* Field Values Badges */}
                {note.field_values && note.field_values.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-4 pt-2">
                    {note.field_values.map((fv) => (
                      <span
                        key={fv.id}
                        className="inline-flex items-center text-xs px-3 py-1 bg-[#EFEFEF] border border-[#DDDDDD] rounded-full text-[#222222]"
                      >
                        <span className="font-semibold text-[#8B0000] underline mr-1">
                          {fv.field?.name || `Field #${fv.field_id}`}:
                        </span>
                        <span className="text-[#8B0000] underline">
                          {fv.value}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Note Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
          }}
        >
          {/* Click outside backdrop listener */}
          <div
            className="absolute inset-0"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Dialog Box */}
          <div
            className="relative border border-[#E5E5E5] rounded-lg p-6 max-w-xl w-full shadow-2xl z-10"
            style={{
              backgroundColor: "#FAF9F6",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-[#111111]">
                Create Fieldnote
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-black text-lg font-bold px-2 py-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNote}>
              <textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="Write your note here..."
                rows={4}
                required
                className="w-full p-3 border border-[#CCCCCC] rounded mb-4 text-base focus:outline-none focus:ring-2 focus:ring-[#C05621] bg-white text-[#111111]"
              />

              {/* Attach Field Buttons */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-gray-700 mb-2">
                  Attach Fields:
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {availableFields.map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => handleAddFieldInput(f.id)}
                      className="text-xs px-2.5 py-1 bg-[#EAEAEA] border border-[#CCCCCC] rounded hover:bg-[#DDD] text-[#222222]"
                    >
                      + {f.name}
                    </button>
                  ))}
                </div>

                {/* Dynamic Selected Field Inputs */}
                {selectedFields.map((sf, idx) => {
                  const fieldDef = availableFields.find(
                    (f) => f.id === sf.field_id,
                  );
                  return (
                    <div
                      key={sf.field_id}
                      className="flex items-center gap-2 mb-2"
                    >
                      <span className="text-xs font-semibold w-24 text-right text-[#222222]">
                        {fieldDef?.name}:
                      </span>
                      <input
                        type="text"
                        value={sf.value}
                        onChange={(e) => {
                          const next = [...selectedFields];
                          next[idx].value = e.target.value;
                          setSelectedFields(next);
                        }}
                        placeholder="Value..."
                        className="flex-1 p-1.5 border border-[#CCCCCC] rounded text-xs focus:outline-none bg-white text-[#111111]"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedFields(
                            selectedFields.filter((_, i) => i !== idx),
                          )
                        }
                        className="text-red-600 text-xs px-1 font-bold"
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#E5E5E5]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs bg-[#EAEAEA] border border-[#CCCCCC] text-[#111111] rounded hover:bg-[#DDD] font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 text-xs bg-[#C05621] text-white rounded hover:bg-[#A0461B] font-medium shadow-sm"
                >
                  {isSubmitting ? "Saving..." : "Create Note"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
