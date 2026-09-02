import React from "react";

import { others, styles } from "../constants";
import { useUserContext } from "../contexts/useUserContext";
import { useFieldTransferContext } from "../contexts/useFieldTransferContext";
import FieldComponent from "./Field";
import { Field, FieldValue, Note } from "../types";

const NoteCreator = () => {
  const { api } = useUserContext();
  const {
    newNote,
    setNewNote,
    setUpdatedNote,
    activeSelection,
    handleTextareaSelection,
  } = useFieldTransferContext();

  const submitNewNote = async (note: Note) => {
    if (note.text || (note.field_values && note.field_values.length > 0)) {
      const addedNote = await api.addNote(note);
      addedNote.field_values = await Promise.all(
        newNote.field_values.map((fv: FieldValue) =>
          api
            .useField(addedNote.id, fv.field_id!, fv.value)
            .then((note) => note.field_values[0]),
        ),
      );
      setUpdatedNote(addedNote);
    }
  };

  return (
    <>
      <textarea
        value={newNote.text}
        onChange={(e) =>
          setNewNote({
            ...newNote,
            text: e.target.value,
          })
        }
        placeholder="Write a quick note..."
        style={styles.input}
        aria-label="New note"
        rows={others.noteCreator.rows}
        cols={others.noteCreator.cols}
        onSelect={handleTextareaSelection}
      />
      {activeSelection.text && !activeSelection.noteId && (
        <p>
          <strong>Selected text: </strong>
          {activeSelection.text}
        </p>
      )}
      {newNote.field_values.length > 0 && (
        <p style={{ margin: 0 }}>
          <strong>Custom Fields:</strong>
        </p>
      )}
      <table className="fieldTable" key="new note fieldTable">
        <tbody>
          {newNote.field_values.length > 0 &&
            newNote.field_values.map((fv: FieldValue & Field) => (
              <FieldComponent
                key={`new note field #${fv.id}`}
                data={fv}
                noteId={newNote.id}
                isStaged={true}
                deleteThisField={async () => {
                  setNewNote({
                    ...newNote,
                    field_values: newNote.field_values.filter(
                      (fv2: FieldValue) => fv2.id !== fv.id,
                    ),
                  });
                }}
              />
            ))}
        </tbody>
      </table>
      <button
        style={styles.button}
        onClick={async (e) => {
          e.preventDefault();
          await submitNewNote(newNote);
          setNewNote({ text: "", field_values: [] });
        }}
      >
        Add
      </button>
    </>
  );
};

export default NoteCreator;
