---
title: "Sistema de barrel + type helpers (tipado SQL → componente)"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [barrel, type-helpers, supabase, typescript, supabase-js, rsc-boundary, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto tiene **un barrel `components.ts`** que re-exporta todos los atoms, molecules, organisms, hooks y skeletons. Los componentes importan de un solo lugar (`from "../components"`). Hay **un type helper `types.helper.ts`** que crea el `PortfolioClient` tipado al schema `portfolio` de Supabase (derivado de `Database` que genera `supabase gen types`). El barrel tiene un **issue conocido**: `ProjectCard` está comentado porque generaba errores SSR con `ProjectsSection`; `Modal` está exportado con `export *` SIN `;` (typo). El barrel en sí mismo **funciona**, pero conviene tener cuidado con los ciclos de imports y la RSC boundary.

## 🎯 Filosofía del barrel

- **Single import point** para todos los componentes: `from "../components"`.
- **Tree-shakeable**: solo lo importado se incluye en el bundle.
- **Convenience**: no hay que conocer paths internos (`atoms/Button` vs `molecules/Formulary`).
- **Riesgo**: ciclos de imports + RSC boundary issues.

## 📁 Archivos

| Archivo | Rol |
|---|---|
| `src/components/components.ts` | **El barrel** — re-exporta todo |
| `src/services/supabase/types/types.ts` (1191 líneas) | Generado por `supabase gen types` |
| `src/services/supabase/types/types.helper.ts` (18 líneas) | Crea el `PortfolioClient` tipado |

## 🧬 El barrel: `components.ts` (39 líneas)

```ts
// --- atoms (Atomic Components) ---
export * from "./animations/animationsindex";
export * from "./atoms/BackgroundFX";
export * from "./atoms/Button";
export * from "./atoms/LanguageSwitcher";
export * from "./atoms/LanguageToggle";
export * from "./atoms/LinkButton";
export * from "./atoms/Paragraph";
export * from "./atoms/Span";
export * from "./atoms/Title1";
export * from "./atoms/Title2";
export * from "./atoms/Title3";
export * from "./atoms/Title4";

// --- Hooks ---
export * from "./hooks/themeProvider";
export * from "./hooks/useTheme";

// --- Molecules ---
export * from "./molecules/ErrorMessage";
export * from "./molecules/Formulary";
export * from "./molecules/NavBar";
//export * from "./molecules/ProjectCard"; ← comentado (issue con SSR)
export * from "./molecules/SuccessMessage";
export * from "./molecules/TecnologiesCard";
export * from "./molecules/Modal"  // ← falta ;

// --- Organisms ---
export * from "./organims/AboutMeSection";
export * from "./organims/ErrorPage";
export * from "./organims/Footer";
export * from "./organims/Header";
export * from "./organims/HeroSection";
export * from "./organims/ProjectsSection";
export * from "./organims/OSSection";
export * from "./organims/IASection";
export * from "./organims/SkillsSection";

// --- Skeletons ---
export * from "./skeletons/skeletonindex";
```

### Issues conocidos en el barrel

1. **Línea 23**: `//export * from "./molecules/ProjectCard";` está **comentado**.
   - Razón: importaba `ProjectCard` y generaba errores SSR en `ProjectsSection.tsx`.
   - **Fix**: comentado evita el error, pero `ProjectCard` se importa **directo** desde el path (`from "../molecules/ProjectCard"`).

2. **Línea 26**: `export * from "./molecules/Modal"` **falta el `;`** al final.
   - Probablemente es un typo (debería ser `Modal"`;`).
   - **Fix**: agregar el `;`.

3. **Línea 32, 34-35**: `OSSection` y `IASection` están **exportados** pero **no se usan en `app/page.tsx`** (la página home no los importa).
   - Existe código comentado en `generaldata.service.ts` (líneas 85-100) que sugiere que estaban planeados.
   - **Fix**: o eliminarlos del barrel o implementarlos.

## 🧪 El type helper: `types.helper.ts` (18 líneas)

```ts
import type { Database } from "./types";

// Helpers para acceder a las tablas de tu schema
type PortfolioSchema = Database["portfolio"];
type PortfolioTables = PortfolioSchema["Tables"];

// Tipo fila de cada tabla (lo que devuelve SELECT)
export type ContentBlock = PortfolioTables["content_blocks"]["Row"];
export type Translation = PortfolioTables["translations"]["Row"];
export type ContentBlockMetadata =
  PortfolioTables["content_blocks_metadata"]["Row"];
export type Language = PortfolioTables["languages"]["Row"];

// Helper genérico para el cliente tipado al schema "portfolio"
export type PortfolioClient = import("@supabase/supabase-js").SupabaseClient<
  Database,
  "portfolio"
>;
```

### Anatomía (4 tipos derivados)

1. **`Database["portfolio"]`** — el schema completo.
2. **`PortfolioSchema["Tables"]`** — solo el bloque de Tables (no Views, Functions, etc.).
3. **`PortfolioTables["X"]["Row"]`** — el tipo Row de una tabla específica. Equivale a `<T>['Row']` que genera `supabase gen types`.
4. **`PortfolioClient`** — el `SupabaseClient<Database, "portfolio">` tipado al schema correcto.

### ¿Por qué se usa `import("@supabase/supabase-js").SupabaseClient<...>`?

```ts
export type PortfolioClient = import("@supabase/supabase-js").SupabaseClient<
  Database,
  "portfolio"
>;
```

> Es un **type-level import** (con `import("...")`). Permite usar el tipo `SupabaseClient` sin hacer un import de runtime (que sí tendría side-effects). El bundle queda más liviano.

## 🔄 Cómo se regeneran los types

```bash
bun run gen-types
```

Esto ejecuta:
```sh
supabase gen types typescript \
  --project-id hlsjbvwnqcwrzfuyocja \
  --schema portfolio \
  > src/types
```

> ⚠️ El output es `src/types` (sin extensión). Es **un único archivo** con TODO el tipado de la BD (1191 líneas). Sobreescribe el archivo completamente.

**Cuándo regenerar**:
- Agregás/modificás una tabla o columna.
- Cambias un constraint.
- Cambias una foreign key.

## 🔄 Flujo del tipado end-to-end

```
SQL real en Supabase
  ↓
bun run gen-types
  ↓
src/services/supabase/types/types.ts (1191 líneas, auto-generado)
  ↓
import type { Database } from "./types"
  ↓
src/services/supabase/types/types.helper.ts
  ↓
export type PortfolioClient = SupabaseClient<Database, "portfolio">
  ↓
src/services/supabase/{client,server}.ts
  ↓ createClient() retorna Promise<SupabaseClient<...>> tipado
  ↓
src/services/Data/data.service.ts
  ↓ getData<T>(block_key, lang, supabase: PortfolioClient, schema)
  ↓ supabase.from("translations").select(...) — TIPADO con PortfolioClient
  ↓
Promise<z.infer<T>> — devuelve el JSON parseado
```

## 🎯 Type-safe queries (ejemplo)

```ts
// src/services/Data/data.service.ts
import type { z } from "zod";
import type { PortfolioClient } from "../supabase/types/types.helper";

export const getData = async <Schema extends z.ZodType>(
  block_key: string,
  lang: string,
  supabase: PortfolioClient,  // ← tipado
  schema: Schema,
): Promise<z.infer<Schema>> => {
  const { data, error } = await supabase
    .from("translations")  // ← solo "translations" es válido
    .select("content, content_blocks!inner(key)")  // ← tipado según shape
    .eq("lang_code", lang)
    .eq("content_blocks.key", block_key)
    .limit(1)
    .single();
  // data es { content: Json, ... } | null
  // error es PostgrestError | null
  // ...
};
```

**Lo que el tipado te da**:
- `supabase.from("translations")` — TS solo acepta strings que son nombres de tablas en `Database`.
- `.select("content, content_blocks!inner(key)")` — TS valida que las columnas existen.
- `data` es `Translation | null` con todas las columnas.
- `.single()` — TS sabe que devuelve `data: T | null`.

> Si la BD tiene una columna "title" y la query no la trae, el tipado de `data.content` **no incluye** `title`. **Pero** el JSONB `content` es libre, no tiene schema. Zod lo valida en runtime.

## ⚠️ Issues conocidas

### 1. **El barrel tiene un typo (`Modal"` sin `;`)**

```ts
export * from "./molecules/Modal"  // ← falta ;
```

> TypeScript probablemente lo acepta (es la última línea antes de `--- Organisms ---`). **Issue menor**.

### 2. **`ProjectCard` no está en el barrel**

```ts
//export * from "./molecules/ProjectCard"; ← comentado
```

> **Issue**: cuando un componente necesita ProjectCard, debe hacer `import { ProjectCard } from "../molecules/ProjectCard"`. **No es consistente** con el resto (que todo está en el barrel).

**Fix**: descomentar y arreglar el bug de SSR en otro lado.

### 3. **`OSSection` y `IASection` existen pero no se usan**

```ts
export * from "./organims/OSSection";
export * from "./organims/IASection";
```

> **Issue**: código muerto en el bundle. Bundle más grande innecesariamente.

**Fix**: eliminar del barrel y eliminar los archivos (si no se usan).

### 4. **El barrel re-exporta hooks, schemas, types (en types.ts) y skeletons**

```ts
// types.ts también re-exporta desde schemas y types
export type { HeroSection, NavbarSection, ... } from "./schemas";
```

> Hay **múltiples puntos de re-export** (`types.ts` y `components.ts`). Puede generar ciclos de imports.

**Fix**: tener un solo "barrel de barrels" (`index.ts` en la raíz de `src/`) que re-exporte desde todos lados.

### 5. **RSC boundary: barrel en Server Components puede romper**

```tsx
// app/page.tsx (Server Component)
import { HeroSection, ... } from "../components";  // ← barrel OK
import { ThemeSwitcher } from "../components/atoms/ThemeSwitcher";  // ← path directo, mejor
```

> El barrel **funciona** en Server Components **si** todos los exports son Server-safe. Si el barrel re-exporta un Client Component, el Server Component que lo importa **no marca como server-safe**.

> **Issue conocido**: el proyecto tiene componentes client (`useTheme`, `useState` en Header, `motion/react` en modales) que se importan del barrel. Esto puede causar **bugs sutiles de hidratación**.

**Fix planeado**: barrel solo para Server Components. Client Components se importan directo.

## 🛠️ Cómo agregar un nuevo componente al barrel

1. Crear el archivo en `src/components/{atoms|molecules|organims}/MiComponente.tsx`.
2. Definir el type en `src/components/types.ts` (o en el mismo archivo si es local).
3. Agregar `export * from "./{atoms|molecules|organims}/MiComponente";` en `components.ts`.
4. Si el componente es Client (`"use client"`), importarlo directo del path en otros Client Components.

## 🛠️ Cómo agregar una tabla nueva al tipo

1. Crear la tabla en Supabase (Dashboard SQL Editor o migration).
2. Ejecutar `bun run gen-types`.
3. El `Database["portfolio"]["Tables"]["mi_tabla"]` ahora existe.
4. Crear un helper en `types.helper.ts`:
   ```ts
   export type MiTabla = PortfolioTables["mi_tabla"]["Row"];
   ```
5. Si la tabla es traducible, agregar un schema Zod en `schemas.ts`.

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** — `types.ts` se regenera desde Supabase, `types.helper.ts` crea los tipos derivados.
- **Orquestador** — usa `getData<T>(supabase: PortfolioClient, ...)`.
- **Data/Metadata services** — el `supabase` que reciben está tipado.
- **Todos los organisms** — usan el barrel para importar atoms.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (cómo se regeneran los types)
- [[learning/projects/portfolio-v2/orquestador-generaldata-service]] (cómo se usa PortfolioClient)
- [[learning/projects/portfolio-v2/sistema-ui-base-atoms-molecules]] (todos los atoms/molecules)
- ADR-020: Imports directos en lugar de barrel

## Próximo sistema

Sigo con **i18n de metadata** (cómo hacer que `metadata.title` cambie con `?lang`), **patrón de barrel refactor**, o un **overview final** que conecte todos los 14 sistemas documentados.

Decime.
