"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/hooks/useTheme";
import { Button } from "../components";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        aria-label="Cambiar tema"
        className="p-2 text-body hover:text-main hover:bg-hover rounded-md transition-all duration-200 border border-border-subtle"
      >
        <span className="size-5 inline-block" />
      </button>
    );
  }

  return (
    <Button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label="Cambiar tema"
      svg={"daynight"}
      svgStyle="text-main"
      buttonBody="p-2 text-body hover:text-main hover:bg-hover rounded-md transition-all duration-200 border border-border-subtle"
    />
  );
}
