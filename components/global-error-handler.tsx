"use client";

import { useEffect } from "react";

export function GlobalErrorHandler() {
  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      if (event.message?.includes("image.png") || event.message?.includes("image input")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    const rejectionHandler = (event: PromiseRejectionEvent) => {
      const msg = event.reason?.message || event.reason?.toString() || "";
      if (msg.includes("image.png") || msg.includes("image input")) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("error", handler, true);
    window.addEventListener("unhandledrejection", rejectionHandler, true);

    return () => {
      window.removeEventListener("error", handler, true);
      window.removeEventListener("unhandledrejection", rejectionHandler, true);
    };
  }, []);

  return null;
}
