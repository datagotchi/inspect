import React from "react";

import { useFieldTransferContext } from "../contexts/useFieldTransferContext";

const NoteEditor = ({ note, setNote }) => {
  const handleChange = (e) => {
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
            fontColor: "#CCC",
            fontStyle: "italic",
          }}
        >
          Select text to move it to a field
        </p>
      )}
      <textarea
        rows="10"
        cols="100"
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
