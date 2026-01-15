import React, { useCallback } from "react";
import EasyEdit from "react-easy-edit";

import { useUserContext } from "../contexts/useUserContext";
import { useFieldTransferContext } from "../contexts/useFieldTransferContext";

const Field = ({ data, isStaged = false, deleteThisField = undefined }) => {
  const { api } = useUserContext();
  const { setNewNote, newNote, setUpdatedNote } = useFieldTransferContext();

  const handleSave = useCallback(
    async (newValue) => {
      if (isStaged) {
        // Update the local staged state in the context
        setNewNote({
          ...newNote,
          field_values: newNote.field_values.map((fv) =>
            fv.id === data.id ? { ...fv, value: newValue } : fv,
          ),
        });
      } else if (api?.fnToken) {
        const updatedField = await api.updateFieldValue(
          data.note_id,
          data.field_id,
          newValue,
        );
        data.value = updatedField.value;
      }
    },
    [isStaged, api?.fnToken, data.id, data.note_id, newNote.field_values],
  );

  return (
    <tr>
      <td>
        <strong>{data.name}:</strong>
      </td>
      <td>
        <div style={{ display: "flex" }}>
          <EasyEdit type="text" value={data.value} onSave={handleSave} />
          <button
            onClick={async () => {
              if (confirm("Are you sure?")) {
                if (isStaged && deleteThisField) {
                  setNewNote({
                    ...newNote,
                    field_values: newNote.field_values.filter(
                      (item) => item.id !== data.id,
                    ),
                  });
                } else {
                  const result = await deleteThisField();
                  setUpdatedNote(result);
                }
              }
            }}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#ff4d4f",
              fontSize: "1.2rem",
              padding: "0 5px",
            }}
            title="Remove field"
          >
            ×
          </button>
        </div>
      </td>
    </tr>
  );
};

export default Field;
