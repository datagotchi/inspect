import React from "react";

import { useFieldTransferContext } from "../contexts/useFieldTransferContext";
import FieldCreator from "./FieldCreator";

const FieldCloud = () => {
  const { fieldDefinitions, handlePillClick } = useFieldTransferContext();

  return (
    <>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "8px",
          marginBottom: "20px",
          padding: "10px",
          borderBottom: "1px solid #eee",
        }}
      >
        {fieldDefinitions &&
          fieldDefinitions.map((field) => (
            <span
              key={field.id || field.name}
              style={{
                backgroundColor: "#e1ecf4",
                color: "#39739d",
                padding: "4px 10px",
                borderRadius: "15px",
                fontSize: "12px",
                cursor: "pointer",
                border: "1px solid #7aa7c7",
              }}
              onClick={handlePillClick}
            >
              {field.name}
              <span style={{ opacity: 0.5, fontSize: "0.8rem" }}>
                ({field.use_count || 0})
              </span>
            </span>
          ))}
      </div>
      <div>
        <FieldCreator />
      </div>
    </>
  );
};

export default FieldCloud;
