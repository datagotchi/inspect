"use client";

import React from "react";

import HybridRadialNetwork from "@/app/components/HybridRadialNetwork";
import { Workflow } from "@/app/types";

interface Props {
  workflows: Workflow[];
}

export default function WorkflowClientPage({ workflows }: Props) {
  return (
    <div className="w-full h-full">
      <HybridRadialNetwork
        data={workflows}
        // onSelectionChange={setSelectedInsights}
      />
    </div>
  );
}
