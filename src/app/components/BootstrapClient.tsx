"use client";

import { useEffect } from "react";

export default function BootstrapClient() {
  useEffect(() => {
    // FIXME: call .then().catch() to help with bootstraps init, supposedly?
    import("bootstrap");
  }, []);

  return null;
}
