"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
  // attribute="class" + enableSystem={false} evita que next-themes inyecte
  // su propio script (que causa warning con Next.js 16 + Turbopack).
  // El script FOUC se inyecta manualmente en <head> vía next/script.
  return (
    <NextThemesProvider
      {...props}
      enableSystem={false}
      defaultTheme="dark"
      forcedTheme={undefined}
      themes={["light", "dark", "rosepine-dark", "rosepine-light"]}
    >
      {children}
    </NextThemesProvider>
  );
}
