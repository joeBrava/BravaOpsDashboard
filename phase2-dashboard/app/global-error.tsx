"use client";

import { useEffect } from "react";

/**
 * Root-level error boundary. Catches errors thrown in the root layout/template
 * (which segment-level `error.tsx` cannot wrap). It replaces the root layout
 * when active, so per the Next 16 docs it must render its own `<html>`/`<body>`
 * and cannot rely on layout-provided fonts/providers. Inline styles are used so
 * it renders correctly even if the stylesheet failed to load.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#f6f3ed",
          color: "#23232a",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
        }}
      >
        <div
          style={{
            maxWidth: "30rem",
            padding: "2.5rem 2rem",
            textAlign: "center",
            border: "1px dashed #ebe6dd",
            borderRadius: 15,
            backgroundColor: "#ffffff",
          }}
        >
          <h2 style={{ fontWeight: 800, fontSize: "1.25rem", margin: 0 }}>
            Something went wrong
          </h2>
          <p
            style={{
              marginTop: "0.5rem",
              fontSize: "0.85rem",
              fontWeight: 500,
              color: "#a2a6aa",
            }}
          >
            The dashboard hit an unexpected error. Try again in a moment.
          </p>
          <button
            type="button"
            onClick={() => unstable_retry()}
            style={{
              marginTop: "1.25rem",
              padding: "9px 16px",
              borderRadius: 10,
              border: "none",
              backgroundColor: "#7b43c4",
              color: "#ffffff",
              fontWeight: 600,
              fontSize: "0.8rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
