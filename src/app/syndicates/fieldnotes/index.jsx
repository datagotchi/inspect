import React from "react";
import { createRoot } from "react-dom/client";

import App from "./App";
import { UserProvider } from "./contexts/useUserContext";
import { FieldTransferProvider } from "./contexts/useFieldTransferContext";

const container = document.getElementById("root");
if (!container) {
  throw new Error(
    'Root element not found. Please ensure your HTML has <div id="root"></div>'
  );
}

createRoot(container).render(
  <UserProvider>
    <FieldTransferProvider>
      <App />
    </FieldTransferProvider>
  </UserProvider>
);
