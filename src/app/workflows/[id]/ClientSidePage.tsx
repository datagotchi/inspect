"use client";

import React from "react";

import { WorkflowProvider } from "@/app/contexts/WorkflowContext";
import { Workflow } from "@/app/types";
import WorkflowEditorView from "./WorkflowEditorView";

interface Props {
  workflow: Workflow;
}

export default function ClientSidePage({ workflow }: Props) {
  return (
    <WorkflowProvider initialWorkflow={workflow}>
      <WorkflowEditorView />
    </WorkflowProvider>
  );
}
