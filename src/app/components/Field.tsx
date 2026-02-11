import React, { useCallback, useState } from "react";
// @ts-expect-error there is no d.ts file
import EasyEdit from "react-easy-edit";

import { useUserContext } from "../contexts/useUserContext";
import { useFieldTransferContext } from "../contexts/useFieldTransferContext";
import { FieldValue } from "../types";

interface Props {
  data: {
    id: number;
    name: string;
    value: string;
    note_id: number;
    field_id: number;
  };
  isStaged?: boolean;
  deleteThisField?: () => Promise<undefined>;
}

const Field = ({
  data,
  isStaged = false,
  deleteThisField = undefined,
}: Props) => {
  const [liveData, setLiveData] = useState(data);
  const { api } = useUserContext();
  const { setNewNote, newNote, setUpdatedNote } = useFieldTransferContext();

  const handleSave = useCallback(
    async (newValue: string) => {
      if (isStaged) {
        // Update the local staged state in the context
        setNewNote({
          ...newNote,
          field_values: newNote.field_values.map((fv: FieldValue) =>
            fv.id === data.id ? { ...fv, value: newValue } : fv,
          ),
        });
      } else if (api?.fnToken) {
        const updatedField = await api.updateFieldValue(
          data.note_id,
          data.field_id,
          newValue,
        );
        // data.value = updatedField.value;
        setLiveData({ ...liveData, value: updatedField.value });
      }
    },
    [
      isStaged,
      api,
      setNewNote,
      newNote,
      data.id,
      data.note_id,
      data.field_id,
      liveData,
    ],
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
                if (isStaged) {
                  setNewNote({
                    ...newNote,
                    field_values: newNote.field_values.filter(
                      (item: FieldValue) => item.id !== data.id,
                    ),
                  });
                } else if (deleteThisField) {
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
