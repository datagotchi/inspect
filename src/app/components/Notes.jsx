import React, { useEffect, useState } from "react";

import { styles } from "../syndicates/fieldnotes/constants";
import Note from "./note";
import { useUserContext } from "../contexts/useUserContext";
import { useFieldTransferContext } from "../contexts/useFieldTransferContext";

const Notes = () => {
  const [notes, setNotes] = useState();

  const { user, api } = useUserContext();
  const { fieldDefinitions, updatedNote, setUpdatedNote } =
    useFieldTransferContext();

  useEffect(() => {
    if (api.fnToken && fieldDefinitions && !notes) {
      api.getNotes().then((notes) => {
        const processedNotes = notes.map((n) => {
          n.field_values.forEach((fv) => {
            const fieldDefinition = fieldDefinitions.find(
              (fd) => fd.id === fv.field_id,
            );
            fv.name = fieldDefinition.name;
          });
          return n;
        });
        setNotes(processedNotes);
      });
    }
  }, [api?.fnToken, fieldDefinitions, notes]);

  useEffect(() => {
    if (updatedNote && notes) {
      const exists = notes.find((n) => n.id === updatedNote.id);

      if (exists) {
        setNotes(
          notes.map((n) => {
            if (n.id === updatedNote.id) {
              // Merge logic: keep existing fields, but replace if IDs match,
              // or append if the ID is new.
              const incomingField = updatedNote.field_values?.[0];
              const otherFields = n.field_values.filter(
                (fv) => fv.id !== incomingField?.id,
              );

              return {
                ...n, // Keep existing note data
                ...updatedNote, // Apply new text/updates
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
  }, [updatedNote, notes]);

  return (
    <ul style={styles.list}>
      {!notes ||
        (notes.length === 0 && (
          <li style={styles.empty}>No notes yet — add one above.</li>
        ))}
      {notes && (
        <p
          style={{
            fontSize: "smaller",
            fontColor: "#CCC",
            fontStyle: "italic",
          }}
        >
          Click or tap a note&apos;s text or field values to edit them
        </p>
      )}
      {notes &&
        notes
          .sort((a, b) => new Date(b.datetime) - new Date(a.datetime))
          .map((note) => {
            return (
              <Note
                user={user}
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
                fieldDefinitions={fieldDefinitions}
                key={`note: ${note.id}`}
              />
            );
          })}
    </ul>
  );
};

export default Notes;
