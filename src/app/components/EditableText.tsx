"use client";

import React, { useCallback, useState } from "react";
import useUser from "../hooks/useUser";

import { Insight } from "../types";

const EditableText = ({
  insight,
  apiRoot,
  fieldName,
  initialValue,
  as: Component = "h2",
  isTextarea = false,
  placeholder = "",
}: {
  insight: Insight;
  apiRoot?: string;
  fieldName: "title" | "description";
  initialValue?: string;
  as?: React.ElementType;
  isTextarea?: boolean;
  placeholder?: string;
}): React.JSX.Element => {
  const [text, setText] = useState(initialValue || "");
  const [isEditing, setIsEditing] = useState(false);
  const { token, user_id } = useUser();
  const updateText = useCallback(
    (newValue: string, token: string): Promise<Response> =>
      fetch(`${apiRoot}/${insight.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-access-token": token,
        },
        body: JSON.stringify({
          [fieldName]: newValue,
        }),
      }),
    [apiRoot, insight.uid, fieldName],
  );

  const EditComponent = isTextarea ? "textarea" : "input";

  return (
    <Component style={{ margin: 0 }}>
      {isEditing && (
        <EditComponent
          id={`${fieldName}BeingEdited`}
          style={{ margin: "0 auto", width: "100%" }}
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={isTextarea ? 4 : undefined}
          placeholder={placeholder}
        />
      )}
      {!isEditing && (
        <span>
          {text || <span className="text-text-tertiary">{placeholder}</span>}
          {user_id == insight.user_id && (
            <span
              style={{ cursor: "pointer" }}
              onClick={() => {
                setIsEditing(true);
              }}
            >
              &nbsp;🖊
            </span>
          )}
        </span>
      )}
      {isEditing && (
        <p>
          <button
            onClick={async () => {
              if (token && text !== initialValue) {
                const response = await updateText(text, token);
                if (response.status !== 200) {
                  throw response;
                }
              }
              setIsEditing(false);
            }}
            disabled={!text}
          >
            Submit
          </button>
          <button
            onClick={() => {
              setText(initialValue ?? "");
              setIsEditing(false);
            }}
          >
            Cancel
          </button>
        </p>
      )}
    </Component>
  );
};

export default EditableText;
