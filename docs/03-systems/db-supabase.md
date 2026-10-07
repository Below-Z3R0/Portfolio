---
title: "DB + Supabase — schema portfolio (headless CMS)"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [db, supabase, headless-cms, postgresql, typescript, supabase-js, schemas, zod, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto usa Supabase como headless CMS con PostgreSQL. Hay **6 tablas en el schema `portfolio`**: `content_blocks` (catálogo semántico de bloques), `translations` (contenido traducible por idioma), `content_blocks_metadata` (datos no traducibles), `general_data` (datos globales del sitio), `languages` (catálogo de idiomas activos), y `projects` (catálogo de proyectos con su content jsonb). El orquestador pide 8 + 9 keys en paralelo con `Promise.all`, valida cada uno con Zod schemas, y reensambla todo en un `GeneralData`. El tipado end-to-end va: SQL → `supabase gen types` → `Database` type → `services/generaldata.service.ts` → Zod schemas → `schemas.ts` → props de componentes.

## 🎯 Filosofía del headless CMS

En vez de hardcodear el contenido en componentes (títulos, descripciones, links, colores), el proyecto:

1. **Guarda contenido traducible en una tabla `translations`** con `lang_code`.
2. **Guarda metadata no traducible** (links, image_keys, `is_relevant`, etc.) en `content_blocks_metadata`.
3. **Usa `content_blocks` como catálogo semántico** de "qué existe" (un row por clave: `section.hero`, `project.portfolio`, etc.).
4. **El orquestador pide 8 + 9 keys en paralelo** y valida con Zod.
5. **Los componentes reciben props tipadas** (no `any`).

> **Beneficio**: cambiar contenido (agregar idioma, corregir typo, agregar proyecto) es **una UPDATE en Supabase**, no un redeploy.

## 🗂️ Estructura de la DB (schema `portfolio` — info real del MCP)

### Tablas del proyecto (verificadas con `mcp__supabase__execute_sql`)

| Tabla | Propósito | Filas en BD |
|---|---|---|
| `content_blocks` | Catálogo semántico de bloques (define "qué existe") | ~12 (verificar) |
| `translations` | Contenido traducible por idioma (`lang_code`) | ~24 (12 bloques × 2 idiomas) |
| `content_blocks_metadata` | Metadata no traducible (image_keys, links, flags) | ~7 |
| `general_data` | Datos globales del sitio | ~1 (general) |
| `languages` | Catálogo de idiomas activos | 2 (es, en) |
| `projects` | Catálogo de proyectos con content jsonb propio | 5 (centenoadvisory, db, features, portfolio, nincy) |

> **Nota**: las 6 tablas viven en el **schema `portfolio`** (no en `public`). El cliente Supabase se inicializa con `db: { schema: "portfolio" }` para usar este namespace.

### Schema completo (columnas reales, vía `information_schema.columns`)

#### `content_blocks` (catálogo de claves)

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `key` | text | NO | — | `section.hero`, `section.navbar`, `project.centeno-advisory`, etc. |
| `owner` | text | NO | — | Quién creó el bloque (admin, sistema) |
| `description` | text | YES | — | Texto libre, no se usa en frontend |
| `create_at` | timestamptz | YES | `now()` | — |

#### `translations` (content traducible)

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `block_id` | uuid | YES | — | FK → `content_blocks.id` |
| `lang_code` | text | YES | — | `"es"` \| `"en"` (valida contra `languages.code`) |
| `content` | jsonb | NO | — | El JSON que valida el Zod schema (ej. `HeroContentSchema`) |
| `updated_at` | timestamptz | YES | `now()` | — |

> **Importante**: `block_id` y `lang_code` son la **clave compuesta lógica** (no hay UNIQUE constraint explícito en el schema, pero el código asume unicidad).

#### `content_blocks_metadata` (datos no traducibles)

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `block_id` | uuid | NO | — | FK → `content_blocks.id` |
| `content` | jsonb | NO | — | El JSON que valida `HeroMetadataSchema`, etc. |
| `updated_at` | timestamptz | YES | `now()` | — |

#### `general_data` (datos globales del sitio)

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `section_name` | text | YES | — | ej. `"general"`, `"contacts"` |
| `content` | jsonb | YES | — | El JSON del bloque global (ej. `GeneralContacts`) |

#### `languages` (catálogo de idiomas)

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `code` | text | NO | — | PK (ej. `"es"`, `"en"`) |
| `name` | text | NO | — | Nombre visible (ej. `"Español"`, `"English"`) |
| `is_default` | bool | YES | `false` | Idioma por defecto |
| `create_at` | timestamptz | YES | `now()` | — |

#### `projects` (catálogo de proyectos)

| Columna | Tipo | Nullable | Default | Notas |
|---|---|---|---|---|
| `id` | uuid | NO | `gen_random_uuid()` | PK |
| `project_name` | text | YES | — | ej. `"centenoadvisory"`, `"portfolio"`, `"nincy"` |
| `content` | jsonb | YES | — | El JSON con `paragraph, tecnologies, modal` (validado por `ProjectItemSchema`) |

> **Nota**: esta tabla parece **redundante** con `translations`. Pero el código la usa distinto: `getData("project.X", lang, supabase, ProjectItemSchema)` apunta a `translations` (con `lang_code`), mientras que `projects.content` se usaría para datos que **no varían por idioma**. El proyecto actual no la usa directamente — la info de proyectos vive en `translations`.

## 📐 Patrón "block_key"

Cada contenido tiene una **clave semántica** en `content_blocks.key`:

| `block_key` | Tabla | Schema Zod | Aparece en |
|---|---|---|---|
| `section.hero` | `translations` | `HeroContentSchema` | Hero |
| `section.hero` | `content_blocks_metadata` | `HeroMetadataSchema` | Hero |
| `section.navbar` | `translations` | `NavbarContentSchema` | NavBar |
| `section.skills` | `translations` | `SkillsContentSchema` | Skills |
| `section.skills` | `content_blocks_metadata` | `SkillsMetadataSchema` | Skills |
| `section.projects` | `translations` | `ProjectsContentSchema` | Projects |
| `section.aboutme` | `translations` | `AboutMeContentSchema` | AboutMe |
| `section.aboutme` | `content_blocks_metadata` | `AboutMeMetadataSchema` | AboutMe |
| `section.contact` | `translations` | `ContactContentSchema` | Contact |
| `section.footer` | `translations` | `FooterContentSchema` | Footer |
| `general.contacts` | `content_blocks_metadata` | `GeneralContactsSchema` | Hero / Contact |
| `project.centeno-advisory` | `translations` | `ProjectItemSchema` | Projects card |
| `project.centeno-advisory-db` | `translations` | `ProjectItemSchema` | Projects card |
| `project.centeno-advisory-features` | `translations` | `ProjectItemSchema` | Projects card |
| `project.portfolio` | `translations` | `ProjectItemSchema` | Projects card |
| `project.nincy` | `translations` | `ProjectItemSchema` | Projects card |
| `project.{slug}` (× 5) | `content_blocks_metadata` | `ProjectsMetadataSchema` | Projects card |

**Total de keys** = 8 content + 9 metadata = **17 queries en paralelo**.

> **Diferencia importante**: `general.contacts` no es un bloque con `key="general.contacts"`, sino un row en `content_blocks_metadata` con `block_id` apuntando a `content_blocks` con `key="general"`. La convención "section.X" vs "general.X" se decide por prefijo.

## 🔄 Flujo end-to-end de un dato (DB → Componente)

```
┌──────────────────────────────────────────────────────────────┐
│  1. Supabase (PostgreSQL) — schema "portfolio"               │
│     tabla translations                                        │
│     {                                                        │
│       content: { "title_lg": "...", "paragraph": "..." },   │
│       lang_code: "es"                                        │
│       block_id -> content_blocks.key = "section.aboutme"     │
│     }                                                        │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  2. supabase-js (data.service.ts)                             │
│     await supabase                                           │
│       .from("translations")                                  │
│       .select("content, content_blocks!inner(key)")         │
│       .eq("lang_code", lang)                                 │
│       .eq("content_blocks.key", block_key)                   │
│       .limit(1).single()                                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  3. Zod (schemas.ts)                                          │
│     AboutMeContentSchema.parse(data.content)                 │
│     → si no matchea -> throw Error                            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  4. Orquestador (generaldata.service.ts)                      │
│     {                                                         │
│       aboutme_section: { data: aboutme, meta: ... }          │
│     }                                                         │
│     return Promise<GeneralData>                                │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  5. Server Component (app/page.tsx)                           │
│     export default async function Home({ searchParams }) {     │
│       const general_data = await getGeneralData(lang);         │
│       return <AboutMeSection aboutme_data={...} />             │
│     }                                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  6. Component (AboutMeSection)                                │
│     <Title2 txt={aboutme_data.data.title_lg} />                │
└──────────────────────────────────────────────────────────────┘
```

## 🔧 Setup de los clientes Supabase

### 2 clientes (browser + server)

```ts
// src/services/supabase/client.ts (browser)
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types/types";

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { db: { schema: "portfolio" } }
  );
```

```ts
// src/services/supabase/server.ts (Server Components + Actions)
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types/types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component: ignorar error de escritura
          }
        },
      },
      db: { schema: "portfolio" },
    }
  );
}
```

> **Importante**: ambos clientes usan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (la publishable key / anon key, antes llamada "anon key"). Es seguro exponerla al cliente. **Nunca** debe usarse la service role key.

## 🔗 Patrón genérico getData / getMetaData

```ts
// src/services/Data/data.service.ts
import type { z } from "zod";
import type { PortfolioClient } from "../supabase/types/types.helper";

export const getData = async <Schema extends z.ZodType>(
  block_key: string,
  lang: string,
  supabase: PortfolioClient,
  schema: Schema
): Promise<z.infer<Schema>> => {
  const { data, error } = await supabase
    .from("translations")
    .select("content, content_blocks!inner(key)")
    .eq("lang_code", lang)
    .eq("content_blocks.key", block_key)
    .limit(1)
    .single();

  if (error || !data)
    throw new Error(
      `Error fetching data for block_key ${block_key} and language ${lang}: ${error.message}`
    );

  return schema.parse(data.content);
};
```

```ts
// src/services/Data/metadata.service.ts (mismo patrón)
export const getMetaData = async <Schema extends z.ZodType>(
  block_key: string,
  supabase: PortfolioClient,
  schema: Schema
): Promise<z.infer<Schema>> => {
  const { data, error } = await supabase
    .from("content_blocks_metadata")
    .select("content, content_blocks!inner(key)")
    .eq("content_blocks.key", block_key)
    .limit(1)
    .single();

  if (error || !data)
    throw new Error(
      `Error fetching data for block_key ${block_key}: ${error.message}`
    );

  return schema.parse(data.content);
};
```

> **Diferencia clave**: `getData` filtra por `lang_code` (translations tiene idioma), `getMetaData` no (metadata no es traducible). Y `getData` apunta a `translations`, `getMetaData` a `content_blocks_metadata`.

## 🎼 El orquestador: getGeneralData

```ts
// src/services/generaldata.service.ts (resumido)
export const getGeneralData = async (lang: string = "es"): Promise<GeneralData> => {
  const supabase = await createClient();

  // 1) 8 queries de content (paralelo)
  const [
    hero_section,
    navbar_section,
    skills_section,
    projects_section,
    aboutme_section,
    contact_section,
    footer_section,
    centenoadvisory, centenoadvisory_db, centenoadvisory_features,
    portfolio, nincy,
  ] = await Promise.all([
    getData("section.hero", lang, supabase, HeroContentSchema),
    getData("section.navbar", lang, supabase, NavbarContentSchema),
    getData("section.skills", lang, supabase, SkillsContentSchema),
    getData("section.projects", lang, supabase, ProjectsContentSchema),
    getData("section.aboutme", lang, supabase, AboutMeContentSchema),
    getData("section.contact", lang, supabase, ContactContentSchema),
    getData("section.footer", lang, supabase, FooterContentSchema),

    getData("project.centeno-advisory", lang, supabase, ProjectItemSchema),
    getData("project.centeno-advisory-db", lang, supabase, ProjectItemSchema),
    getData("project.centeno-advisory-features", lang, supabase, ProjectItemSchema),
    getData("project.portfolio", lang, supabase, ProjectItemSchema),
    getData("project.nincy", lang, supabase, ProjectItemSchema),
  ]);

  // 2) 9 queries de metadata (paralelo)
  const [
    hero_meta, skills_section_meta, aboutme_section_meta,
    centenoadvisory_meta, centenoadvisory_db_meta, centenoadvisory_features_meta,
    portfolio_meta, nincy_meta, contacts_meta,
  ] = await Promise.all([
    getMetaData("section.hero", supabase, HeroMetadataSchema),
    getMetaData("section.skills", supabase, SkillsMetadataSchema),
    getMetaData("section.aboutme", supabase, AboutMeMetadataSchema),
    getMetaData("project.centeno-advisory", supabase, ProjectsMetadataSchema),
    getMetaData("project.centeno-advisory-db", supabase, ProjectsMetadataSchema),
    getMetaData("project.centeno-advisory-features", supabase, ProjectsMetadataSchema),
    getMetaData("project.portfolio", supabase, ProjectsMetadataSchema),
    getMetaData("project.nincy", supabase, ProjectsMetadataSchema),
    getMetaData("general.contacts", supabase, GeneralContactsSchema),
  ]);

  const contacts_meta_array: ContactSectionMetadata = Object.values(contacts_meta);

  return {
    hero_section: { data: hero_section, meta: { general: hero_meta, contacts: contacts_meta } },
    navbar_section: { data: navbar_section.data },
    skills_section: { data: skills_section, meta: skills_section_meta },
    aboutme_section: { data: aboutme_section, meta: aboutme_section_meta },
    contact_section: { data: contact_section, meta: contacts_meta_array },
    footer_section: { data: footer_section, meta: navbar_section.data },
    projects_section,
    projects_array: [
      { key: 1, data: centenoadvisory, meta: centenoadvisory_meta },
      { key: 2, data: centenoadvisory_db, meta: centenoadvisory_db_meta },
      { key: 3, data: centenoadvisory_features, meta: centenoadvisory_features_meta },
      { key: 4, data: portfolio, meta: portfolio_meta },
      { key: 5, data: nincy, meta: nincy_meta },
    ],
  };
};
```

**17 queries en paralelo** = ~250-400ms en Supabase (vs ~4-7s en serie).

## 🔗 Tipado end-to-end (de SQL a JSX)

```
SQL real (Supabase)
    ↓ `supabase gen types typescript --local-file ...`
Database (types.ts:1, 191 lines)
    ↓ `import type { Database }`
PortfolioClient (types.helper.ts)
    ↓ `getData<Schema>(...)`
z.infer<Schema> en cada servicio
    ↓ `import type { GeneralData }`
Page (app/page.tsx) → props tipadas
    ↓ `<AboutMeSection aboutme_data={...} />`
Components (data.prop, sin any)
```

### ¿Cómo se genera el tipado?

```bash
# En el proyecto
bunx supabase gen types typescript --local-file ./supabase/types.ts
# (si usás local Supabase)
# O conectado a Supabase cloud:
bunx supabase gen types typescript --project-id <ID>
```

Eso **genera automáticamente** `src/services/supabase/types/types.ts` con el shape completo de la BD (todas las tablas, columnas, foreign keys). Si agregás una columna, regenés y el tipado se actualiza en toda la app.

> **Tipo helper personalizado** (`types.helper.ts`): crea un `PortfolioClient` con tipos más específicos que el `SupabaseClient` genérico. Esto permite que `supabase.from("translations")` retorne tipos derivados de tu schema.

## 🌐 Multi-idioma (i18n)

```ts
// app/page.tsx
export default async function Home({ searchParams }: PageProps<"/">) {
  const resolvedParams = await searchParams;
  const currentLang = resolvedParams.lang || "es";
  const general_data = await getGeneralData(currentLang);
  // ...
}
```

- **Default**: `lang = "es"` (definido en `generaldata.service.ts`).
- **Override**: `?lang=en` en la URL.
- **Escalable**: agregar un idioma = nuevo row en `languages` + nuevos rows en `translations` con `lang_code` nuevo + actualizar el `LanguageToggle`.

> **Limitación actual**: la tabla `languages` tiene 2 idiomas (`es`, `en`). El `LanguageToggle.tsx` lee de esta tabla y muestra los disponibles. Si el `lang` query param no matchea una key válida, **`getData` falla con throw** (no hay fallback).

## 🚨 Manejo de errores

```ts
// data.service.ts
if (error || !data) {
  throw new Error(
    `Error fetching data for block_key ${block_key} and language ${lang}: ${error.message}`,
  );
}

return schema.parse(data.content);  // también puede throw si Zod no valida
```

**Implicaciones**:
- `data.content` no matchea el schema Zod → `error.tsx` se renderiza (Next.js error boundary).
- `lang` no existe en la BD → mismo error (no hay fallback).
- Zod validation fail en runtime → propagado como `error.tsx` boundary.

> **Pendiente**: el proyecto no tiene fallback de idioma (si el `lang` no existe, la página se rompe). El idioma solo se puede cambiar via el LanguageToggle si la BD tiene el `lang_code` cargado.

## 📁 Archivos del sistema (en el grafo, comunidad 3)

| Archivo | Líneas | Propósito |
|---|---|---|
| `services/supabase/client.ts` | 14 | Cliente browser (publishable key, cookies) |
| `services/supabase/server.ts` | 32 | Cliente server (publishable key + cookies RSC) |
| `services/supabase/types/types.ts` | 1191 | Tipado de la BD (generado por `supabase gen types`) |
| `services/supabase/types/types.helper.ts` | corto | `PortfolioClient` type helper |
| `services/Data/data.service.ts` | 25 | `getData<T>(block_key, lang, supabase, schema)` |
| `services/Data/metadata.service.ts` | 23 | `getMetaData<T>(block_key, supabase, schema)` |
| `services/generaldata.service.ts` | 102 | Orquestador (17 queries en paralelo) |

**Total**: ~1400 líneas (incluyendo types.ts generado).

## 🛠️ Cómo agregar contenido (operación cotidiana)

### Agregar un texto traducible

1. Ir a Supabase Dashboard → Table Editor.
2. Insert row en `translations`:
   - FK `content_blocks` → clave que ya existe (ej. `section.hero`)
   - `lang_code`: `"es"`
   - `content`: JSON con el shape del schema (ej. `{ "title": "Hola" }`)
3. Verificar en el frontend.

### Agregar un nuevo bloque (key)

1. Insert row en `content_blocks` (PK key).
2. Insert row en `translations` y `content_blocks_metadata` apuntando al nuevo key.
3. Crear schema Zod en `schemas.ts` con el shape esperado.
4. Agregar al orquestador (`generaldata.service.ts`).
5. Agregar al tipo `GeneralData` en `schemas.ts`.
6. Pasar como prop al componente.

### Agregar un nuevo idioma

1. Insert row en `languages` con el nuevo `code` y `is_default=false`.
2. Para cada bloque existente, insert row en `translations` con `lang_code` nuevo.
3. El LanguageToggle puede ahora setear `?lang=<nuevo>`.

## 🔗 Conexiones con otros sistemas

| Sistema | Edge con DB | Detalle |
|---|---|---|
| Orquestador (comunidad 2) | `getGeneralData()` retorna `GeneralData` | Une DB con UI |
| Formulario (comunidad 5) | ninguno directo | EmailJS usa el form, no la BD |
| Iconos (comunidad 4) | parcial | `IconNameSchema` valida que `icon_key` exista en `ICON_REGISTRY` (no en DB) |
| Imágenes (comunidad 10) | parcial | `<Image loader="supabase-image-loader">` apunta a Supabase Storage (no a la DB) |
| Theming v2 (comunidad 8) | ninguno directo | CSS variables hardcoded en `globals.css` |

## ⚠️ Lo que falta documentar del sistema DB

- **DDL exacto de las tablas** (vía `supabase db dump` o las migraciones).
- **RLS policies** (autenticación, quién puede escribir). El proyecto **parece no tener RLS** (publishable key puede leer/escribir).
- **El seed inicial**: cómo se pobló la BD la primera vez.
- **Migración de schema**: ¿hay migraciones versionadas? ¿cómo se aplican?
- **El `favicon.ico`**: ¿se sirve desde Supabase Storage o es un archivo estático?
- **El manejo de errores en runtime**: el `throw` se traduce a un `error.tsx`. ¿Hay logging? ¿Hay retry?

## 🔗 Ver también

- [[learning/projects/portfolio-v2/orquestador-generaldata-service]] (siguiente en el orden de docs)
- [[learning/projects/portfolio-v2/tipado-zod-end-to-end]] (flujo Supabase → Zod → componente)
- [[learning/projects/portfolio-v2/sistema-imagenes-svg-image]] (custom loader)
- [[learning/frontend/css/themes/theme-system-portfolio-v2]] (sistema theming v2, paralelo)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (flujo end-to-end)
- ADR-009: `attribute="class"` en next-themes
- ADR-010: RPC vs query normal
- ADR-011: Schema `portfolio` en Supabase
- ADR-012: Zod para shape de content jsonb
- ADR-013: Tipado automático con `supabase gen types`

## Próximo paso

Sigo con el **Orquestador** (`generaldata.service.ts` + `schemas.ts` + cómo se conecta a UI). Decime cuando quieras parar o seguir.
