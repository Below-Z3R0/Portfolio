---
title: "Sistema SEO, metadata, fuentes y ErrorBoundary"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [seo, metadata, next-font, geist, error-boundary, app-error, layout, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El sistema de SEO del portfolio es **mínimo** (sin `sitemap.xml`, sin `robots.txt`, sin `metadata` dinámica por idioma). Solo tiene `metadata` estática en `app/layout.tsx` (title + description), y `lang="en"` hardcoded en el `<html>` (aunque el sitio es bilingüe ES/EN). Las fuentes son `Geist` y `Geist_Mono` cargadas vía `next/font/google` (optimización built-in de Next.js). El ErrorBoundary vive en `app/error.tsx` y renderiza un `<ErrorPage>` molecule con un botón de retry que llama `reset()`. **Todo es client-side** y minimalista — coherente con la simplicidad del portfolio personal.

## 🎯 Filosofía: minimalismo consciente

El portfolio es un **proyecto personal**. SEO/Analytics/SEO avanzado no son prioritarios. Pero Next.js da defaults suficientes (auto-inyecta `<meta charset>`, `<meta viewport>`, etc.) que el código **no necesita más**.

> Si en el futuro el proyecto crece a producción con Vercel + dominios custom + i18n completo, hay que expandir este sistema.

## 📁 Archivos

| Archivo | Líneas | Rol |
|---|---|---|
| `src/app/layout.tsx` | 48 | Root layout: metadata + fuentes + ThemeProvider + LazyMotion |
| `src/app/error.tsx` | 24 | ErrorBoundary raíz: captura errores de página |
| `src/components/organims/ErrorPage.tsx` | ~50 | Molecule: la UI que muestra el error |
| `next.config.ts` | 12 | (referencia) — config global con `reactCompiler: true` |
| `public/favicon.ico` | binary | Favicon estático (256x256) |

## 🧬 Anatomía de `app/layout.tsx`

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ThemeProvider } from "../components/hooks/themeProvider";
import "./globals.css";
import { BackgroundFX } from "@/components/atoms/BackgroundFX";
import { domAnimation, LazyMotion } from "../components/animations/Animations";

// 1. Fuentes
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Metadata estática
export const metadata: Metadata = {
  title: "Emmanuel.dev",
  description: "Created by Emmanuel.dev",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en"
          className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
          suppressHydrationWarning>
      <body className="min-h-full text-[18px] leading-[145%] tracking-[0.18px] zoom-110 text-foreground bg-background font-display">
        <ThemeProvider attribute="class" defaultTheme="dark"
                      enableSystem={false}
                      themes={["light", "dark", "rosepine-dark", "rosepine-light"]}
                      disableTransitionOnChange>
          <LazyMotion features={domAnimation} strict>
            <BackgroundFX />
            {children}
          </LazyMotion>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### 4 responsabilidades del layout

1. **Cargar fuentes** (`Geist`, `Geist_Mono`) con `next/font/google`.
2. **Metadata estática** (`Metadata` export).
3. **ThemeProvider + LazyMotion** (sistemas theming + motion).
4. **BackgroundFX** (efectos visuales decorativos).

## 🔤 Sistema de fuentes (Geist + Geist_Mono)

```tsx
import { Geist, Geist_Mono } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",     // CSS variable
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",     // CSS variable
  subsets: ["latin"],
});
```

**Cómo se usa** (en el `<html>`):
```tsx
<html className={`${geistSans.variable} ${geistMono.variable} ...`}>
```

Esto genera **CSS classes** (`__variable_xxxx`, `__variable_yyyy`) que Next.js inyecta en el HTML. Las CSS variables `--font-geist-sans` y `--font-geist-mono` quedan disponibles globalmente.

**Cómo se aplican las fuentes** (en el body o elementos):
```tsx
<body className="... font-display">
```
- `font-display` es un alias del theme v2 que apunta a `var(--font-geist-sans)` (definido en `globals.css`).
- `font-mono` (no usado actualmente) apuntaría a `var(--font-geist-mono)`.

> **`next/font/google` optimiza** automáticamente: subset, preload, self-host, `font-display: swap` por default. **Más rápido** que cargar Google Fonts directamente.

## 📊 Metadata estática

```ts
export const metadata: Metadata = {
  title: "Emmanuel.dev",
  description: "Created by Emmanuel.dev",
};
```

**Limitaciones actuales**:
- ✗ No es i18n (no hay `title.es` o `title.en`).
- ✗ No tiene `keywords`, `authors`, `openGraph`, `twitter`.
- ✗ No tiene `metadataBase` (canonical URL).
- ✗ No tiene `robots` directives.

Next.js auto-inyecta:
- `<meta charset="utf-8">`
- `<meta name="viewport" content="width=device-width, initial-scale=1">`
- `<title>` desde `metadata.title`
- `<meta name="description">` desde `metadata.description`

### Si quisieras mejorar la metadata

```ts
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://emmanueltech.vercel.app"),
  title: {
    default: "Emmanuel Centeno — Full Stack Developer",
    template: "%s | Emmanuel.dev",
  },
  description: "Full Stack Developer especializado en React, Next.js y TypeScript...",
  keywords: ["Full Stack", "React", "Next.js", "TypeScript", "Portfolio"],
  authors: [{ name: "Emmanuel Centeno", url: "https://github.com/Below-Z3R0" }],
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://emmanueltech.vercel.app",
    siteName: "Emmanuel.dev",
  },
  twitter: { card: "summary_large_image", creator: "@emmanuel" },
  robots: { index: true, follow: true },
};
```

## 🛡️ ErrorBoundary raíz (`app/error.tsx`)

```tsx
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
```

**Cuándo se renderiza**:
- Error en `getGeneralData()` (e.g., Supabase caído).
- Error de validación de Zod (si un bloque no matchea el schema).
- Excepción no capturada en cualquier Server Component de la home.

**Importante**: este `error.tsx` **solo captura errores de la ruta `/`**. Si tuvieras `/about`, necesitarías un `app/about/error.tsx` separado.

**El `reset()`** que pasa Next.js vuelve a intentar el render del Server Component. **Útil** porque si el error fue transitorio (network blip), retry puede funcionar.

### `ErrorPage` molecule (cómo se ve)

El `<ErrorPage>` molecule (en `organims/`) tiene:
- Icon de error animado (`<m.path d="M6 6l12 12M18 6L6 18">`).
- Título y mensaje (recibe `message` prop).
- Botón "Reintentar" (recibe `onRetry` prop).
- Borde `border-destructive/40` (rojo).

## 🔄 El flujo del ErrorBoundary

```
Server Component (app/page.tsx) ejecutando
  ↓
await getGeneralData("en")  ← Supabase.timeout()
  ↓
THROW: Error: fetch failed
  ↓
Next.js detecta el error
  ↓
Renderiza app/error.tsx (en lugar de app/page.tsx)
  ↓
<ErrorPage message="Hubo un problema al conectar con el servidor..." onRetry={reset} />
  ↓
User ve el error
  ↓
User hace click en "Reintentar"
  ↓
reset()  ← Next.js reintenta el render de page.tsx
  ↓
Si tiene éxito → renderiza page.tsx normal
Si falla de nuevo → muestra error.tsx de nuevo
```

## 🎨 El favicon

`public/favicon.ico` (256x256, binary). **Estático** — no se genera dinámicamente.

> Next.js detecta automáticamente `app/favicon.ico` y lo inyecta en el `<head>`. No requiere config.

### Si quisieras favicon dinámico

```tsx
// app/icon.tsx
import { ImageResponse } from "next/og";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";
export default function Icon() {
  return new ImageResponse(<div>EC</div>, { ...size });
}
```

Pero no vale la pena para un portfolio personal.

## ⚠️ Issues conocidas

### 1. **`lang="en"` hardcoded en el `<html>`**

```tsx
<html lang="en" ...>
```

> **Issue crítico**: el sitio es bilingüe (ES/EN), pero el `lang` attribute **siempre es `en`**. Esto afecta:
> - **SEO** (Google indexa el sitio como English).
> - **Screen readers** (leen con pronunciation de English).
> - **Traducción automática** del browser (ofrece English cuando la página está en Spanish).

**Fix**:
```tsx
export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headersList = await headers();
  const lang = headersList.get("x-language") || "es";  // ← leído del orquestador
  return <html lang={lang} ...>{children}</html>;
}
```

> Pero el orquestador es async, y `RootLayout` no es async. **Fix real**: leer de `next/headers` o pasar `lang` desde `app/page.tsx` (que sí es async).

### 2. **No hay `sitemap.xml` ni `robots.txt`**

El proyecto no tiene:
- `app/sitemap.ts` (sitemap generado dinámicamente).
- `app/robots.ts` (robots.txt generado dinámicamente).
- `public/robots.txt` (estático).

> **Issue SEO**: Google no puede indexar bien el sitio.

**Fix mínimo**:
```ts
// app/sitemap.ts
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "https://emmanueltech.vercel.app", lastModified: new Date() },
  ];
}
```

### 3. **No hay `openGraph` ni `twitter:card`**

Cuando compartes la URL en Twitter/LinkedIn/Discord, no hay preview con imagen. **Issue de marketing/social**.

**Fix**: agregar `openGraph` y `twitter` a `metadata` (ver ejemplo arriba).

### 4. **El `metadata.title` es estático**

```ts
title: "Emmanuel.dev",
```

> **Issue**: si el usuario navega a `?lang=en`, el título sigue siendo "Emmanuel.dev" (no cambia). No hay i18n de metadata.

**Fix**:
```ts
title: {
  default: "Emmanuel.dev",
  template: "%s | Emmanuel.dev",
}
```

> El `template` se aplica a `metadata.title` de páginas específicas (e.g., `app/blog/[slug]/page.tsx` puede hacer `export const metadata = { title: "Mi post" }` y resultaría en "Mi post | Emmanuel.dev").

### 5. **No hay verificación de `prefers-reduced-motion`**

Si el usuario tiene `prefers-reduced-motion: reduce` (accesibilidad), las animaciones de motion y CSS siguen corriendo. **Issue a11y**.

**Fix** (en `app/layout.tsx`):
```tsx
const prefersReducedMotion = headers().get("x-prefers-reduced-motion") === "reduce";
// luego pasar como prop a ThemeProvider y components
```

> O usar `motion-safe:` y `motion-reduce:` de Tailwind v4 (que sí respeta esto).

## 🛠️ Cómo agregar una nueva fuente

```ts
// src/app/fonts.ts (nuevo)
import { Inter } from "next/font/google";

export const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],  // ← para multi-script
  display: "swap",
});
```

Usar en layout:
```tsx
<html className={`${inter.variable} ...`}>
```

Aplicar en componentes:
```tsx
<p className="font-sans">Default font</p>
<p className="font-[family-name:var(--font-inter)]">Inter</p>
```

## 🛠️ Cómo agregar ErrorBoundary a una ruta específica

```tsx
// app/projects/[slug]/error.tsx
"use client";
import { useEffect } from "react";
import { ErrorPage } from "@/components/components";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Error en projects:", error); }, [error]);
  return <ErrorPage message={`No se pudo cargar el proyecto: ${error.message}`} onRetry={reset} />;
}
```

> El `digest` prop es único de Next.js (para tracking server-side errors).

## 🔗 Conexiones con otros sistemas

- **Theming v2** — el layout monta `<ThemeProvider>`.
- **Motion** — el layout monta `<LazyMotion>`.
- **BackgroundFX** — está dentro del `<LazyMotion>` (sin motion, pero el wrapper lo carga).
- **DB + Supabase** — el error de `getGeneralData()` dispara `app/error.tsx`.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (origen del error en `getGeneralData`)
- [[learning/projects/portfolio-v2/sistema-header-navegacion]] (Header en layout)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (ThemeProvider en layout)
- [[learning/projects/portfolio-v2/motion-integration-guide]] (LazyMotion en layout)
- ADR-019: page.tsx como único orquestador de queries
- ADR-022: Props semánticas en Button/LinkButton

## Próximo sistema

Sigo con **Testing / CI / Deploy** (gap importante: el proyecto no tiene tests, no tiene CI, no hay config de deploy documentada) o **next/font específico**, o **i18n de metadata**.

Decime.
