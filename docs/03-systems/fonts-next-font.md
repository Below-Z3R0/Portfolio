---
title: "Sistema de fuentes: next/font (Geist + Geist_Mono)"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [next-font, geist, fonts, optimization, tailwind, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto usa `next/font/google` para cargar **Geist** y **Geist_Mono** (la fuente de Vercel) en `app/layout.tsx`. La función retorna un objeto con `variable` (CSS variable name) que se aplica como `className` al `<html>`. Las CSS variables (`--font-geist-sans`, `--font-geist-mono`) quedan disponibles globalmente y se conectan con el theme v2 vía `font-display` en `globals.css`. **Self-host automático**: Next.js descarga las fuentes en build y las sirve localmente (mejor LCP que Google Fonts CDN).

## 🎯 Por qué next/font y no Google Fonts CDN

| Aspecto | Google Fonts CDN | next/font (Next.js 13+) |
|---|---|---|
| Self-host | No (CDN) | Sí (descargado en build) |
| Layout shift | Mitigado con `font-display: swap` | **Eliminado**: subset + preload + size-adjust |
| Subset | Manual (subset por idioma) | **Automático** (solo los chars usados) |
| Performance | 1+ HTTP request a fonts.googleapis.com | 0 request (inline en CSS bundle) |
| CORS / CSP | Problemas comunes | Sin problemas (mismo origen) |
| Personalización | Limitada | Total (weight, style, variable) |

> Para un portfolio que prioriza **Lighthouse score** y **Core Web Vitals**, `next/font` es la elección correcta.

## 📁 Archivos

| Archivo | Líneas | Rol |
|---|---|---|
| `src/app/layout.tsx` | 48 | Carga las fuentes con `Geist()` y `Geist_Mono()` |
| `src/app/globals.css` | 429 | Define `--font-display` que referencia las CSS variables |
| (ningún otro) | — | Next.js maneja el resto (subfolder `.next/static/media`) |

## 🧬 Anatomía del uso

```tsx
// src/app/layout.tsx
import { Geist, Geist_Mono } from "next/font/google";

// 1. Instanciar las fuentes (en el scope del módulo, no del componente)
const geistSans = Geist({
  variable: "--font-geist-sans",   // ← CSS variable que se genera
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 2. Aplicar la class al <html>
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="font-display ...">
        {children}
      </body>
    </html>
  );
}
```

**Cómo se ve en el HTML** (después del build):

```html
<html className="__variable_xxxx __variable_yyyy h-full antialiased">
  <head>
    <style>
      :root {
        --font-geist-sans: __geist_xxxx;
        --font-geist-mono: __geist_yyyy;
      }
    </style>
  </head>
```

> Las CSS variables quedan disponibles **globalmente** en `:root`. Otros componentes pueden usarlas con `var(--font-geist-sans)`.

## 🔗 Conexión con el theme v2

En `globals.css`:

```css
:root {
  --font-display: "Inter", sans-serif;  /* ← fallback */
  ...
}

@theme {
  --font-display: "Inter", sans-serif;
  ...
}
```

> **Issue**: el `--font-display` está **hardcoded a "Inter"** en `globals.css`, no a `var(--font-geist-sans)`. Esto significa que el theme v2 no usa la fuente Geist — usa Inter.

**Fix planeado** (en `globals.css`):
```css
@theme {
  --font-display: var(--font-geist-sans), "Inter", sans-serif;
  --font-mono: var(--font-geist-mono), "Fira Code", monospace;
}
```

> Una vez hecho, `<body className="font-display">` usará Geist.

## 📊 Subsets disponibles

`next/font/google` acepta los siguientes subsets de Google Fonts (para Geist, hay 4):

```ts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext"],  // ← si el sitio tiene texto en otros alfabetos
});
```

| Subset | Chars cubiertos | Peso bundle |
|---|---|---|
| `latin` | A-Z, a-z, 0-9, signos básicos | ~10 KB por weight |
| `latin-ext` | latin + chars acentuados especiales | +5 KB |
| `cyrillic` | alfabeto cirílico | +30 KB |
| `vietnamese` | vietnamita | +20 KB |

> **Regla**: solo usar los subsets que **realmente aparecen** en el sitio. Para un portfolio en español/inglés, `latin` es suficiente.

## 🧠 Cómo funciona `next/font` por dentro

```
bun run build
  ↓
Next.js ve `import { Geist } from "next/font/google"`
  ↓
En build-time:
  1. Descarga la fuente de Google Fonts (woff2)
  2. La mete en .next/static/media/
  3. Genera una CSS class con CSS variables
  4. Inyecta @font-face inline en el HTML
  5. Solo descarga los subsets pedidos
↓
Runtime:
  - El browser lee la fuente del mismo origen (mismo domain)
  - Sin HTTP request externo
  - Preload automático (rel="preload" en <head>)
```

> **Privacidad**: las fuentes se descargan en build-time, **no en runtime**. El usuario final nunca contacta Google Fonts.

## 🎨 Aplicar las fuentes en componentes

### 3 formas de usar las fuentes

```tsx
// 1. Aplicar la font-family via Tailwind utilities (theme v2 ya tiene los aliases)
<body className="font-display">       {/* usa --font-display (de globals.css) */}
<p className="font-mono">             {/* usa --font-mono */}

// 2. Aplicar directamente la CSS variable
<p style={{ fontFamily: "var(--font-geist-sans)" }}>Texto en Geist</p>

// 3. Usar font-feature-settings (ligatures, etc.)
<p style={{
  fontFamily: "var(--font-geist-sans)",
  fontFeatureSettings: '"cv11", "ss01"',
}}>Texto con OpenType features</p>
```

## ⚙️ Opciones avanzadas

```ts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  
  // Opciones menos comunes pero útiles:
  weight: ["400", "500", "700"],       // solo esos weights (default: todos)
  style: ["normal", "italic"],         // solo esos styles (default: normal)
  display: "swap",                      // "auto" | "block" | "swap" | "fallback" | "optional"
  preload: true,                        // preload en <head> (default: true si solo 1 font)
  fallback: ["Helvetica", "Arial"],     // fallback si Geist no carga
  adjustFontFallback: true,             // auto-genera size-adjust (default: true)
  variable: "--font-geist-sans",
  axes: [],                              // para variable fonts (no aplica a Geist)
});
```

### `display: "swap"` vs `"block"`

- `swap`: muestra fallback inmediatamente, swap cuando la fuente carga. **Bueno para LCP**.
- `block`: invisible hasta que la fuente cargue (3s max). **Mata el LCP**.
- `fallback`: muestra fallback ~100ms, después swap si la fuente está lista.
- `optional`: como fallback pero el browser decide si vale la pena descargar (basado en conexión).

> **Default en Next.js 16**: `swap`.

### Variable fonts (cuando aplica)

```ts
// Si la fuente es variable (ej. Inter, Roboto Flex)
const inter = Inter({
  subsets: ["latin"],
  axes: ["slnt", "wght"],  // solo los axes que se usan
});
```

Geist NO es variable font. Geist Variable (la versión extendida) sí lo es. Si querés usarla, necesitas instalar `@geist-ui/fonts` o usar el CSS `@import`.

## 🛠️ Cómo agregar una nueva fuente

1. Importar la fuente en `layout.tsx`:
   ```ts
   import { Fira_Code } from "next/font/google";
   const firaCode = Fira_Code({
     variable: "--font-fira-code",
     subsets: ["latin"],
     weight: ["400", "700"],
   });
   ```

2. Aplicar al `<html>`:
   ```tsx
   <html className={`${geistSans.variable} ${geistMono.variable} ${firaCode.variable} ...`}>
   ```

3. Conectar al theme v2 (en `globals.css`):
   ```css
   @theme {
     --font-display: var(--font-geist-sans), "Inter", sans-serif;
     --font-mono: var(--font-geist-mono), "Fira Code", monospace;
   }
   ```

## ⚠️ Issues conocidas

### 1. **El `--font-display` no usa Geist**

```css
@theme {
  --font-display: "Inter", sans-serif;  /* ← hardcoded a Inter */
}
```

> **Issue**: a pesar de cargar Geist, el theme v2 no la usa. **Issue doble**:
> - Si Geist es la fuente de marca, no se usa en ningún lugar del sitio.
> - Si Inter es la fuente de marca, el `<link>` a Geist no aporta nada.

**Fix**: en `globals.css`:
```css
@theme {
  --font-display: var(--font-geist-sans), "Inter", sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
}
```

### 2. **El `<html lang="en">` está hardcoded**

```tsx
<html lang="en" ...>
```

> **Issue i18n**: el sitio es bilingüe (ES/EN) pero el `lang` attribute es siempre "en".

**Fix** (cubierto en doc de i18n): leer de `next/headers` o pasar como prop.

### 3. **No hay validación de subsets en runtime**

```ts
const geistSans = Geist({
  subsets: ["latin"],  // ← si pones un subset inválido, TS no avisa
});
```

> Next.js falla en build si el subset no existe. **Issue menor**, no crítico.

### 4. **El preconnect a fonts.googleapis.com no aplica**

`next/font/google` self-hostea las fuentes, **no se conecta a Google CDN**. **No aplica este issue**.

### 5. **No hay `display: "swap"` configurado explícitamente**

`next/font` default es `swap`, así que **OK por default**. Pero podrías ser explícito para claridad:
```ts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});
```

## 🔗 Conexiones con otros sistemas

- **Theming v2** — `--font-display` está en `globals.css` (debería referenciar `--font-geist-sans`).
- **i18n** — el `<html lang>` no se actualiza con `?lang=en`.
- **SEO / metadata** — no incluye OpenGraph con imágenes (`og:image`).

## 🔗 Ver también

- [[learning/projects/portfolio-v2/sistema-seo-metadata-fonts-errorboundary]] (metadata + layout)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (donde se define `--font-display`)
- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (origen del proyecto)
- Next.js docs: <https://nextjs.org/docs/app/api-reference/components/font>

## Próximo sistema

Sigo con **Manejo de errores a nivel de servicio** (try/catch en `data.service.ts` con fallbacks), **Patrón de barrel `components.ts`**, **Type helpers** (`PortfolioClient`), o un **overview final** que conecte todos los sistemas documentados.

Decime cuál priorizar.
