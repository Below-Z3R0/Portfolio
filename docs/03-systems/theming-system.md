---
title: Theming system v2 — portfolio-v2 (Next.js + Tailwind v4 + shadcn conventions)
type: reference
project: portfolio-v2
scope: learning
status: active
created: 2026-09-28
updated: 2026-09-28
tags: [css-variables, dark-mode, frontend, learning, nextjs, tailwind-v4, shadcn, theming, portfolio-v2, roserpine, material-3]
verified_with: minimax-m3
---

> **TL;DR:** Sistema de theming de portfolio-v2 basado en convención shadcn / Material 3 / Noctalia Rosepine. Cuatro paletas conmutables vía clases CSS (`dark`, `light`, `rosepine-dark`, `rosepine-light`) que aplican 36 variables de tema cada una. Las utilidades de Tailwind v4 (`bg-background`, `text-foreground`, `border`) se generan automáticamente desde el bloque `@theme`. Patrón universal: en dark el bg es el más oscuro y la card más clara; en light el bg es el más claro y la card más oscura. La paleta Rosepine Dawn oficial tiene la jerarquía invertida (card más blanca que bg), por lo que `rosepine-light` aplica una corrección para que la card no parezca "transparente".

## 🎯 Filosofía

El sistema está organizado en **dos capas**:

1. **Primitivos** (valores literales): los colores en sí, definidos en cada paleta (`.dark`, `.light`, etc.).
2. **Semánticos** (`@theme`): cómo Tailwind los expone — `--color-background`, `--color-card`, `--color-foreground` — que generan `bg-background`, `bg-card`, `text-foreground` como utilities.

Separar las capas permite:

- Cambiar la paleta de una variante tocando solo sus valores literales.
- Componentes no contienen colores hardcoded; siempre consumen semánticos.
- Añadir una paleta nueva = duplicar el bloque `.x-paleta`, ninguna utility cambia.

## ⚖️ Cuándo usar

**Esta guía aplica cuando:**

- Trabajás en `portfolio-v2` o en un proyecto que herede su sistema (`shadcn / Material 3 / Noctalia conventions`).
- Necesitás usar colores temáticos en componentes. **Siempre usá utilities semánticos** (`bg-card`, `text-foreground`), nunca primitivos (`bg-color-xxx`, `text-white`).
- Querés agregar una nueva paleta o ajustar contraste de una existente.

**NO aplica cuando:**

- Estás en una SPA sin SSR (Vite, Astro client-only). Para eso usá [[learning/frontend/css/themes/themes-css-variables-vite.md]].
- Estás en otro proyecto con sistema propio. Esta guía es específica a portfolio-v2.

## 🗂️ Jerarquía de variables (4 paletas × 36 vars)

Cada paleta expone las **mismas 36 variables** (más alias en `@theme` para Tailwind v4).

### Backgrounds (jerarquía del más elevado al más profundo)

| Variable | Alias Tailwind | Uso |
|---|---|---|
| `--background` | `bg-background` | `<body>` de la página (color de fondo principal) |
| `--card` | `bg-card` | contenedor elevado (article, modal, sección) |
| `--popover` | `bg-popover` | elemento dentro de card (input, sub-panel) |
| `--secondary` | `bg-secondary` | alias de popover en este sistema |
| `--tertiary` | `bg-tertiary` | nivel más elevado (modal sobre card sobre bg) |

**Patrón universal**: en dark, `--background < --card < --popover` (luminosidad ascendente). En light, `--popover < --card < --background`.

### Foregrounds (texto principal)

| Variable | Alias Tailwind | Uso |
|---|---|---|
| `--foreground` | `text-foreground` | texto principal (títulos, párrafos destacados) |
| `--background-foreground` | `text-background` | **no se usa** (causa confusión con `bg-background`) |
| `--card-foreground` | `text-card` | no se usa |
| `--muted-foreground` | `text-muted-foreground` | texto secundario (descripciones, párrafos largos) |
| `--text-footer` | — | solo en `--footer`, mantenerlo separado |

> **⚠️ Bug frecuente**: usar `text-background` esperando color de texto. La utility existe porque el alias existe, pero su valor es `#fafafa` (igual que `--card-foreground`). **Usá `text-foreground`** para texto principal y `text-primary-foreground` para texto sobre `bg-primary`.

### Brand: primary + accent

| Variable | Uso |
|---|---|
| `--primary` | color de marca (botón CTA, badge destacado) |
| `--primary-foreground` | **texto sobre `bg-primary`** = blanco puro `#ffffff` (todas las paletas) |
| `--primary-soft` | fondo suave con 8-10% alpha (badges, hover state) |
| `--primary-container` | container más oscuro (chips, indicators) |
| `--accent` | acento secundario (links, iconos destacados) |

> **Convención clave**: `--primary-foreground` SIEMPRE es blanco puro (`#ffffff`) en cualquier paleta, para que los CTAs tengan máximo contraste sobre su fondo violeta.

### Semánticos (estados)

| Variable | Uso | Light | Dark |
|---|---|---|---|
| `--destructive` / `--destructive-soft` | errores (red) | `#dc2626` / 8% | `#f87171` / 10% |
| `--warning` / `--warning-soft` | advertencias (gold/amber) | `#d97706` / 8% | `#f59e0b` / 10% |
| `--success` / `--success-soft` | confirmaciones (green) | `#059669` / 8% | `#34d399` / 10% |
| `--info` (Rosepine: `--foam`) | info (cyan) | `#0891b2` | `#22d3ee` |

> **Regla semántica**: `warning` solo para advertencias reales. Para "EN CONSTRUCCIÓN" usá `warning` (no `destructive`, porque no es un error). Para errores de validación o estados fallidos, sí `destructive`.

### Bordes

| Variable | Uso |
|---|---|
| `--border` | color de borde **principal** — translúcido (rgba 6-8%) para jerarquía visual |
| `--border-foreground` | variante opuesta (más opaco o más claro según paleta) |
| `--border-glow` | color de borde con glow (cuando hovereás) — usa `--primary` con alpha |
| `--input` | color de borde de inputs |
| `--ring` | color de focus ring (más opaco que `--border-glow`) |

> **⚠️ Convención fundamental shadcn**: en Tailwind v4, `border` solo define el **ancho (1px)**. Para que tenga color necesitás `border border-border`. La utility `border-border` (sin guión) usa `--color-border`. **SIEMPRE usar ambos juntos**.
>
> ```tsx
> // ✓ correcto
> <div className="border border-border shadow-lg">
>
> // ✗ incorrecto (borde transparente)
> <div className="border shadow-lg">
> ```
>
> Si querés un borde con color explícito:
> ```tsx
> <div className="border border-destructive">  {/* rojo */}
> <div className="border border-primary">      {/* violeta */}
> <div className="border border-success">      {/* verde */}
> ```

### Ring (focus + hover frames)

| Variable | Uso |
|---|---|
| `--ring` | `ring-1 ring-primary` para focus visible (intensidad alta) |
| `--hover` | `hover:bg-hover` para fondos de hover (intensidad baja) |
| `--pressed` | `bg-pressed` para active state |

### Texto de jerarquía (footer, grid)

| Variable | Uso |
|---|---|
| `--footer` | copyright, año |
| `--grid` | color del grid decorativo (rgba 4-8%) |
| `--highlight-low/med/high` | overlays translúcidos (3 tiers) |

### Rosepine palette

Colores específicos del proyecto Noctalia Rosepine. Solo se usan donde el sistema de design los pide (badges temáticos, iconos de marca):

| Variable | Color (light/Dawn) | Color (main/dark) | Color (moon/dark) |
|---|---|---|---|
| `--love` | `#b4637a` | `#eb6f92` | `#eb6f92` |
| `--pine` | `#286983` | `#31748f` | `#31748f` |
| `--foam` | `#56949f` | `#9ccfd8` | `#9ccfd8` |
| `--iris` | `#907aa9` | `#c4a7e7` | `#c4a7e7` |

> **⚠️ El alias real en Noctalia Rosepine tradicional** mapea como: `love` = warning, `gold` = warning, `rose` = primary, `pine` = success, `foam` = info, `iris` = accent. En este sistema se eligió `rose = primary` y los otros como **acento decorativo** (no se usan para feedback semántico).
>
> **Para feedback semántico usá `destructive / warning / success`** — son los oficiales del sistema de design.

## 🎨 Las 4 paletas en detalle

### `.dark` (default)
```
--background: #000000      /* negro puro, fondo página */
--card: #1a1a1a           /* gris sutilmente más claro que bg */
--popover: #2a2a2a        /* gris más elevado */
--primary: #8b5cf6        /* violeta base */
--primary-foreground: #ffffff
--border: rgba(255,255,255,0.06)  /* línea blanca translúcida */
--muted-foreground: #b8b8c8       /* gris claro distinguible */
--grid: rgba(255,255,255,0.04)    /* grid sutilmente visible */
```

### `.light`
```
--background: #ffffff      /* blanco puro */
--card: #ededed           /* gris muy claro distintivo */
--popover: #e4e4e7        /* gris aún más oscuro */
--primary: #7c3aed        /* violeta oscuro */
--primary-foreground: #ffffff
--border: rgba(0,0,0,0.08)         /* línea negra translúcida */
--muted-foreground: #575261       /* gris oscuro distinguible */
--grid: rgba(124,58,237,0.06)      /* grid violeta muy sutil */
```

### `.rosepine-dark` (Noctalia Rosepine main)
```
--background: #191724      /* base Rosepine */
--card: #1f1d2e           /* surface Rosepine */
--popover: #26233a        /* overlay Rosepine */
--primary: #ebbcba        /* rose Rosepine (cálido) */
--primary-foreground: #191724
--muted-foreground: #c4bfd0       /* lilac claro */
```

### `.rosepine-light` (Noctalia Rosepine Dawn)
```
--background: #fffaf3      /* surface Rosepine (más claro) */
--card: #faf4ed           /* base Rosepine (más oscuro) */
--popover: #ebe5d5        /* overlay Dawn */
--primary: #d7827e        /* rose Dawn */
--primary-foreground: #ffffff
--muted-foreground: #44416b       /* lilac oscuro */
```

> ⚠️ **El bg y card están invertidos respecto a Rosepine Dawn oficial**. El original Rosepine Dawn usa base=#faf4ed (más claro) y surface=#fffaf3 (más blanco). Si seguís eso al pie de la letra, la card se "pierde" en el fondo. Este sistema invierte la jerarquía para que la card se distinga, conservando los colores reales pero reorganizando qué variable apunta a qué rol.

## 🛠️ Aplicación práctica en componentes

### Ejemplo 1: proyecto card
```tsx
<article
    className={`max-h-220 mx-auto rounded-xl flex bg-card 
                border border-border shadow-lg 
                ${isInConstruction 
                  ? "hover:ring-1 hover:ring-destructive" 
                  : "hover:border-ring"}`}
>
```

### Ejemplo 2: botón CTA primario
```tsx
<Button
  buttonBody="bg-primary text-primary-foreground 
             hover:opacity-90 transition-opacity 
             font-semibold"
  txt="Hablemos"
/>
```

### Ejemplo 3: input dentro de card
```tsx
<input
  className="w-full rounded-md p-3 bg-popover text-foreground 
             border-border focus:ring-2 focus:ring-ring 
             outline-none"
/>
```

### Ejemplo 4: badge destacado (soft + ring)
```tsx
<Title4
  className="bg-primary-soft text-primary 
             ring-1 ring-primary/40"
  txt="★ PROYECTO DESTACADO"
/>
```

### Ejemplo 5: separador visual
```tsx
{/* ❌ MAL — text-border es demasiado tenue (rgba), invisible */}
<span className="text-border">·</span>

{/* ✓ BIEN — usa muted-foreground que es gris visible */}
<span className="text-muted-foreground">·</span>
```

## 🎨 Cómo agregar una nueva paleta

### Paso 1 — Crear el selector CSS en `globals.css`

Tomar como plantilla una paleta existente (recomendado: `.light` por brevedad) y reemplazar valores:

```css
.mi-paleta {
  --background: #tu-color-mas-oscuro-oclaro;
  --background-foreground: #tu-foreground;
  --card: #un-paso-arriba;
  /* ... 36 vars total ... */
}
```

### Paso 2 — Registrar el nombre en `themeProvider.tsx`

```tsx
// src/components/hooks/themeProvider.tsx
<NextThemesProvider
  themes={["light", "dark", "rosepine-dark", "rosepine-light", "mi-paleta"]}
  ...
>
```

### Paso 3 — Registrar en `useTheme.tsx`

```tsx
export type Theme = "light" | "dark" | "rosepine-dark" | "rosepine-light" | "mi-paleta";
export const ThemeData: Theme[] = ["light", "dark", "rosepine-dark", "rosepine-light", "mi-paleta"];
```

### Paso 4 — Verificar

- `bunx tsc --noEmit` debe pasar.
- Verificar visualmente: la paleta debe tener contraste suficiente (Δ luminancia > 100 entre bg y muted-foreground).
- Los componentes no necesitan tocarse: las utilities (`bg-background`, `text-foreground`) ya están en `@theme`.

## ⚠️ Errores comunes que NO debo repetir

| ❌ Error | ✓ Fix |
|---|---|
| `className="border shadow-lg"` | `className="border border-border shadow-lg"` (ancho + color) |
| `className="text-background"` (pensando que era texto principal) | `className="text-foreground"` (foreground) o `text-primary-foreground` (sobre `bg-primary`) |
| `className="bg-border/20"` para skeleton | `className="bg-muted"` (muted-foreground existe, border NO) |
| `className="text-body"` (no existe) | `className="text-muted-foreground"` |
| `className="text-wrap: balance"` (typo con espacio y `:`) | `className="text-wrap-balance"` |
| `className="border bordear-subtle"` (typo) | `className="border"` |
| `className="border border border-glow"` (triple) | `className="border border-glow"` (ancho + color juntos) |
| `className="text-white"` hardcoded | `className="text-primary-foreground"` |
| `className="bg-slate-900/50 border-slate-800"` | `className="bg-popover border-border"` (sin colores hardcoded) |
| `className="text-border"` para separador visual | `className="text-muted-foreground"` (más visible) |

> **Regla nemotécnica**: si el color que necesitás no está en `@theme` de `globals.css`, NO está en el sistema. Buscá un alias semántico (`bg-muted`, `bg-popover`, `text-foreground`) antes de hardcodear.

## 🔍 Cómo encontrar más paletas de colores

Esta sección es un índice de dónde sacar paletas para futuros temas del proyecto o nuevos proyectos con este mismo sistema.

### 1. Noctalia Rosepine (recomendado para empezar)

Este proyecto usa Rosepine. La paleta oficial viene del proyecto Noctalia shell.

- **Repo del proyecto**: <https://github.com/noctalia-dev/noctalia-shell/tree/main/Modules/ThemeManager>
- **Paleta oficial Rosepine**: <https://rosepinetheme.com/palette>
- **3 variantes**: Main (default), Moon (más oscuro), Dawn (light)
- **Colores**: 15 roles: `base`, `surface`, `overlay`, `muted`, `subtle`, `text`, `love`, `gold`, `rose`, `pine`, `foam`, `iris`, `highlightLow/Med/High`
- **Cómo aplicarlo**: mapeá esos 15 a tu sistema de 36 vars (ej: `base → background`, `surface → card`, etc.). El mapeo exacto está en Noctalia.

### 2. shadcn/ui / Radix official colors (estándar 2026)

- **Documentación**: <https://ui.shadcn.com/docs/theming>
- **Herramienta de color picker**: <https://shadcnstudio.com/theme-generator>
- **Tokens**: `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`
- **Por qué usarlo**: shadcn es el estándar de facto 2026 para componentes accesibles. Este proyecto ya lo sigue 100%.

### 3. Material Design 3 (Google)

- **Color roles**: <https://m3.material.io/styles/color/roles>
- **Colores primarios**: Primary, Secondary, Tertiary, Error, Neutral, Neutral Variant
- **Cómo aplicarlo**: Material 3 genera paletas con `M3 Theme Builder` (<https://material-foundation.github.io/material-theme-builder/>).

### 4. Tailwind v4 OKLCH palette generator

- **Generador**: <https://tailwind.ink/>
- **Por qué usarlo**: genera paletas en `oklch()` con contraste WCAG garantizado. Útil para paletas custom que respetan accesibilidad sin tener que ajustar manualmente.

### 5. Catppuccin (paleta nocturna usada por Noctalia esta máquina)

- **Repo**: <https://github.com/catppuccin/catppuccin>
- **4 variantes**: Latte (light), Frappé, Macchiato, Mocha
- **16 colores**: Rosewater, Flamingo, Pink, Mauve, Red, Maroon, Peach, Yellow, Green, Teal, Sky, Sapphire, Blue, Lavender, Text, Subtext1/2, Overlay1/2, Surface0/1/2, Base, Mantle, Crust
- **Por qué Catppuccin**: es la paleta más balanceada y completa de las 4 alternativas. Vale la pena tener una paleta Catppuccin lista para usar en proyectos futuros.

### 6. Dracula (popular, alto contraste)

- <https://draculatheme.com/>
- Genera solo dark mode por defecto. Útil para dashboards.

### 7. Nord (minimalista, escandinavo)

- <https://www.nordtheme.com/>
- Polars-night más polar-day. Mapeable a `--bg-page` y `--card`.

### 8. Tokyo Night

- <https://github.com/enkia/tokyo-night-vscode>
- 4 variantes. Buena para IDEs-style.

### 🔧 Recursos para extracción automática

- **Themer.js**: <https://themer.js.org/> — extrae paletas de imágenes (screenshots).
- **Coolors.co**: <https://coolors.co/> — generador de paletas con contraste automático.
- **Realtime Colors**: <https://www.realtimecolors.com/> — preview en tiempo real de cualquier color sobre distintos fondos.
- **ColorHub**: <https://colorhub.vercel.app/> — genera paletas a partir de color base.

### 📋 Procedimiento para crear una paleta custom

1. **Elegir fuente**: tomá una paleta de las fuentes arriba o generá una con `tailwind.ink` o `coolors.co`.
2. **Verificar contraste**: usá [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — el delta entre bg y `muted-foreground` debe ser > 100 en luminancia (este proyecto usa 165-186).
3. **Mapear 36 variables**: cada paleta necesita las 36 vars del sistema. Si la fuente tiene menos, completá con valores derivados (ej: `--secondary` = alias de `--popover`).
4. **Pegar en `globals.css`** bajo un selector nuevo (`.mi-paleta { ... }`).
5. **Registrar en `useTheme.tsx` y `themeProvider.tsx`** (2 archivos).
6. **Verificar**: tsc pasa, server arranca, navegar y probar las 4 paletas.

## 🏋️ Ejercicios

### Ejercicio 1 — Agregar una paleta Catppuccin Mocha

**Enunciado**: Duplicar el bloque `.dark` en `globals.css`, renombralo a `.catppuccin`, y reemplazá los valores con la paleta Catppuccin Mocha oficial. Registrá en `useTheme.tsx` y `themeProvider.tsx`. Verificá que el toggle muestra 5 paletas y que `--muted-foreground` tiene contraste > 100 contra `--background`.

**Resultado esperado**: Al hacer `setTheme("catppuccin")` en consola, el `<html>` debería tener `class="catppuccin"` y todos los componentes se rerenderizan con los nuevos colores. Mismas utilities (`bg-card`, `text-foreground`, `border-border-border`) funcionan porque están en `@theme`.

### Ejercicio 2 — Diagnóstico de regresión

**Enunciado**: Cambiar `--muted-foreground` de `.light` a `#cccccc` (un gris demasiado claro). Recargar la página. Identificar qué elementos UI se rompen visualmente.

**Resultado esperado**: Los textos secundarios (descripciones de proyectos, párrafos de AboutMe, copyright del footer, labels de inputs) se vuelven casi invisibles contra el fondo blanco. Esto valida que `--muted-foreground` controla exactamente esos elementos y nada más.

### Ejercicio 3 — Revisión de paleta custom

**Enunciado**: Crear una paleta `.dracula` con los colores de Dracula theme. Mapeo: `--background: #282a36`, `--card: #44475a`, `--popover: #6272a4` (interpolado), etc. Verificar que el patrón shadcn se mantiene (dark bg oscuro, card más clara).

**Resultado esperado**: Aprender el flujo completo de agregar paleta: 5 archivos tocados (`globals.css`, `useTheme.tsx`, `themeProvider.tsx`, `types.ts`, `theme-switcher si querés UI`). Sin tocar ningún componente.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/theming-v2-flow.md]] — flujo end-to-end del theming (globals.css → componente)
- [[learning/frontend/css/themes/themes-next-themes]] — cómo funciona `next-themes`
- [[learning/frontend/css/themes/themes-css-variables-vite.md]] — patrón equivalente para SPA pura
- [[learning/frontend/css/colors/color-palette-catalog]] — de dónde sacar paletas nuevas
- [[learning/projects/portfolio-v2/architecture]] — arquitectura general del proyecto
- Grafo Graphify: `~/Documents/Github/Portfolio-v2/docs/graph/graphify-out/GRAPH_REPORT.md` (nodo `components_hooks_theming_v2` + edges manuales que conectan el sistema con `app/globals.css`, `ProjectCard`, `ThemeSwitcher`, `ThemeToggle`, `BackgroundFX`, `useTheme`, `themeProvider`, `layout`)
