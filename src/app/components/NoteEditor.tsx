import React from "react";

import { useFieldTransferContext } from "../contexts/useFieldTransferContext";
import { Note } from "../types";

interface Props {
  note: Note;
  setNote: (note: Note) => void;
}

const NoteEditor = ({ note, setNote }: Props) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNote({ ...note, text: e.target.value });
  };

  const { activeSelection, handleTextareaSelection } =
    useFieldTransferContext();

  return (
    <>
      {!activeSelection.text && (
        <p
          style={{
            fontSize: "smaller",
            color: "#CCC",
            fontStyle: "italic",
          }}
        >
          Select text to move it to a field
        </p>
      )}
      <textarea
        rows={10}
        cols={100}
        value={note.text}
        onChange={handleChange}
        data-note-id={note.id}
        onSelect={handleTextareaSelection}
      />
      {activeSelection.text && activeSelection.noteId && (
        <p>
          <strong>Selected text: </strong>
          {activeSelection.text}
        </p>
      )}
    </>
  );
};

export default NoteEditor;
