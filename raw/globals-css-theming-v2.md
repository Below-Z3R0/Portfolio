# globals.css — Theming v2 (fuente de verdad del sistema de estilos de portfolio-v2)

> **Propósito**: Este archivo es el corazón del sistema de theming de portfolio-v2. Define 36 variables CSS por cada una de las 4 paletas (`.dark`, `.light`, `.rosepine-dark`, `.rosepine-light`), más 4 utility classes custom (`.bg-fx`, `.bg-grid`, `.bg-fx__noise`, `.bg-fx__vignette`). Tailwind v4 genera `bg-*`, `text-*`, `border-*`, `ring-*` automaticamente desde el bloque `@theme` que mapea `--color-X` aliases.

## Ubicación

`src/app/globals.css` (429 líneas).

## Estructura

### 1. `@import "tailwindcss"` (línea 1)

Necesario para que Tailwind v4 procese las directivas `@theme` y procese los utilities en archivos `.tsx`.

### 2. Bloque `@theme` (líneas 17-91)

Conecta variables CSS crudas con utilities Tailwind. **NO** se ponen valores literales acá, solo aliases:

```css
@theme {
  --color-background: var(--background);
  --color-card: var(--card);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ...45 aliases total... */
  --font-display: "Inter", sans-serif;
  --breakpoint-qw: 921px;
}
```

**Genera utilities**: `bg-background`, `bg-card`, `bg-primary`, `text-foreground`, `border-border`, `ring-1`, etc.

### 3. Bloques `.dark / .light / .rosepine-dark / .rosepine-light` (líneas 93-362)

Cada selector define las **36 variables literales** para su paleta. Cuatro paletas × 36 vars = 144 valores explícitos.

**Jerarquía global (universal en todas las paletas):**
- En `.dark` y `.rosepine-dark`: `bg < card < popover` (luminosidad ascendente).
- En `.light` y `.rosepine-light`: `bg > card > popover` (luminosidad descendente en términos de "más blanco").

### 4. Reglas utility custom del proyecto (líneas 364-429)

Estas no son utilities de Tailwind, son CSS puro que el proyecto define:

```css
.bg-grid {
  background-image:
    linear-gradient(to right, var(--grid) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid) 1px, transparent 1px);
  background-size: 48px 48px;
}

.bg-fx__noise {
  mix-blend-mode: soft-light;
  opacity: 0.6;
}

.bg-fx__vignette {
  background: radial-gradient(ellipse 80% 70% at 50% 45%, ...);
}
```

Las usa el componente `BackgroundFX` (`src/components/atoms/BackgroundFX.tsx`).

## Las 36 variables por paleta

| Categoría | Variables |
|---|---|
| Backgrounds | `--background`, `--background-foreground`, `--card`, `--card-foreground`, `--popover`, `--popover-foreground` |
| Primary | `--primary`, `--primary-foreground`, `--primary-soft`, `--primary-container`, `--primary-container-foreground` |
| Estructura | `--secondary`, `--secondary-foreground`, `--tertiary`, `--tertiary-foreground` |
| Muted | `--muted`, `--muted-foreground` |
| Accent | `--accent`, `--accent-foreground` |
| Semánticos (estado) | `--destructive`, `--destructive-foreground`, `--destructive-soft`, `--warning`, `--warning-foreground`, `--warning-soft`, `--success`, `--success-foreground`, `--success-soft` |
| Bordes | `--border`, `--border-foreground`, `--border-glow`, `--input`, `--ring` |
| Interacción | `--hover`, `--pressed` |
| Texto | `--foreground`, `--footer`, `--grid` |
| Rosepine | `--love`, `--pine`, `--foam`, `--iris`, `--highlight-low`, `--highlight-med`, `--highlight-high` |

**Total: 36 variables por paleta × 4 paletas = 144 valores explícitos en `globals.css`.**

## Cómo funciona end-to-end

```
globals.css (define 36 vars por paleta)
    ↓ @theme aliasing
@theme { --color-X: var(--X); }
    ↓ Tailwind v4 genera
.bg-X { background-color: var(--color-X); }
    ↓ usado en componentes
<article className="bg-card ...">
    ↓ se aplica al DOM
background-color → resuelve a var(--card)
    ↓ CSS variable resolver
var(--card) → resuelve al valor de la paleta activa
    ↓ el color aparece en pantalla
```

## Diferencias entre las 4 paletas (resumen)

| Token | `.dark` | `.light` | `.rosepine-dark` | `.rosepine-light` |
|---|---|---|---|---|
| `--background` | `#000000` | `#ffffff` | `#191724` | `#fffaf3` |
| `--card` | `#0a0a0a` | `#ededed` | `#1f1d2e` | `#faf4ed` |
| `--primary` | `#9466ff` | `#7c3aed` | `#ebbcba` | `#d7827e` |
| `--primary-foreground` | `#ffffff` | `#ffffff` | `#191724` | `#ffffff` |
| `--foreground` | `#fafafa` | `#09090b` | `#e0def4` | `#575279` |
| `--muted-foreground` | `#b8b8c8` | `#575261` | `#c4bfd0` | `#44416b` |
| `--accent` | `#8b5cf6` | `#7c3aed` | `#ebbcba` | `#d7827e` |
| `--destructive` | `#f87171` | `#dc2626` | `#eb6f92` | `#b4637a` |
| `--border` | `rgba(255,255,255,0.06)` | `rgba(0,0,0,0.08)` | `rgba(144,140,170,0.12)` | `rgba(25,23,36,0.12)` |

## Archivos relacionados

- `src/components/hooks/useTheme.tsx` — hook con tipos seguros para los 4 themes.
- `src/components/hooks/themeProvider.tsx` — wrapper que configura `next-themes` con `themes=[...]`.
- `src/components/atoms/ThemeSwitcher.tsx` — UI para elegir entre paletas.
- `src/components/atoms/BackgroundFX.tsx` — usa `.bg-grid`, `.bg-fx__noise`, `.bg-fx__vignette`.
- `src/app/layout.tsx` — monta `<ThemeProvider>` en el `<html>`.
- `Knowledge/learning/projects/portfolio-v2/theming-v2-flow.md` — flujo end-to-end completo.
- `Knowledge/learning/frontend/css/themes/theme-system-portfolio-v2.md` — referencia visual de las 4 paletas.
