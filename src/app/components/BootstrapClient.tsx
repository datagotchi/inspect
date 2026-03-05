"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // TODO: call .then().catch() to help with bootstraps init?
    import("bootstrap");
  }, []);

  return null;
}
