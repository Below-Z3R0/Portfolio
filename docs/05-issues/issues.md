# ISSUES — portfolio-v2 (consolidado del loop 2026-10-05)

> **Este archivo es la fuente de verdad de TODOS los issues encontrados** en el audit del loop. Cada issue tiene un ID (`#001`, `#002`, etc.), prioridad, sistema al que pertenece, archivos afectados, y un plan de fix sugerido.
>
> **Regenerado en**: 2026-10-05
> **Fuentes**: lectura directa de archivos (`read_file`), `git diff`, `grep` por palabras clave, grafo de Graphify, y tests manuales del flujo.

## 🟢 Prioridad CRÍTICA (afecta funcionalidad core)

### #001 — `<html lang="en">` hardcoded

- **Sistema**: i18n + SEO
- **Archivos**: `app/layout.tsx:26`
- **Impacto**: SEO indexa el sitio como English, screen readers leen con pronunciation de English, OpenGraph `og:locale` incorrecto, browsers ofrecen traducción al inglés cuando está en español.
- **Fix**: middleware + leer `x-language` en `RootLayout` (cubierto en `sistema-i18n-metadata-extensions.md`).
- **Esfuerzo**: 30 min.

### #002 — `metadata.title` y `description` estáticos

- **Sistema**: SEO + i18n
- **Archivos**: `app/layout.tsx:18-21`
- **Impacto**: compartir en redes sociales siempre muestra "Emmanuel.dev" sin importar el idioma.
- **Fix**: `generateMetadata` async con `searchParams.lang` (cubierto en `sistema-i18n-metadata-extensions.md`).
- **Esfuerzo**: 1 hora.

### #003 — No hay tests, CI ni deploy explícito

- **Sistema**: infra / DevOps
- **Archivos**: `package.json`, no hay `.github/`, no hay `vercel.json`
- **Impacto**: regresiones no detectadas, deploy depende de defaults.
- **Fix**: tests de schemas + E2E básico + workflow CI (cubierto en `sistema-testing-ci-deploy-gap.md`).
- **Esfuerzo**: 2-3 días.

### #004 — No hay fallback en `data.service.ts`

- **Sistema**: data layer
- **Archivos**: `src/services/Data/data.service.ts:19-22`, `metadata.service.ts:17-20`
- **Impacto**: si Supabase está caído, la página rompe (no hay fallback a datos hardcoded ni cache).
- **Fix**: `try/catch` con cache en memoria + fallback a dict hardcoded.
- **Esfuerzo**: 1 día.

### #005 — `IconNameSchema` no se valida en `IconRender`

- **Sistema**: icon registry
- **Archivos**: `src/components/atoms/IconRender.tsx:6`
- **Impacto**: si el `name` no está en `ICON_REGISTRY`, renderiza `null` silenciosamente. **Bug visual sin error**.
- **Fix**: `IconNameSchema.safeParse(name).success` antes de lookup.
- **Esfuerzo**: 5 min.

## 🟡 Prioridad MEDIA (afecta mantenibilidad o robustez)

### #006 — `useEffect` con dependencias incorrectas o sin cleanup

- **Sistema**: varios (UI base, animations)
- **Archivos**: varios
- **Impacto**: re-renders innecesarios o memory leaks.
- **Fix**: revisar cada `useEffect`, agregar cleanup donde falte.
- **Esfuerzo**: 1-2 horas.

### #007 — `ProjectCard` comentado en el barrel

- **Sistema**: barrel + UI base
- **Archivos**: `src/components/components.ts:23`
- **Impacto**: inconsistente. Si un componente necesita `ProjectCard`, debe importar del path directo.
- **Fix**: descomentar y arreglar el bug de SSR en otro lado.
- **Esfuerzo**: 1-2 horas (investigar SSR bug).

### #008 — `Modal"` falta `;` (typo) en el barrel

- **Sistema**: barrel
- **Archivos**: `src/components/components.ts:26`
- **Impacto**: TypeScript probablemente lo tolera (es la última línea del bloque), pero es **DRY violation** de estilo.
- **Fix**: agregar `;`.
- **Esfuerzo**: 10 seg.

### #009 — `Modal` no usa `<AnimatePresence>`

- **Sistema**: AnimatePresence
- **Archivos**: `src/components/molecules/Modal.tsx`
- **Impacto**: el modal aparece con animación de entrada pero **NO tiene exit animation** cuando se desmonta.
- **Fix**: envolver en `<AnimatePresence>` (como `SuccessMessage` y `ErrorMessage`).
- **Esfuerzo**: 5 min.

### #010 — `BackgroundFX` redefine el filter SVG en cada render

- **Sistema**: assets / visual
- **Archivos**: `src/components/atoms/BackgroundFX.tsx:5-8`
- **Impacto**: el `<feTurbulence>` se renderiza en TODAS las páginas. **Issue de performance** en mobile.
- **Fix**: usar `useId()` para cachear el filter id, evitar re-crear.
- **Esfuerzo**: 30 min.

### #011 — `ModalProps.data` type con `extends ModalContent` es inválido

- **Sistema**: type system
- **Archivos**: `src/components/types.ts:114-127`
- **Impacto**: TypeScript estricto podría no compilar este patrón (`interface X extends Y` con propiedades nuevas). En el proyecto actual parece compilar pero es frágil.
- **Fix**: usar `type data = ModalContent & { category, title }` (intersection, no extends).
- **Esfuerzo**: 5 min.

### #012 — `<Image width={80} height={80}>` hardcoded en `Button`

- **Sistema**: assets / imagen
- **Archivos**: `src/components/atoms/Button.tsx:18-19`, `LinkButton.tsx:21-22`
- **Impacto**: si pasás un `image_key` que es una foto, el tamaño se ve mal (forzado a 80x80).
- **Fix**: el consumidor pasa `width`/`height` como props, o detectar el tipo de asset.
- **Esfuerzo**: 30 min.

### #013 — `HomePageSkeleton` redefine `SkeletonPulse` localmente

- **Sistema**: loading / skeletons
- **Archivos**: `src/components/skeletons/HomePageSkeleton.tsx:5-8`
- **Impacto**: DRY violation. La misma función está en `SkeletonPulse.tsx`.
- **Fix**: importar de `./SkeletonPulse`.
- **Esfuerzo**: 2 min.

### #014 — `OSSection` y `IASection` existen pero no se usan

- **Sistema**: barrel + organisms
- **Archivos**: `src/components/organims/OSSection.tsx`, `IASection.tsx`, `src/components/components.ts:34-35`
- **Impacto**: código muerto en el bundle. Bundle más grande innecesariamente.
- **Fix**: eliminar del barrel y de `generaldata.service.ts` (las líneas comentadas).
- **Esfuerzo**: 10 min.

### #015 — `themeProvider` y `layout.tsx` tienen defaults conflictivos

- **Sistema**: theming
- **Archivos**: `src/components/hooks/themeProvider.tsx`, `app/layout.tsx:33-39`
- **Impacto**: el wrapper pasa `defaultTheme="dark"`, `enableSystem={false}`. El layout pasa `enableSystem` (default true). El sistema real es mezclado.
- **Fix**: unificar la config. Recomendar borrar `themeProvider.tsx` y usar `NextThemesProvider` directo en `layout.tsx` con todas las props inline.
- **Esfuerzo**: 15 min.

## 🔵 Prioridad BAJA (afecta UX o polish)

### #016 — URLs internas no preservan `?lang=`

- **Sistema**: i18n
- **Archivos**: todos los `href="#Home"`, `href="#Tecnologies"`, etc.
- **Impacto**: el user pierde el lang al navegar internamente.
- **Fix**: middleware que preserva el lang, o wrapper de Link.
- **Esfuerzo**: 2-3 horas.

### #017 — No hay `prefers-reduced-motion` handler

- **Sistema**: accessibility
- **Archivos**: `Animations.tsx`, modales con motion
- **Impacto**: usuarios con `prefers-reduced-motion: reduce` activado ven todas las animaciones.
- **Fix**: leer el media query en `layout.tsx` y pasar a `ThemeProvider` y modales.
- **Esfuerzo**: 1 hora.

### #018 — No hay `sitemap.xml` ni `robots.txt`

- **Sistema**: SEO
- **Archivos**: no existen
- **Impacto**: Google no puede indexar bien.
- **Fix**: `app/sitemap.ts` + `app/robots.ts` (Next.js 16 conventions).
- **Esfuerzo**: 30 min.

### #019 — No hay i18n de strings UI (botones, labels)

- **Sistema**: i18n
- **Archivos**: `Formulary.tsx`, `SuccessMessage.tsx`, `ErrorMessage.tsx`, `LanguageToggle.tsx`
- **Impacto**: strings hardcoded en español, no se traducen al cambiar `?lang=`.
- **Fix**: implementar `next-intl` o un dict propio.
- **Esfuerzo**: 1-2 días.

### #020 — No hay fallback de idioma en el orquestador

- **Sistema**: i18n
- **Archivos**: `app/page.tsx:23`, `getGeneralData`
- **Impacto**: `?lang=pt` no existe en la BD → la query retorna 0 rows → Zod parse falla → `app/error.tsx` se renderiza.
- **Fix**: validar `lang` contra una lista permitida antes de pasar a `getGeneralData`.
- **Esfuerzo**: 30 min.

### #021 — `data.content` en la BD es JSONB libre

- **Sistema**: data layer
- **Archivos**: `schemas.ts` (todos los schemas)
- **Impacto**: la BD no valida el shape de `content`. Solo Zod lo hace en runtime.
- **Fix**: agregar CHECK constraints en Supabase (limitado), o validación de doble capa.
- **Esfuerzo**: depende del approach.

### #022 — `error.message` se expone al usuario sin sanitizar

- **Sistema**: error handling
- **Archivos**: `app/error.tsx:19`
- **Impacto**: `error.message` puede tener info interna (SQL, paths, etc.). **Riesgo de seguridad**.
- **Fix**: sanitizar el mensaje o mostrar uno genérico.
- **Esfuerzo**: 5 min.

### #023 — El `favicon.ico` es estático, sin `icon.svg` ni `apple-touch-icon`

- **Sistema**: SEO / assets
- **Archivos**: `public/favicon.ico`
- **Impacto**: Safari puede mostrar warning de "favicon too old format". No hay icon SVG (que es el formato moderno).
- **Fix**: agregar `app/icon.tsx` (genera `icon.svg` dinámicamente) + `app/apple-icon.tsx`.
- **Esfuerzo**: 15 min.

### #024 — `Layout` se monta en TODAS las rutas (incluyendo `loading.tsx`)

- **Sistema**: theming
- **Archivos**: `app/layout.tsx`
- **Impacto**: cada ruta carga `<BackgroundFX>` y los providers, aunque sea una ruta interna de Next.js.
- **Fix**: route groups (`app/(group)/layout.tsx`).
- **Esfuerzo**: 1 hora.

### #025 — El `Footer` acopla implícitamente al Navbar

- **Sistema**: organisms
- **Archivos**: `Footer.tsx`
- **Impacto**: el Footer recibe `meta: NavbarItem[]` (los links del Navbar reusados). Acoplamiento implícito.
- **Fix**: el Footer debería tener su propio data de BD.
- **Esfuerzo**: 1 día (cambiar BD + orquestador + Footer).

### #026 — `Modal` re-declara interfaces en lugar de extender tipos existentes

- **Sistema**: type system
- **Archivos**: `Modal.tsx:1`, `types.ts:114-127`
- **Impacto**: `Modal` redefine `data extends ModalContent` (puede ser frágil).
- **Fix**: usar intersection types.
- **Esfuerzo**: 5 min.

### #027 — `Motion` se importa con full features, no via tree-shaking del provider

- **Sistema**: motion
- **Archivos**: `app/layout.tsx:40-44` ya usa `<LazyMotion features={domAnimation}>` (OK)
- **Impacto**: ya está bien. Pero el `Animations.tsx` y los modales importan `m` y `AnimatePresence` de `motion/react` (no se ha tree-shakeado).
- **Fix**: OK, ya está hecho.
- **Esfuerzo**: 0.

## 📊 Resumen por prioridad

| Prioridad | Count | Total esfuerzo estimado |
|---|---|---|
| 🟢 Crítica | 5 | ~5-7 días |
| 🟡 Media | 10 | ~2-3 días |
| 🔵 Baja | 12 | ~5-7 días |
| **Total** | **27** | **~12-17 días** |

## 🔗 Conexiones con sistemas

| Issue | Sistema | Doc que lo cubre |
|---|---|---|
| #001, #002, #016, #019, #020 | i18n | [[sistema-i18n-multi-idioma]] + [[sistema-i18n-metadata-extensions]] |
| #003, #006 | testing/infra | [[sistema-testing-ci-deploy-gap]] |
| #004, #021, #022 | data layer | [[sistema-db-supabase-headless-cms]] + [[sistema-manejo-errores]] |
| #005, #007, #008, #014, #026 | type system | [[sistema-barrel-type-helpers]] |
| #006, #009, #027 | animations | [[sistema-animate-presence-exit-animations]] + [[sistema-motion]] |
| #010, #012 | assets | [[sistema-imagenes-svg-image]] |
| #011, #026 | type system | [[sistema-barrel-type-helpers]] |
| #013 | loading | [[sistema-loading-skeletons]] |
| #015 | theming | [[sistema-theming-v2-flow]] + [[sistema-theming-v2]] |
| #017, #018, #023, #024 | SEO/infra | [[sistema-seo-metadata-fonts-errorboundary]] |
| #025 | organisms | [[sistema-header-navegacion]] + [[sistema-ui-base-atoms-molecules]] |

## 🛠️ Workflow de resolución sugerido

1. **Empezar por #005** (5 min) — IconNameSchema.safeParse. Fix de bug visual.
2. **Seguir con #008** (10 seg) — agregar `;` al barrel.
3. **Seguir con #013** (2 min) — importar SkeletonPulse en HomePageSkeleton.
4. **Seguir con #003** (en orden) — tests, CI, deploy. Es el gap más grande.
5. **Seguir con #001 + #002 + OpenGraph** — i18n de metadata. SEO impact.
6. **Seguir con #009** — Modal con AnimatePresence.
7. **Resto** en orden de prioridad.

## 📋 Cómo usar este archivo

- **Cuando agregues código nuevo**: verifica que no crees issues similares (DRY, types, fallback).
- **Cuando toques un sistema**: busca los issues asociados y verifica que el fix no rompa otra cosa.
- **Cuando tengas tiempo libre**: toma 1 issue, fixéalo, y márcalo como done (agregando una línea `DONE #N: descripción`).
- **Cuando hagas CI**: agrega un check que falle si hay TODOs marcados como `FIXME` o `XXX` (los patrones que usé en `generaldata.service.ts`).

## Estado del grafo

- **266 nodos, 553 edges, 18 comunidades** (regenerado con `graphify extract src/ --out docs/graph/ && graphify cluster-only docs/graph/ && python3 docs/graph/restore-theming-edges.py`).
- Las 10 edges manuales del theming v2 están preservadas (el script `restore-theming-edges.py` las restaura tras cada `cluster-only`).
