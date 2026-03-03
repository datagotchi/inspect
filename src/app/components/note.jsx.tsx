import React, { useCallback } from "react";
import EasyEdit from "react-easy-edit";

import { emojis, styles } from "../syndicates/fieldnotes/constants";
import NoteEditor from "./NoteEditor";
import Field from "./Field";
import { useFieldTransferContext } from "../contexts/useFieldTransferContext";
import { useUserContext } from "../contexts/useUserContext";
import EmojiSelection from "./EmojiSelection";

const Note = ({ user, data, setData, removeNote }) => {
  const { fieldDefinitions } = useFieldTransferContext();

  const { api } = useUserContext();

  const getFieldLabel = useCallback(
    (fieldId) => {
      if (fieldDefinitions) {
        const fieldDefinition = fieldDefinitions.find(
          (fd) => fd.id === fieldId,
        );
        if (fieldDefinition) {
          return fieldDefinition.name;
        }
      }
    },
    [fieldDefinitions],
  );

  return (
    <li key={`note: ${data.id}`} style={styles.item}>
      <div
        style={{
          ...styles.itemText,
          whiteSpace: "pre-line",
          display: "flex",
          flexDirection: "col",
          gap: "5px",
        }}
      >
        <strong>Text:</strong>{" "}
        <EasyEdit
          type="textarea"
          inputAttributes={{ rows: 10, cols: 100 }}
          value={data.text}
          onSave={async (newValue) => {
            const changes = await api.updateNote({
              id: data.id,
              text: newValue,
            });
            // data.text = changes.text;
            setData({ ...data, text: changes.text });
          }}
          editComponent={
            <NoteEditor
              user={user}
              note={data}
              setNote={setData}
              fieldDefinitions={fieldDefinitions}
            />
          }
        />
      </div>

      {data.emoji && (
        <div>
          <strong>Reaction:</strong> {data.emoji} (
          {emojis.find((e) => e.value === data.emoji)?.label})
        </div>
      )}

      {/* <EmojiSelection
        noteId={data.id}
        onSelect={async (noteId, emoji) => {
          try {
            const updatedNote = await api.updateNote({
              id: noteId,
              emoji,
            });
            setData({ ...data, ...updatedNote });
          } catch (err) {
            console.error("Failed to save affective state:", err);
          }
        }}
      /> */}
      {data.field_values && data.field_values.length > 0 && (
        <>
          <p style={{ margin: 0 }}>
            <strong>Custom Fields:</strong>
          </p>
          <table className="fieldTable" key={`note #${data.id} fieldTable`}>
            <tbody>
              {data.field_values
                .sort((a, b) => a.id - b.id)
                .map((fv) => (
                  <Field
                    user={user}
                    data={{
                      ...fv,
                      name: getFieldLabel(fv.field_id ?? fv.id),
                      note_id: data.id,
                    }}
                    key={`note field #${fv.id}`}
                    deleteThisField={async () => {
                      await api.deleteField(data.id, fv.field_id);

                      setData({
                        ...data,
                        field_values: data.field_values.filter(
                          (item) => item.id !== fv.id,
                        ),
                      });
                    }}
                  />
                ))}
            </tbody>
          </table>
        </>
      )}
      <div style={styles.itemMeta}>
        <small>{new Date(data.datetime).toLocaleString()}</small>
        <button
          onClick={() => {
            if (confirm("Are you sure?")) {
              removeNote(data);
            }
          }}
          style={styles.delete}
        >
          Delete
        </button>
      </div>
    </li>
  );
};

export default Note;
