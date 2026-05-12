import React from "react";
import { ToastProvider } from "@site/src/components/Toast";

// Wrap the site once so toast notifications are available everywhere.
export default function Root({ children }) {
  return <ToastProvider>{children}</ToastProvider>;
}
