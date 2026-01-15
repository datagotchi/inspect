import React, { useMemo, useState } from "react";
import { emojis } from "../syndicates/fieldnotes/constants";

const EmojiSelection = ({ noteId, onSelect }) => {
  const [selectedEmoji, setSelectedEmoji] = useState("😀");

  return (
    <div className="emoji-selector" style={{ display: "flex", gap: "5px" }}>
      <strong>Select Reaction:</strong>{" "}
      <div className="emoji-picker flex gap-2 p-2 bg-slate-100 rounded-lg">
        {emojis.map((emojiObject) => (
          <button
            key={emojiObject.value}
            onClick={() => onSelect(noteId, emojiObject.value)}
            className="hover:scale-125 transition-transform text-xl"
            title={emojiObject.label.toUpperCase()}
          >
            {emojiObject.value}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiSelection;
