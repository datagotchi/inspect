import React, { useEffect, useState } from "react";

import { styles } from "../constants";
import NoteType from "./note";
import { useUserContext } from "../contexts/useUserContext";
import { useFieldTransferContext } from "../contexts/useFieldTransferContext";
import { Field, FieldValue, Note } from "../types";

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>();

  const { api } = useUserContext();
  const { fieldDefinitions, updatedNote, setUpdatedNote } =
    useFieldTransferContext();

  useEffect(() => {
    if (api.fnToken && fieldDefinitions && !notes) {
      api.getNotes().then((notes) => {
        const processedNotes = notes.map((n: Note) => {
          n.field_values?.forEach((fv: FieldValue & Field) => {
            const fieldDefinition = fieldDefinitions.find(
              (fd: Field) => fd.id === fv.field_id,
            );
            if (fieldDefinition) {
              fv.name = fieldDefinition.name;
            }
          });
          return n;
        });
        setNotes(processedNotes);
      });
    }
  }, [api, api.fnToken, fieldDefinitions, notes]);

  useEffect(() => {
    if (updatedNote && notes) {
      const exists = notes.find((n) => n.id === updatedNote.id);

      if (exists) {
        setNotes(
          notes.map((n) => {
            if (n.id === updatedNote.id) {
              const incomingField = updatedNote.field_values?.[0];
              const otherFields =
                n.field_values?.filter((fv) => fv.id !== incomingField?.id) ??
                [];

              return {
                ...n,
                ...updatedNote,
                field_values: incomingField
                  ? [...otherFields, incomingField]
                  : n.field_values,
              };
            }
            return n;
          }),
        );
      } else {
        setNotes([updatedNote, ...notes]);
      }
      setUpdatedNote(undefined);
    }
  }, [updatedNote, notes, setUpdatedNote]);

  return (
    <ul style={styles.list}>
      {(!notes || notes.length === 0) && (
        <li style={styles.empty}>No notes yet — add one above.</li>
      )}
      {notes && notes.length > 0 && (
        <p
          style={{
            fontSize: "smaller",
            color: "#CCC",
            fontStyle: "italic",
          }}
        >
          Click or tap a note&apos;s text or field values to edit them
        </p>
      )}
      {notes &&
        notes
          .slice()
          .sort(
            (a, b) =>
              new Date(b.created_at ?? b.updated_at ?? 0).getTime() -
              new Date(a.created_at ?? a.updated_at ?? 0).getTime(),
          )
          .map((note) => (
            <NoteType
              key={`note:${note.id}`}
              data={note}
              setData={(updatedNote) => {
                const updatedNotes = notes.map((n) =>
                  n.id === updatedNote.id ? updatedNote : n,
                );
                setNotes(updatedNotes);
              }}
              removeNote={async () => {
                await api.deleteNote(note);
                setNotes(notes.filter((n) => n.id !== note.id));
              }}
            />
          ))}
    </ul>
  );
};

export default Notes;
