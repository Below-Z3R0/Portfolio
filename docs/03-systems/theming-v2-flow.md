---
title: Theming v2 — flujo end-to-end (globals.css → componente)
type: flow-guide
project: portfolio-v2
scope: project
status: active
created: 2026-09-28
updated: 2026-09-28
tags: [portfolio-v2, theming, globals.css, useTheme, themeProvider, shadcn, flow-guide, how-it-works]
verified_with: minimax-m3
---

> **TL;DR:** En portfolio-v2, el theming vive en 4 archivos puente que conectan `globals.css` con los componentes: `themeProvider.tsx` (config), `useTheme.tsx` (hook), `ThemeSwitcher.tsx` (UI para elegir), y el atributo de clase `dark|light|rosepine-dark|rosepine-light` que `next-themes` aplica al `<html>`. **El grafo real del flujo de theming** empieza con un valor del 7 (CSS variable), se vuelve 1 (clase Tailwind), sube por 2 (alias en @theme), llega al componente como `bg-card`/`text-foreground`. Esta guía documenta ese flujo con archivos exactos del proyecto.

## 🗺️ Mapa mental: dónde vive cada pieza

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. CSS variables (literales)                                        │
│    src/app/globals.css                                              │
│    Bloques: .dark / .light / .rosepine-dark / .rosepine-light        │
│    Cada bloque define 36 valores literales (-color-primary: #000;)│
└─────────────────────────────────────────────────────────────────────┘
                                ↓ @theme aliasing
┌─────────────────────────────────────────────────────────────────────┐
│ 2. @theme (Tailwind v4) — alias semánticos                          │
│    src/app/globals.css                                              │
│    Bloque: @theme { --color-card: var(--card); ... }                │
│    Genera utilities: bg-card, text-foreground, etc.                 │
└─────────────────────────────────────────────────────────────────────┘
                                ↓ attribute="class"
┌─────────────────────────────────────────────────────────────────────┐
│ 3. Next-themes — aplica la clase al <html>                          │
│    <html class="dark"> o <html class="light">                        │
│    Configured por: src/app/layout.tsx + themeProvider.tsx            │
└─────────────────────────────────────────────────────────────────────┘
                                ↓ CSS cascade
┌─────────────────────────────────────────────────────────────────────┐
│ 4. Selector activo (.dark, .light, etc.)                            │
│    Las clases en <html> hacen match con selectores del .css         │
│    Cada selector define 36 vars — el render usa esas vars          │
└─────────────────────────────────────────────────────────────────────┘
                                ↓ CSS variables resueltas
┌─────────────────────────────────────────────────────────────────────┐
│ 5. Componentes — usan utilities Tailwind                             │
│    className="bg-card border border-border ..."                     │
│    Tailwind lee .bg-card → bg-color: var(--color-card) → var(--card)│
└─────────────────────────────────────────────────────────────────────┘
                                ↓ colores en píxeles
                              [ usuario ve el color ]
```

## 📂 Archivos críticos del theming v2

### 1. `src/app/globals.css` (429 líneas, el archivo más importante)

Tiene 3 secciones:

#### Sección A — `@theme` (líneas 17-91)

Conecta variables CSS crudas con utilities Tailwind:

```css
@theme {
  --color-background: var(--background);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-destructive: var(--destructive);
  --color-warning: var(--warning);
  --color-success: var(--success);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-hover: var(--hover);
  --color-pressed: var(--pressed);
  /* ... 45 aliases en total ... */

  /* Otros tokens no-color */
  --font-display: "Inter", sans-serif;
  --breakpoint-qw: 921px;
  --breakpoint-ew: 700px;
  --breakpoint-ww: 640px;
}
```

**Por qué importa**: en este bloque se mapea el sistema de theming a Tailwind v4. Si agregás una variable nueva en este `@theme`, aparece como utility (`bg-X`, `text-X`, etc.).

#### Sección B — Selectores `.dark / .light / .rosepine-dark / .rosepine-light` (líneas 93-362)

Cada selector define los **36 valores literales** para su paleta. Por ejemplo:

```css
.dark {
  --background: #000000;
  --card: #0a0a0a;
  --popover: #141414;
  --primary: #9466ff;
  --primary-foreground: #ffffff;
  --primary-soft: rgba(139, 92, 246, 0.1);
  /* ... 30 vars más ... */
}
```

> **⚠️ Estructura fija**: cada paleta DEBE tener las mismas 36 variables. Si agregás una variable a `@theme`, tenés que agregarla en las 4 paletas.

#### Sección C — Utility classes custom del proyecto (líneas 364-429)

Usa `var(--grid)`, `var(--accent)`, etc. **NO** se generan por Tailwind, son CSS puro:

```css
.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(to right, var(--grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle 80vmin at 50% 45%, black 0%, black 25%, transparent 100%);
}

.bg-fx__noise {
  position: absolute;
  inset: 0;
  pointer-events: none;
  mix-blend-mode: soft-light;
  opacity: 0.6;
}

.bg-fx__vignette {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(ellipse 80% 70% at 50% 45%, transparent 0%, rgba(0,0,0,0.05) 30%, ...);
}
```

Estos los usa `BackgroundFX` (`src/components/atoms/BackgroundFX.tsx`).

### 2. `src/components/hooks/themeProvider.tsx` (24 líneas)

Configuración del wrapper que se pasa al `ThemeProvider` real de `next-themes`:

```tsx
"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";

export function ThemeProvider({
  children,
  ...props
}: ComponentProps<typeof NextThemesProvider>) {
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
```

> **⚠️ Inconsistencia detectada**: este wrapper dice `defaultTheme="dark"` + `enableSystem={false}`, pero en `layout.tsx` se usa con `attribute="class"` + `enableSystem` (boolean, default `true`) + `disableTransitionOnChange`. Lo correcto es unificar. **Pendiente para próxima iteración**.

**Por qué existe**: encapsula las 4 paletas (`themes=[...]`) en un solo lugar. Si agregás una paleta, solo este array cambia.

### 3. `src/components/hooks/useTheme.tsx` (28 líneas)

Hook custom sobre `next-themes/useTheme` que:

- Tipa el retorno del tema como `Theme = "light" | "dark" | "rosepine-dark" | "rosepine-light"` (4 paletas).
- Maneja el `mounted` para evitar hydration mismatch.
- Expone `{ theme, setTheme }` con tipos seguros.

```tsx
export type Theme = "light" | "dark" | "rosepine-dark" | "rosepine-light";
export const ThemeData: Theme[] = ["light", "dark", "rosepine-dark", "rosepine-light"];

export function useTheme() {
  const { setTheme: setNextTheme, resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme: Theme =
    mounted && (
      resolvedTheme === "dark" || resolvedTheme === "light" ||
      resolvedTheme === "rosepine-dark" || resolvedTheme === "rosepine-light"
    )
      ? resolvedTheme
      : "dark";

  const setTheme = (newTheme: Theme) => {
    setNextTheme(newTheme);
  };

  return { theme: currentTheme, setTheme };
}
```

**Por qué se reescribe sobre `next-themes/useTheme`**: para tener type-safety estricto y que el código TypeScript sepa qué paletas existen.

### 4. `src/components/atoms/ThemeSwitcher.tsx` (42 líneas)

UI para elegir entre las 4 paletas. Es el "control panel":

```tsx
export function ThemeSwitcher({
    ThemeMenuOrganization,
}: {
    ThemeMenuOrganization?: string;
}) {
    const { setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState<boolean>(false);
    return (
        <>
            <Button svg={"daynight"} buttonBody="size-7 z-50 "
                    svgStyle="text-foreground hover:text-primary"
                    onClick={() => setIsOpen(!isOpen)} />

            {isOpen && (
                <div className="... bg-background border border-border shadow-2xl ...">
                    {ThemeData.map((cat, index) => (
                        <Button onClick={() => setTheme(cat as Theme)}
                                key={index} txt={cat}
                                buttonBody="flex items-start h-8 w-full p-1 rounded-md"
                                txtStyle="hover:text-primary" />
                    ))}
                </div>
            )}
        </>
    );
}
```

**Por qué importa**: este es el ÚNICO punto donde el usuario cambia de tema. Cualquier nuevo modo de tema se agrega modificando:
1. `globals.css` (variables CSS).
2. `themeProvider.tsx` (array `themes`).
3. `useTheme.tsx` (tipo `Theme` + `ThemeData`).
4. **Automáticamente** aparece en este menú.

### 5. `src/app/layout.tsx` (46 líneas)

El layout raíz. Conecta todo:

```tsx
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`} suppressHydrationWarning>
      <body className="min-h-full text-[18px] leading-[145%] tracking-[0.18px] zoom-110 text-foreground bg-background font-display">
        <ThemeProvider attribute="class" enableSystem disableTransitionOnChange={true}>
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

Cosas importantes que pasan acá:

- `suppressHydrationWarning`: necesario porque `next-themes` agrega `class="dark|light"` al `<html>` después del SSR.
- `<body>` tiene las utilities SEMÁNTICAS principales: `text-foreground bg-background font-display`. Es el reemplazo de la clase Tailwind `bg-page`.
- `ThemeProvider`: viene del wrapper en `themeProvider.tsx` que provee `themes=[...]`.
- `LazyMotion` + `BackgroundFX`: ortogonales al theming.

## 🧪 Demo: cómo una clase llega al pixel

Ejemplo: `<article className="bg-card ...">` en `ProjectCard.tsx`.

```
1. ProjectCard.tsx línea 22:
   <article className="... bg-card border border-border shadow-lg ..." />

2. Tailwind v4 ve "bg-card" en className
   → busca la utility .bg-card en CSS generado

3. Tailwind v4 genera esta utility (cuando hace build) o la tiene cacheada:
   .bg-card { background-color: var(--color-card); }

4. CSS resuelve --color-card (definido en @theme):
   --color-card: var(--card);

5. CSS resuelve --card (definido en la paleta activa):
   - Si html.dark:     --card: #0a0a0a
   - Si html.light:    --card: #ededed
   - Si html.rosepine-dark:  --card: #1f1d2e
   - Si html.rosepine-light: --card: #faf4ed

6. El browser pinta el color asignado.
```

## 🔍 Convenciones críticas del sistema v2

### Convención 1: `border` SIEMPRE con variante

```tsx
// ✓ CORRECTO — define ancho + color
<div className="border border-border">

// ✗ INCORRECTO — define ancho sin color (invisible)
<div className="border">

// ✓ CORRECTO — variante semántica
<div className="border border-primary">    {/* violeta */}
<div className="border border-destructive"> {/* rojo */}
<div className="border border-success">     {/* verde */}
```

> `border` solo = `border-width: 1px` sin color. Si no ponés `border-X`, el borde queda 100% transparente (hereda de `--border-glow` o del bg).

### Convención 2: `text-background` NO existe

```tsx
// ✗ INCORRECTO — confunde bg con text
<span className="text-background">

// ✓ CORRECTO — texto principal
<span className="text-foreground">

// ✓ CORRECTO — texto sobre fondo primario (botón violeta)
<button className="bg-primary text-primary-foreground">
```

### Convención 3: Rosepine color solo para decoración, no semántica

```tsx
// ✓ CORRECTO — usar semantic
<button className="bg-destructive text-destructive">Error</button>

// ✗ INCORRECTO — color temático para feedback
<span className="bg-foam text-foam">Info</span>  // foam es decorative
```

Los aliases `--color-love / pine / foam / iris` se mantienen disponibles pero **NO** los uses para feedback semántico. Para eso: `--color-destructive / warning / success`.

### Convención 4: `--primary-foreground` SIEMPRE blanco puro

En las 4 paletas, `--primary-foreground: #ffffff`. Esto garantiza que los botones CTA tengan siempre contraste > 15:1.

## 🧩 Cómo agregar una nueva paleta (paso a paso)

Si querés agregar `mi-paleta`:

### Paso 1 — globals.css

```css
@theme {
  /* (no requiere cambio, las variables ya están definidas) */
}

.mi-paleta {
  --background: #...;
  --background-foreground: #...;
  --card: #...;
  /* ... 36 variables total ... */
}
```

### Paso 2 — themeProvider.tsx

```tsx
themes={["light", "dark", "rosepine-dark", "rosepine-light", "mi-paleta"]}
```

### Paso 3 — useTheme.tsx

```tsx
export type Theme = "light" | "dark" | "rosepine-dark" | "rosepine-light" | "mi-paleta";
export const ThemeData: Theme[] = ["light", "dark", "rosepine-dark", "rosepine-light", "mi-paleta"];

// También agregar a validThemes y al check de currentTheme
```

### Paso 4 — Verificar

- `bunx tsc --noEmit`: 0 errores.
- Server arranca (curl `localhost:3000` HTTP 200).
- Abrir browser, click en ThemeSwitcher → "mi-paleta" debe aparecer como opción.
- Toggle → la página se rerenderiza con los nuevos colores.

## ⚠️ Issues resueltos en esta sesión (este era el estado antes de los fixes)

### ✅ Bug 1 — Inconsistencia entre `themeProvider.tsx` y `layout.tsx` (resuelto)

**Estado anterior**: `themeProvider.tsx` decía `defaultTheme="dark"` + `enableSystem={false}`, pero `layout.tsx` pasaba `enableSystem` (default true) sin `defaultTheme`.

**Fix aplicado** en `layout.tsx`:

```tsx
<ThemeProvider
    attribute="class"
    defaultTheme="dark"
    enableSystem={false}
    themes={["light", "dark", "rosepine-dark", "rosepine-light"]}
    disableTransitionOnChange
>
```

Ahora `attribute="class"` está explícito, evitando que next-themes use el default `data-theme`. La config está consolidada en `layout.tsx`.

### ✅ Bug 2 — FOUC (Flash of Unstyled Content) (resuelto)

**Estado anterior**: Script inline manual en `<head>` peleándose con el script auto-inyectado por `next-themes`. Ambos seteaban cosas diferentes.

**Fix aplicado**: Removí el `<script>` inline manual de `layout.tsx`. Next-themes con `attribute="class"` ya inyecta su propio script FOUC que usa `classList.add(...)` correctamente, alineado con el sistema de selectores `.dark/.light/.rosepine-*.` de `globals.css`.

### Bug 3 — Inconsistencia `bg-fx` vs `bg-fx__noise` naming

- `.bg-fx` existe en `globals.css` (línea 371) y `BackgroundFX.tsx` lo usa.
- `.bg-fx__noise`, `.bg-fx__vignette`, `.bg-grid` también existen en `globals.css`.

Naming consistente, no es bug real. Pero `.bg-fx` no tiene utilidad @theme asociada, lo cual es inconsistente con los demás. Es solo CSS puro.

## 📚 Recursos relacionados

- [[learning/frontend/css/themes/theme-system-portfolio-v2]] — referencia visual de las 4 paletas y los 36 tokens
- [[learning/frontend/css/themes/themes-next-themes]] — cómo funciona `next-themes`
- [[learning/frontend/css/themes/themes-css-variables-vite]] — patrón equivalente para SPA pura
- [[learning/frontend/css/colors/color-palette-catalog]] — de dónde sacar paletas nuevas
- [[learning/projects/portfolio-v2/architecture]] — arquitectura general del proyecto

## 🔗 Conexiones a otros archivos del proyecto

```
globals.css (36 vars × 4 paletas)
    ↑ alias en @theme
tailwind utilities (bg-card, text-foreground, ...)
    ↑ usado en
src/components/**/*.tsx (todos los componentes con className="bg-...")
    ↑ coordenado por
src/components/hooks/themeProvider.tsx (themes=[...])
    ↑ accedido por
src/components/hooks/useTheme.tsx (useTheme hook)
    ↑ consumido por
src/components/atoms/ThemeSwitcher.tsx (UI toggle) + ThemeToggle.tsx (icono)
    ↑ montado en
src/app/layout.tsx (layout raíz)
```

**4 archivos puente** entre el CSS y los componentes:
1. `globals.css` (las 36 vars × 4 paletas + @theme + utility classes custom)
2. `themeProvider.tsx` (config central)
3. `useTheme.tsx` (hook tipado)
4. `ThemeSwitcher.tsx` (UI de selector)
5. `layout.tsx` (layout raíz que monta todo)

**Si modificás uno, casi siempre necesitás tocar el siguiente** (e.g., agregar paleta = tocar los 4 archivos).

## 🕸️ Integración con Graphify

El sistema de theming v2 está **integrado al grafo de Graphify** del proyecto (250 nodos iniciales → 257 nodos con la integración + 517 edges con 10 edges manuales).

### Nodos clave

- **`components_hooks_theming_v2`** — proxy TypeScript que expone los tipos `Theme`, `ThemeToken`, `TailwindUtility` y las constantes del sistema. Existe principalmente para que Graphify pueda trazar las relaciones del sistema con los componentes.
- **`app_globals.css`** — nodo conceptual. Graphify no procesa `.css`, este nodo manual referencia el archivo real.

### Edges manuales agregados

| Source | Relation | Target | Por qué |
|---|---|---|---|
| `theming_v2` | `validates-type-of` | `useTheme` | Type `Theme` exportado en ambos |
| `theming_v2` | `documents-config-of` | `themeProvider` | Array `themes=[...]` documentado |
| `theming_v2` | `documents-ui-of` | `ThemeSwitcher` | ThemeSwitcher lista ThemeData |
| `theming_v2` | `documents-utility-of` | `BackgroundFX` | Usa `.bg-grid`, `.bg-fx__noise`, `.bg-fx__vignette` |
| `theming_v2` | `represents-system-of` | `globals.css` | theming.v2.ts es el proxy TypeScript |
| `globals.css` | `is-proxied-by` | `theming_v2` | Conexión bidireccional |
| `layout` | `mounts-system-of` | `theming_v2` | layout.tsx monta `<ThemeProvider>` |
| `ProjectCard` | `uses-conventions-of` | `theming_v2` | Ejemplo de uso del sistema |
| `ProjectCard()` | `uses-conventions-of` | `theming_v2` | Función/componente |
| `ThemeSwitcher()` | `consumes` | `useTheme()` | Hook consumido |

### Cómo mantener el grafo

Cuando agregues una paleta nueva o cambies convenciones, **regenerá** el grafo:

```bash
cd ~/Documents/Github/Portfolio-v2
source .venv/bin/activate
graphify extract src/ --out docs/graph/
graphify cluster-only docs/graph/
```

Y si tenés nuevos edges manuales, mantener este script como referencia en `loop-deep.md`.
