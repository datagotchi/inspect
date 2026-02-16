import React from "react";

export const INSERT_LINK_DIALOG_ID = "insertLinkDialog";

export const TRASH_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z" />
    <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z" />
  </svg>
);

export type Override<T, K extends keyof T, R> = Omit<T, K> & { [P in K]: R };

import { CSSProperties } from "react";

export const styles: { [key: string]: CSSProperties } = {
  app: {
    fontFamily:
      "system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
    maxWidth: 720,
    margin: "36px auto",
    padding: 20,
    color: "#111",
  },
  header: { marginBottom: 16 },
  fieldsHeader: {
    position: "sticky",
    top: "0px", // Or the height of your Header
    zIndex: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    backdropFilter: "blur(5px)", // Modern "Glassmorphism" feel
    borderBottom: "1px solid #eaeaea",
    padding: "10px 0",
    marginBottom: "20px",
  },
  subtitle: { marginTop: 6, color: "#666" },
  main: {
    background: "#fff",
    borderRadius: 8,
    padding: 16,
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
  },
  form: { display: "flex", flexDirection: "column", marginBottom: 12 },
  input: {
    flex: 1,
    padding: "10px 12px",
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 16,
  },
  button: {
    padding: "10px 14px",
    borderRadius: 6,
    border: "none",
    background: "#0366d6",
    color: "#fff",
    cursor: "pointer",
    fontSize: 16,
  },
  list: { listStyle: "none", padding: 0, margin: 0 },
  empty: { color: "#666", padding: 12 },
  item: { padding: 12, borderBottom: "1px solid #f0f0f0" },
  itemText: {},
  itemMeta: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
    color: "#666",
  },
  delete: {
    background: "transparent",
    border: "none",
    color: "#d0342c",
    cursor: "pointer",
    fontSize: 16,
  },
  footer: { marginTop: 12, textAlign: "center", color: "#888" },
};

export const others = {
  noteCreator: {
    rows: 10,
    cols: 67,
  },
};

export const emojis = [
  { value: "🫀", label: "love" },
  { value: "🧠", label: "thoughtful" },
  { value: "😵‍💫", label: "overwhelmed" },
  { value: "🔋", label: "energized" },
  { value: "🔥", label: "excited" },
  { value: "⚙️", label: "focused" },
  { value: "🛡️", label: "protected" },
];
