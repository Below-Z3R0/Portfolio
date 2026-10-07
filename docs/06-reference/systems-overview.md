---
title: "Portfolio-v2 — Overview de sistemas y arquitectura"
type: overview
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [overview, architecture, systems, portfolio-v2, mental-model, how-it-works]
verified_with: minimax-m3
---

> **TL;DR:** El portfolio-v2 es un Next.js 16 App Router con TypeScript strict, Tailwind v4 (sistema theming v2 con 4 paletas), Supabase como headless CMS, Motion (LazyMotion + 7 wrappers level-based), EmailJS para el formulario de contacto, y un sistema de assets dual (imágenes raster vía custom loader + SVGs inline con registry tipado). Esta es la **guía raíz** que conecta los 14 docs de sistemas individuales. Después de leer esta overview, sabés dónde está cada cosa y cómo se conecta con las demás.

## 🎯 El proyecto en 1 párrafo

> Un portfolio personal bilingüe (ES/EN) con datos dinámicos desde Supabase, 4 paletas de tema (dark, light, rosepine-dark, rosepine-light), animaciones con Motion, formulario de contacto vía EmailJS, e imágenes raster optimizadas con un custom loader de Next.js. Sin tests, sin CI, sin sitemap — funcional pero minimalista.

## 🗺️ El mapa de sistemas (14 docs individuales)

### 1. Capa de presentación

| Sistema | Doc | Comunidad del grafo | Estado |
|---|---|---|---|
| Theming v2 | [[sistema-theming-v2]] | 5, 7, 8 | ✅ 100% documentado |
| Motion (animaciones) | [[sistema-motion]] | 0 | ✅ 100% documentado |
| Loading / Skeletons | [[sistema-loading-skeletons]] | 6 | ✅ 100% documentado |
| AnimatePresence (exit anims) | [[sistema-animate-presence]] | 0 | ✅ 100% documentado |
| UI base (atoms + molecules) | [[sistema-ui-base]] | 0, 1 | ✅ 100% documentado |
| Modal + Form + EmailJS | [[sistema-modal-formulario-emailjs]] | 0 | ✅ 100% documentado |
| Header / Navegación | [[sistema-header-navegacion]] | 0, 9 | ✅ 100% documentado |

### 2. Capa de datos

| Sistema | Doc | Comunidad del grafo | Estado |
|---|---|---|---|
| DB + Supabase (headless CMS) | [[sistema-db-supabase]] | 3 | ✅ 100% documentado |
| Orquestador | [[sistema-orquestador]] | 2 | ✅ 100% documentado |
| Sistema de imágenes (dual: raster + SVG) | [[sistema-imagenes-svg]] | 4, 10 | ✅ 100% documentado |
| i18n multi-idioma | [[sistema-i18n]] | 5 | ✅ 100% documentado |
| Manejo de errores | [[sistema-errores]] | (cross-cutting) | ✅ 100% documentado |

### 3. Capa de infra

| Sistema | Doc | Comunidad del grafo | Estado |
|---|---|---|---|
| SEO + metadata + fuentes + ErrorBoundary | [[sistema-seo-metadata]] | 7 | ✅ 100% documentado |
| Barrel + type helpers | [[sistema-barrel-type-helpers]] | (cross-cutting) | ✅ 100% documentado |
| Testing / CI / Deploy (gap) | [[sistema-testing-ci-deploy]] | — | ⚠️ Documentado como gap (no existe) |

**Total**: 14 docs individuales + 1 overview = **15 archivos** en el directorio.

## 🧩 El grafo de Graphify (266 nodos, 553 edges, 18 comunidades)

```bash
# Regenerar el grafo
cd ~/Documents/Github/Portfolio-v2/portfolio-v2
source .venv/bin/activate
graphify extract src/ --out docs/graph/
graphify cluster-only docs/graph/
python3 docs/graph/restore-theming-edges.py
```

Output:
- 266 nodos
- 553 edges
- 18 comunidades

Las comunidades reflejan los **sistemas** que detecta el clustering automático. Cada `*` en la columna "Comunidad del grafo" arriba es la comunidad que el algoritmo detectó.

## 🔗 Diagrama de relaciones (high level)

```
┌─────────────────────────────────────────────────────────────────┐
│                     USUARIO (Browser)                             │
└────────────┬────────────────────────────────────────────────────┘
             │ GET /?lang=es
             ↓
┌─────────────────────────────────────────────────────────────────┐
│  Next.js 16 (App Router + Turbopack + RSC)                        │
│  app/page.tsx (Server Component, async)                           │
└────────────┬────────────────────────────────────────────────────┘
             │ await getGeneralData(lang)
             ↓
┌─────────────────────────────────────────────────────────────────┐
│  ORQUESTADOR (generaldata.service.ts)                            │
│  17 queries en Promise.all (8 content + 9 metadata)              │
│  Valida con Zod schemas                                         │
└─────┬──────────────┬───────────────┬────────────────────────────┘
      │              │               │
      ↓              ↓               ↓
┌──────────┐  ┌──────────────┐  ┌────────────────┐
│ Supabase │  │ EmailJS      │  │ Custom loader  │
│ (Postgres)│ │ (env vars)    │  │ (Supabase      │
│ 3 tablas  │ │ 4 env vars   │  │  Storage)      │
└──────────┘  └──────────────┘  └────────────────┘
      ↓              ↓               ↓
┌─────────────────────────────────────────────────────────────────┐
│  UI: 7 organismos (atomos + molecules)                          │
│  - HeroSection / SkillsSection / ProjectsSection                │
│  - AboutMeSection / ContactSection / Footer / Header            │
│  - Modal (proyecto), SuccessMessage, ErrorMessage, Formulary     │
│  - ThemeSwitcher, LanguageToggle, IconRender, BackgroundFX        │
└─────┬──────────────────────────────────────────────────────────┘
      │
      ↓
┌─────────────────────────────────────────────────────────────────┐
│  SHADCN + Motion + Theming v2 (4 paletas)                         │
│  - bg-card, text-foreground, ring-1                             │
│  - m.div (LazyMotion + domAnimation, 4.6KB)                     │
│  - .dark, .light, .rosepine-dark, .rosepine-light                │
└─────────────────────────────────────────────────────────────────┘
```

## 📦 El inventario de archivos (organizado por sistema)

### Source code (50 archivos)

| Directorio | Archivos | Sistema |
|---|---|---|
| `src/app/` | layout.tsx, page.tsx, error.tsx, loading.tsx, globals.css | SEO + loading + errorBoundary + theming |
| `src/components/atoms/` | 12 archivos | UI base (Button, LinkButton, Span, Title1-4, IconRender, ThemeSwitcher, etc.) |
| `src/components/molecules/` | 8 archivos | UI con lógica (NavBar, Formulary, ProjectCard, Modal, ErrorMessage, SuccessMessage, TecnologiesCard) |
| `src/components/organims/` | 9 archivos | Secciones (Header, HeroSection, SkillsSection, ProjectsSection, AboutMeSection, ContactSection, Footer, ErrorPage, IASection, OSSection) |
| `src/components/animations/` | 1 archivo + 1 index | Wrappers level-based (SectionReveal, StaggerGroup, etc.) |
| `src/components/skeletons/` | 7 archivos | Skeletons (HomePageSkeleton, NavBarSkeleton, etc.) |
| `src/components/hooks/` | 3 archivos | themeProvider, useTheme, theming.v2 (proxy types) |
| `src/components/` | types.ts, components.ts, schemas.ts | Tipos y schemas |
| `src/services/` | 5 archivos | Supabase clients, data/metadata services, icon-registry, Icons.tsx, supabase-image-loader |
| `next.config.ts` | — | reactCompiler + custom image loader |

### Vault docs (15 archivos)

```
/Knowledge/learning/projects/portfolio-v2/
├── README.md, architecture.md, decisions.md        (existente)
├── setup.md, dependencies.md, usage.md               (existente)
├── theming-v2-flow.md                                (loop 1)
├── motion-integration-guide.md                       (loop 1)
├── db-supabase-headless-cms.md                       (loop 3)
├── orquestador-generaldata-service.md                (loop 3)
├── sistema-imagenes-svg-image.md                     (loop 3)
├── sistema-ui-base-atoms-molecules.md                (loop 3)
├── sistema-modal-formulario-emailjs.md               (loop 3)
├── sistema-loading-skeletons.md                      (loop 3)
├── sistema-header-navegacion.md                      (loop 3)
├── sistema-i18n-multi-idioma.md                      (loop 3)
├── sistema-animate-presence-exit-animations.md       (loop 3)
├── sistema-seo-metadata-fonts-errorboundary.md       (loop 3)
├── sistema-testing-ci-deploy-gap.md                  (loop 3)
├── sistema-manejo-errores.md                         (loop 3)
├── sistema-barrel-type-helpers.md                   (loop 3)
├── sistema-fuentes-next-font.md                      (loop 3)
└── PORTFOLIO-V2-SYSTEMS-OVERVIEW.md (este archivo) (loop 3)
```

## 🔄 Los 5 flujos críticos (cómo interactúan los sistemas)

### Flujo 1: El usuario abre `/`

```
Browser GET /
  → Next.js: app/page.tsx es async, renderiza app/loading.tsx (HomePageSkeleton)
  → Browser ve skeleton ~250-400ms
  → app/page.tsx ejecuta: const currentLang = searchParams.lang || "es"
  → await getGeneralData("es")
    → 17 queries en paralelo a Supabase
    → Zod valida cada bloque
  → Next.js hace streaming swap: skeleton → contenido
  → Browser ve la home en español
  → ThemeSwitcher ya está hidratado (atributo class="dark" en <html>)
```

### Flujo 2: El usuario cambia de tema

```
Browser click en ThemeSwitcher
  → setTheme("rosepine-dark")
  → next-themes: setea class="rosepine-dark" en <html>
  → CSS globals.css: selector .rosepine-dark { --primary: #ebbcba; --card: #1f1d2e; ... }
  → Todos los bg-primary, text-foreground, border-border... se actualizan
  → Sin re-render de React (es CSS puro)
```

### Flujo 3: El usuario abre el modal de un proyecto

```
Browser click en ProjectCard
  → setActivetxt/setOpenModal (state local en ProjectCard)
  → Renderiza <Modal ...> con motion
  → m.div backdrop fade-in + m.div modal spring scale
  → Click en tecnología: setActivetxt(item.description)
  → Description updates (motion is only visual, not data)
```

### Flujo 4: El usuario envía el formulario

```
Browser click "Enviar" en Formulary
  → emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY })
  → EmailJS ejecuta el template
  → EmailJS manda 2 emails (admin + auto-reply al user)
  → setStatus("success") + reset()
  → <SuccessMessage> aparece con checkmark animado
  → Click "Cerrar" → setStatus("idle")
  → Form se limpia, modal desaparece
```

### Flujo 5: La BD cambia (admin edita Supabase)

```
Admin edita translations.content en Supabase Dashboard
  → (próximo deploy) bun run gen-types regenera src/types
  → Tipos de PortfolioClient reflejan nueva columna
  → TypeScript detecta el cambio en `getData` (si accedes a la nueva columna)
  → Si el cambio rompe un schema Zod, `bun run build` falla
  → Si pasa, deploy se hace con la nueva data
```

## 🎓 Los 3 principios arquitectónicos del proyecto

### 1. **Separation of concerns (data vs UI vs presentation)**

- **Data** (services + schemas): `getData<T>`, `getMetaData<T>`, Zod schemas.
- **UI base** (atoms + molecules): componentes puros que no hacen fetch.
- **Presentation** (organisms): secciones que reciben data del orquestador y la renderizan con la UI base.

### 2. **Tipado end-to-end (SQL → componente)**

- SQL → `Database` type (gen types) → `PortfolioClient` → `getData<T>` → `z.infer<T>` → props del componente.
- **Cada capa valida con tipos**, no con `any` ni con `unknown`.

### 3. **Theme v2 como sistema cohesivo (no hardcoded)**

- 4 paletas (dark, light, rosepine-dark, rosepine-light).
- 36 vars por paleta, `as const satisfies Record<string, IconComponent>`.
- `<m.div>` con `<LazyMotion features={domAnimation}>` (bundle optimizado).
- `<AnimatePresence>` para exit animations.

## ⚠️ Los 3 gaps más importantes del proyecto

### 1. **No hay tests, CI, ni deploy explícito** (cubierto en [[sistema-testing-ci-deploy-gap]])

### 2. **No hay i18n de metadata** (cubierto en [[sistema-seo-metadata]])

- `<html lang="en">` hardcoded.
- `metadata.title` estático.
- Texto UI (botones, labels) hardcoded en español.

### 3. **No hay fallback en errores** (cubierto en [[sistema-manejo-errores]])

- Si Supabase está caído → throw → ErrorBoundary.
- No hay cache, no hay retry exponencial, no hay fallback a datos hardcoded.

## 🚀 Cómo extender el proyecto (guía rápida)

| Necesidad | Acción |
|---|---|
| Agregar un nuevo idioma | INSERT en `languages` + `translations` + actualizar `LanguageToggle` |
| Agregar un nuevo color al theme | Agregar en `globals.css` (los 4 bloques de paleta) |
| Agregar un nuevo ícono | Agregar `<MiIcono>` en `Icons.tsx` + registrar en `ICON_REGISTRY` |
| Agregar una nueva sección al home | Crear `<MiSeccion>` molecule + skeleton + schema Zod + agregar al orquestador |
| Agregar un nuevo campo al form | Editar `SendEmailSchema` en `schemas.ts` + ajustar `Formulary` (UI) |
| Cambiar contenido (texto, links) | UPDATE en Supabase Dashboard (no deploy) |
| Cambiar diseño (color, font, spacing) | Editar `globals.css` (los 4 bloques) |

## 🔗 Ver también

- [[learning/frontend/css/themes/theme-system-portfolio-v2]] (sistema theming v2)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (flujo theming)
- [[learning/projects/portfolio-v2/motion-integration-guide]] (motion)
- [[learning/frontend/css/colors/color-palette-catalog]] (paletas)
- [[learning/frontend/frameworks/next-js/libraries/next-themes/next-themes-app-router-turbopack]] (next-themes)
- [[learning/frontend/css/libraries/motion/motion-index]] (motion)
- ADR-009: `attribute="class"` en next-themes
- ADR-013: Tipado automático con `supabase gen types`
- ADR-018: Arquitectura de tipado en 3 capas
- ADR-019: page.tsx como único orquestador de queries

## Próximo paso

**Esta es la overview final.** Cubre los 14 sistemas individuales + 1 overview. Si querés un sistema adicional (no cubierto), o un refactor de uno existente, decime. Si no, el trabajo de documentación está completo.

**Estado del vault de portfolio-v2**:
- 26 archivos en el directorio.
- 15 archivos de documentación (15 de este loop + 1 overview + 1 de este turno).
- 11 docs de sistemas + 1 testing + 1 SEO + 1 i18n + 1 AnimatePresence + 1 errores + 1 fuentes + 1 barrel.
