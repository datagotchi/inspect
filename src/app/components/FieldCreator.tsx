import React from "react";

import { useFieldTransferContext } from "../contexts/useFieldTransferContext";
import { useUserContext } from "../contexts/useUserContext";

const FieldCreator = () => {
  const {
    activeSelection,
    fieldDefinitions,
    setFieldDefinitions,
    clearSelection,
  } = useFieldTransferContext();
  const { api } = useUserContext();

  const handlePromotion = async () => {
    const field = await api.addField(activeSelection.text);

    setFieldDefinitions([...fieldDefinitions, field]);

    clearSelection();
  };

  return (
    <>
      {!activeSelection.text && (
        <em>Type and select text below to create a new field</em>
      )}
      {activeSelection.text && (
        <button
          onClick={handlePromotion}
          className="fixed bottom-20 right-4 bg-green-600 text-white px-4 py-2 rounded-full shadow-xl animate-bounce"
        >
          + Create Field: &quot;{activeSelection.text}&quot;
        </button>
      )}
    </>
  );
};

export default FieldCreator;
