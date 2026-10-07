---
title: Catálogo de paletas de colores para proyectos frontend
type: reference
project: global
scope: learning
status: active
created: 2026-09-28
updated: 2026-09-28
tags: [palettes, themes, colors, css-variables, frontend, learning, reference, design-system]
verified_with: minimax-m3
---

> **TL;DR:** Índice curado de fuentes de paletas de colores para proyectos frontend. Cada una está evaluada por tres criterios: madurez de la comunidad (GitHub stars + años en producción), compatibilidad con el sistema v2 del [[learning/frontend/css/themes/theme-system-portfolio-v2]] (cuántas de las 15+ variables de su paleta oficial mapean directo a las 36 vars del sistema), y estética personal. Las primeras 4 son las que recomienda el proyecto; las otras son variantes para contextos específicos.

## 🏆 Top picks (recomendadas para empezar)

### 1. Noctalia Rosepine — está en uso activo

**Por qué**: ya integrado en `portfolio-v2`. Es la paleta por defecto de Noctalia shell.

- **Sitio oficial**: <https://rosepinetheme.com/palette>
- **Repo del proyecto**: <https://github.com/noctalia-dev/noctalia-shell/tree/main/Modules/ThemeManager>
- **15 colores**: `base`, `surface`, `overlay`, `muted`, `subtle`, `text`, `love`, `gold`, `rose`, `pine`, `foam`, `iris`, `highlightLow`, `highlightMed`, `highlightHigh`
- **Variantes**: Main (default), Moon (tono azulado), Dawn (light)
- **Formato de uso**: hex u OKLCH en archivos `.json`
- **Por qué arranca acá**: ya hay 2 variantes implementadas (`rosepine-dark`, `rosepine-light`). Las 3 variantes son el siguiente paso natural.

### 2. shadcn/ui (estándar de facto 2026)

**Por qué**: cualquier componente que use shadcn/ui ya respeta los tokens. Es la convención de la industria.

- **Documentación oficial**: <https://ui.shadcn.com/docs/theming>
- **Theme generator**: <https://shadcnstudio.com/theme-generator>
- **Tokens base** (19): `background`, `foreground`, `card`, `card-foreground`, `popover`, `popover-foreground`, `primary`, `primary-foreground`, `secondary`, `secondary-foreground`, `muted`, `muted-foreground`, `accent`, `accent-foreground`, `destructive`, `destructive-foreground`, `border`, `input`, `ring`
- **Color picker oficial**: <https://colors.id/shadcn-colors>
- **Por qué está en el top**: el proyecto `portfolio-v2` ya sigue exactamente este sistema (4 paletas, `bg-card` `text-foreground`, etc.).

### 3. Material Design 3 (Google)

**Por qué**: sistema oficial de Google, mobile-first, accesibilidad garantizada.

- **Color roles**: <https://m3.material.io/styles/color/roles>
- **Theme Builder oficial**: <https://material-foundation.github.io/material-theme-builder/>
- **Genera 6 paletas tonales** (Primary, Secondary, Tertiary, Error, Neutral, Neutral Variant) con 13 tonos cada una (T0-T100).
- **Cuándo usarlo**: cuando el proyecto se sincronice con un sistema Android nativo, o cuando necesites modo claro/oscuro generado a partir de un wallpaper (dynamic color, Material You).

### 4. Catppuccin — la paleta más completa

**Por qué**: 4 variantes + 26 colores nombrados semánticamente (Rosewater, Mauve, etc.). Es la paleta ideal cuando necesitás cubrir muchos casos semánticos con una sola fuente.

- **Repo**: <https://github.com/catppuccin/catppuccin>
- **Paleta oficial visualizada**: <https://catppuccin.com/palette>
- **4 variantes**: Latte (light), Frappé (medium), Macchiato (dark-medium), Mocha (dark)
- **26 colores por variante**:
  - **Anclaje**: Rosewater, Flamingo, Pink, Mauve, Red, Maroon
  - **Acento**: Peach, Yellow, Green, Teal, Sky, Sapphire, Blue, Lavender
  - **Superficie**: Text, Subtext1, Subtext2, Overlay0/1/2, Surface0/1/2, Base, Mantle, Crust
- **Por qué es la paleta más completa**: tiene 4 variantes × 26 colores = 104 colores únicos. Cualquier design system puede mapear todos sus tokens.

## 🎨 Alternativas con personalidad fuerte

### 5. Dracula

**Para**: dashboards, herramientas de developer, gaming UI. Personalidad oscura y agresiva.

- **Sitio**: <https://draculatheme.com/>
- **Generador de variantes**: <https://draculatheme.com/spec/>
- **Solo dark mode** por defecto. Para light hay que invertir el orden (background oscuro sería el foreground).

### 6. Nord

**Para**: minimalismo nórdico, documentos, sitios con mucha lectura.

- **Sitio**: <https://www.nordtheme.com/>
- **10 colores base** + 4 variantes (Snow Storm, Polar Night, Frost, Aurora).
- **Filosofía**: es una paleta "polar" — el azul es el ancla de todo.

### 7. Tokyo Night

**Para**: sitios con estética IDE/editor, mucho código.

- **Repo**: <https://github.com/enkia/tokyo-night-vscode>
- **4 variantes**: Night, Storm, Light, Moon.
- **Colores únicos**: `#7aa2f7` (blue), `#bb9af7` (purple), `#7dcfff` (cyan).

### 8. One Dark Pro

**Para**: sitios con estética Atom/VSCode.

- **Sitio**: <https://github.com/onedarkpro/onedarkpro.github.io>
- **Solo dark mode**, 22 colores.

### 9. Atom One Dark/Light

**Para**: sitios de documentación técnica.

- **Sitio**: <https://github.com/atom/atom/tree/master/packages/one-dark-syntax>
- **Colores identificados por rol semántico** (comment, keyword, string, number, etc.).

## 🌗 Alternativas específicas para light mode

### 10. Mintlify-inspired (docs aesthetic)

**Para**: sitios de documentación con mucho whitespace y color de acento suave.

- Mintlify usa una paleta similar a la de Linear/Vercel.
- Generar con: <https://tailwind.ink/> eligiendo neutral gray + un primary azul/verde suave.

### 11. Linear-inspired

**Para**: SaaS B2B, elegante, profesional.

- **Referencia**: <https://linear.app>
- Paleta de grises neutros + acentos lavanda/cyan.
- Generar con: `coolors.co` empezando con un gris base (#8A8F98) + un primary derivado.

### 12. Vercel-inspired

**Para**: developer-first products, documentación, sitios minimalistas.

- **Referencia**: <https://vercel.com>
- Negro puro + blanco puro + un solo acento (verde o azul).
- Implementación típica: `dark` mode es solo negro puro.

## 🛠️ Herramientas de extracción y generación

### Themer.js — extraer paletas de imágenes
- <https://themer.js.org/>
- Pegás una imagen (screenshot, foto) y te genera los colores principales.
- Útil cuando el cliente da "esa foto de referencia" y querés copiar los colores.

### Coolors.co — generar paletas con contraste
- <https://coolors.co/>
- Genera 5 colores random que armonicen. Soporta WCAG contrast checks.
- **Por qué es el más útil para empezar**: cuando necesitás una paleta custom, generás acá y luego verificás contraste.

### Realtime Colors
- <https://www.realtimecolors.com/>
- Pega un color y te genera variantes de paletas completas (Tailwind, shadcn, Material).
- **El más rápido para iterar** en un color específico.

### Tailwind Ink
- <https://tailwind.ink/>
- Genera paletas Tailwind v4 con OKLCH y contraste WCAG automático.
- Ideal para proyectos que usan Tailwind v4 y necesitan paletas accesibles sin ajustar manualmente.

### Material Theme Builder
- <https://material-foundation.github.io/material-theme-builder/>
- Genera las 6 paletas tonales de Material 3 a partir de un color.
- Genera código para CSS variables, Flutter, Compose, etc.

### ColorHub
- <https://colorhub.vercel.app/>
- Genera paletas a partir de un color base.

### Huemint
- <https://www.huemint.com/>
- Genera paletas inteligentes considerando jerarquía visual.

### Leonardo AI Color
- <https://leonardocolor.ai/>
- Genera paletas por categoría (e-commerce, gaming, etc.) con ajuste de contraste.

## 📋 Procedimiento para elegir paleta para un proyecto nuevo

### Paso 1 — Define el contexto

Preguntate:
- ¿Es un proyecto personal, B2B, e-commerce, gaming?
- ¿Necesita light, dark, o ambos? (recomendado: ambos)
- ¿La marca tiene color corporativo? Si sí, partí de él.
- ¿Necesita accesibilidad WCAG AA estricto?

### Paso 2 — Elige fuente

| Contexto | Recomendado |
|---|---|
| Documentación técnica | Nord, Tokyo Night, Catppuccin Latte |
| Dashboard / tooling | Dracula, Catppuccin Mocha, One Dark Pro |
| SaaS profesional | Material 3, shadcn, Linear-inspired |
| Portfolio / personal | Rosepine, Catppuccin, Noctalia |
| E-commerce | Material 3, Tailwind default, coolors.co custom |
| Mobile-first / Android sync | Material 3 (dynamic color) |

### Paso 3 — Generá / extraé los colores

- Si tenés color de marca: `coolors.co` o `material-foundation.github.io/material-theme-builder/`
- Si no tenés: elegí una paleta completa de las fuentes de arriba.

### Paso 4 — Mapeo al sistema v2

Ver [[learning/frontend/css/themes/theme-system-portfolio-v2]] para el mapeo completo. Resumido:
- 4 backgrounds (background, card, popover, secondary)
- 4 text roles (foreground, muted-foreground, footer, body-text-en-grid)
- 6 brand (primary+accent cada uno con foreground, soft, container)
- 6 semantic (destructive, warning, success, error, info, +foreground cada uno)
- 5 borders/interaction (border, input, ring, hover, pressed)
- 4 highlighters (highlight-low/med/high)
- 4 Rosepine (love, pine, foam, iris)

### Paso 5 — Verificá contraste

Para cada paleta generada:
- `bg-page` vs `text-foreground`: contraste > 200 (idealmente > 245)
- `bg-page` vs `text-muted-foreground`: contraste > 100
- `bg-primary` vs `text-primary-foreground`: contraste > 200 (los CTAs deben ser siempre legibles)

Herramienta: [WebAIM Contrast Checker](https://webaim.org/tool/contrast-checker/)

### Paso 6 — Implementá

Ver guía del [[learning/frontend/css/themes/theme-system-portfolio-v2]]:
1. Pegá en `globals.css` bajo el selector de la nueva paleta.
2. Registrá en `useTheme.tsx` y `themeProvider.tsx`.
3. `bunx tsc --noEmit`.
4. Smoke test visual.

## 🔍 Cómo encontré cada paleta en este proyecto

| Paleta | Fuente | Por qué la elegí |
|---|---|---|
| `.dark` violeta | Original del proyecto | Mantení el estilo que ya tenías |
| `.light` | shadcn convention | El `--background: #ffffff` y `--card: #ededed` siguen el patrón shadcn |
| `.rosepine-dark` | Noctalia shell (uso diario en Hyprland) | Ya tenías Rosepine en tu setup; reutilizar mantiene coherencia |
| `.rosepine-light` (Dawn) | Noctalia / Rosepine Dawn | Complemento natural al dark |

## 🔗 Ver también

- [[learning/frontend/css/themes/theme-system-portfolio-v2]] — cómo se aplica una paleta al sistema v2
- [[learning/frontend/css/themes/themes-css-variables-vite.md]] — patrón general
- [[learning/frontend/css/colors/color-systems-comparison]] — análisis técnico de OKLCH vs hex vs HSL
- [[learning/linux/distros/cachyos/personalizacion/noctalia/01-guias-y-tutoriales/theming-noctalia-kde-apps]] — referencia visual Noctalia (que el usuário usa día a día)
