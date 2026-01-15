// src/contexts/FieldTransferContext.js
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
} from "react";
import { useUserContext } from "./useUserContext";

const FieldTransferContext = createContext(undefined);

// TODO: If this context grows too big, split into FieldDefinitionContext and ActiveSelectionContext to prevent unnecessary re-renders.
export const FieldTransferProvider = ({ children }) => {
  const [fieldDefinitions, setFieldDefinitions] = useState();
  const [selectedField, setSelectedField] = useState();
  const [updatedNote, setUpdatedNote] = useState();
  // TODO: move to Typescript & ESLint to handle state variable object attributes
  const [newNote, setNewNote] = useState({ text: "", field_values: [] });

  // The "Transfer Payload"
  // TODO: move to Typescript & ESLint to handle state variable object attributes
  const [activeSelection, setActiveSelection] = useState({
    noteId: null,
    text: "",
    fullText: "",
    startIndex: 0,
    endIndex: 0,
  });

  const { api, isAuthenticated } = useUserContext();

  useEffect(() => {
    if (api?.fnToken && !fieldDefinitions) {
      api.getFields().then((fields) => {
        setFieldDefinitions(fields);
      });
    }
  }, [api?.fnToken, fieldDefinitions]);

  // Effect to clear this context's state on logout
  useEffect(() => {
    if (!isAuthenticated) {
      setFieldDefinitions(undefined);
      setSelectedField(undefined);
      setUpdatedNote(undefined);
      setNewNote({ text: "", field_values: [] });
      setActiveSelection({
        noteId: null,
        text: "",
        fullText: "",
        startIndex: 0,
        endIndex: 0,
      });
    }
  }, [isAuthenticated]);

  const alertCantUseExistingField = (fieldName) => {
    return alert(
      `This field (${fieldName}) is already used in this note. To edit it, click or tap on its value below.`
    );
  };

  const trimNoteFromSelection = useCallback(() => {
    if (activeSelection.text) {
      const textBefore = activeSelection.fullText.substring(
        0,
        activeSelection.startIndex
      );
      const textAfter = activeSelection.fullText.substring(
        activeSelection.endIndex
      );
      return textBefore + textAfter;
    }
  }, [activeSelection]);

  const handlePillClick = useCallback(
    async (e) => {
      const fieldName = e.currentTarget.childNodes[0].nodeValue;
      const field = fieldDefinitions?.find((fd) => fd.name === fieldName);
      if (field) {
        if (activeSelection.text && activeSelection.noteId && api?.fnToken) {
          try {
            const newNoteBody = trimNoteFromSelection();

            const apiResponseNote = await api.useField(
              activeSelection.noteId,
              field.id,
              activeSelection.text,
              newNoteBody
            );
            if (
              apiResponseNote &&
              Array.isArray(apiResponseNote.field_values)
            ) {
              apiResponseNote.field_values = apiResponseNote.field_values.map(
                (fv) => {
                  const fieldDef = fieldDefinitions?.find(
                    (fd) => fd.id === fv.field_id
                  );
                  return {
                    ...fv,
                    name: fieldDef ? fieldDef.name : "Unknown Field",
                  };
                }
              );
              setUpdatedNote({
                ...apiResponseNote,
                datetime: new Date().toISOString(),
              });

              setFieldDefinitions(
                fieldDefinitions?.map((fd) =>
                  fd.id === field.id
                    ? { ...fd, use_count: fd.use_count + 1 }
                    : fd
                )
              );

              clearSelection();
            }
          } catch (err) {
            const errorObj = err || {};
            if (errorObj.error?.code?.includes("SQLITE_CONSTRAINT_UNIQUE")) {
              return alertCantUseExistingField(field.name);
            }
          }
        } else if (activeSelection.text && !activeSelection.noteId) {
          // Stage the field for the NoteCreator
          const isDuplicate = newNote.field_values.some(
            (fv) => fv.field_id === field.id || fv.name === field.name
          );

          if (isDuplicate) {
            return alertCantUseExistingField(field.name);
          }

          const updatedText = trimNoteFromSelection();

          setNewNote({
            ...newNote,
            text: updatedText,
            field_values: [
              ...(newNote.field_values || []),
              {
                id: field.id,
                field_id: field.id,
                value: activeSelection.text,
                name: field.name,
              },
            ],
          });
        }
        clearSelection();
      }
    },
    [api?.fnToken, fieldDefinitions, activeSelection, newNote]
  );

  const handleTextareaSelection = (e) => {
    const textarea = e.target;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value.substring(start, end);
    if (value.length > 0) {
      // TODO: move to Typescript
      const selectionData = {
        noteId: textarea.dataset.noteId
          ? JSON.parse(textarea.dataset.noteId)
          : null,
        text: value,
        fullText: textarea.value,
        startIndex: start,
        endIndex: end,
      };
      setActiveSelection(selectionData);
    } else {
      setActiveSelection({ noteId: null, text: "" });
    }
  };

  const clearSelection = () =>
    setActiveSelection({
      noteId: null,
      text: "",
      fullText: "",
      startIndex: 0,
      endIndex: 0,
    });

  const contextValue = useMemo(
    () => ({
      fieldDefinitions,
      setFieldDefinitions,
      selectedField,
      setSelectedField,
      activeSelection,
      setActiveSelection,
      clearSelection,
      updatedNote,
      setUpdatedNote,
      handlePillClick,
      newNote,
      setNewNote,
      handleTextareaSelection,
    }),
    [fieldDefinitions, selectedField, activeSelection, updatedNote, newNote]
  );

  return (
    <FieldTransferContext.Provider value={contextValue}>
      {children}
    </FieldTransferContext.Provider>
  );
};

export const useFieldTransferContext = () => {
  const context = useContext(FieldTransferContext);
  return context ?? {};
};
