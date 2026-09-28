"use client";

import { useEffect } from "react";
import { ErrorPage } from "../components/components";

export default function Err({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error crítico en la HomePage:", error);
  }, [error]);

  return (
    <ErrorPage
      message={`Hubo un problema al conectar con el servidor. ${error.message ?? "Unknown error"}`}
      onRetry={reset}
    />
  );
}
