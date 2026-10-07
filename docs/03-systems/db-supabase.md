---
title: "DB + Supabase — schema portfolio (headless CMS)"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-07
tags: [db, supabase, headless-cms, postgresql, typescript, supabase-js, schemas, zod, portfolio-v2, system, rpc]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto usa Supabase como headless CMS con PostgreSQL. Hay **6 tablas en el schema `portfolio`**: `content_blocks` (catálogo semántico de bloques), `translations` (contenido traducible por idioma), `content_blocks_metadata` (datos no traducibles), `general_data` (datos globales del sitio), `languages` (catálogo de idiomas activos), y `projects` (catálogo de proyectos con su content jsonb). El orquestador llama a **1 sola RPC** (`portfolio.get_site_payload`) que devuelve todo el contenido + metadata en un único jsonb, valida cada bloque con Zod (declarativamente con `z.object` anidado), y cachea con `unstable_cache(revalidate: 3600)`. El tipado end-to-end va: SQL → `supabase gen types` → `Database` type → `services/data/site.ts` → Zod schemas → `schemas.ts` → props de componentes.

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

## 📦 RPC `portfolio.get_site_payload` (Single Source of Truth)

Desde 2026-10-07, todo el contenido del sitio se trae con **1 sola llamada** a esta RPC en vez de 17:

```sql
CREATE OR REPLACE FUNCTION portfolio.get_site_payload(
  p_lang text,
  p_keys text[] DEFAULT NULL
) RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'content', COALESCE((
      SELECT jsonb_object_agg(cb.key, t.content)
      FROM portfolio.content_blocks cb
      JOIN portfolio.translations t ON t.block_id = cb.id
      WHERE t.lang_code = p_lang
        AND (p_keys IS NULL OR cb.key = ANY(p_keys))
    ), '{}'::jsonb),
    'metadata', COALESCE((
      SELECT jsonb_object_agg(cb.key, m.content)
      FROM portfolio.content_blocks cb
      JOIN portfolio.content_blocks_metadata m ON m.block_id = cb.id
      WHERE p_keys IS NULL OR cb.key = ANY(p_keys)
    ), '{}'::jsonb)
  );
$$;
```

### Shape de retorno

```json
{
  "content": {
    "section.hero": { "title": "...", "paragraph_1": "...", ... },
    "section.navbar": { "data": [...] },
    "project.portfolio": { "modal": {...}, ... },
    ...
  },
  "metadata": {
    "section.hero": { "image_key": "...", "contact": {...} },
    "general.contacts": { "github": {...}, "linkedin": {...} },
    ...
  }
}
```

### Por qué el SQL hace el trabajo

| Operación | En JS (antes) | En SQL (ahora) |
|---|---|---|
| JOIN content_blocks ↔ translations | N round-trips (uno por key) | 1 round-trip con JOIN |
| Agrupar por key | Manual con `Object.fromEntries` | `jsonb_object_agg(cb.key, ...)` |
| Filtrar keys permitidas | No se filtraba (se transferían todas) | `WHERE cb.key = ANY(p_keys)` |
| Manejar filas vacías | `if (!data) throw ...` | `COALESCE(..., '{}'::jsonb)` |

### Por qué `security invoker`

Sin esto, la función corre con permisos del **definidor** (generalmente el owner del schema) y se **saltea RLS**. Hoy tu contenido es público y no vas a ver diferencia. Pero el día que metas un borrador en `content_blocks` o restringas lectura por idioma, **te lo filtra a cualquier visitante**. Una línea, gratis, evita un bug imposible de debuggear.

### Cómo lo llama la app

```ts
// src/services/data/site.ts
const { data, error } = await supabase.rpc('get_site_payload', {
  p_lang: lang,
  p_keys: allowedKeys,
});
```

Las `allowedKeys` se construyen desde `SitePayloadSchema.shape.content.shape` y `SitePayloadSchema.shape.metadata.shape`. **Single source of truth**: agregar una key al schema Zod la trae al RPC automáticamente.

### Cómo se invoca desde SQL Editor

```sql
-- Sin filtro (trae todo el idioma):
SELECT portfolio.get_site_payload('es');

-- Con filtro (lo que hace la app):
SELECT portfolio.get_site_payload('es', array['section.hero', 'project.nincy']);
```

### Por qué `stable` + `language sql`

- `STABLE`: el resultado no cambia entre rows del mismo statement (Postgres puede cachear).
- `LANGUAGE sql` (no `plpgsql`): el planner inline-a la función, lo que permite optimizaciones que un bloque procedural no.

## 🔄 Flujo end-to-end de un dato (DB → Componente)

```
┌──────────────────────────────────────────────────────────────┐
│  1. Supabase (PostgreSQL) — schema "portfolio"               │
│     tablas: content_blocks, content_blocks_metadata,         │
│     translations                                              │
│                                                              │
│     El RPC get_site_payload(p_lang, p_keys):                │
│       - JOIN content_blocks ↔ translations                   │
│       - JOIN content_blocks ↔ content_blocks_metadata       │
│       - jsonb_object_agg(cb.key, content)                    │
│       - WHERE cb.key = ANY(p_keys)                           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  2. supabase-js (services/data/site.ts)                      │
│     await supabase.rpc('get_site_payload', {                 │
│       p_lang: 'es',                                          │
│       p_keys: allowedKeys,   // derivado de SitePayloadSchema │
│     })                                                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  3. Zod (schemas.ts)                                         │
│     SitePayloadSchema = z.object({                            │
│       content: z.object({ 'section.hero': HeroContentSchema, …}),
│       metadata: z.object({ 'general.contacts': GeneralContactsSchema, …}),
│     })                                                       │
│     Validación BLOQUE POR BLOQUE en fetchPayload:            │
│       for (key, schema) { safeParse(content[key]) }         │
│       → throw con key + path + valor real si falla           │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  4. unstable_cache (1 hora, tags: 'site:${lang}')            │
│     HIT  → devuelve SitePayload cacheado (0 ms)            │
│     MISS → ejecuta el RPC + valida con Zod                   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  5. Server Component (app/page.tsx)                           │
│     const { content, metadata } = await getSiteData(lang);    │
│     const hero_data = {                                       │
│       data: content['section.hero'],                          │
│       meta: { general: metadata['section.hero'],             │
│               contacts: metadata['general.contacts'] },       │
│     };                                                       │
│     return <HeroSection hero_data={hero_data} />;            │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  6. Component (HeroSection)                                   │
│     <Title2 txt={hero_data.data.title} />                    │
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

> ⚠️ **DEPRECATED 2026-10-07**. Este patrón (`getData`/`getMetaData` con 17 queries paralelas + `getGeneralData`) se reemplazó por `services/data/site.ts` (RPC `get_site_payload` + `unstable_cache`). Ver:
>
> - [`./orquestador.md`](./orquestador.md) — orquestador actual
> - [`./_deprecated/orquestador-promise-all-pattern.md`](./_deprecated/orquestador-promise-all-pattern.md) — código del patrón viejo, conservado por referencia
> - [`../04-decisions/024-rpc-get-site-payload.md`](../04-decisions/024-rpc-get-site-payload.md) — ADR del cambio

## 🔗 Tipado end-to-end (de SQL a JSX)

```
SQL real (Supabase)
    ↓ `supabase gen types typescript --local-file ...`
Database (types.ts:1, 191 lines)
    ↓ `import type { Database }`
PortfolioClient (types.helper.ts)
    ↓ `supabase.rpc(...)` en site.ts
z.infer<typeof SitePayloadSchema>
    ↓ `import type { SitePayload }`
Page (app/page.tsx) → props tipadas
    ↓ `<HeroSection hero_data={...} />`
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
  const { content, metadata } = await getSiteData(currentLang);
  // ...
}
```

- **Default**: `lang = "es"` (definido en `site.ts`).
- **Override**: `?lang=en` en la URL.
- **Escalable**: agregar un idioma = nuevo row en `languages` + nuevos rows en `translations` con `lang_code` nuevo + actualizar el `LanguageToggle`.

> **Limitación actual**: la tabla `languages` tiene 2 idiomas (`es`, `en`). El `LanguageToggle.tsx` lee de esta tabla y muestra los disponibles. Si el `lang` query param no matchea una key válida, **el RPC devuelve `{}` y el loop tira `Missing content for "section.hero"`** (no hay fallback).

## 🚨 Manejo de errores

```ts
// services/data/site.ts (fetchPayload)
if (error) throw new Error(`[site] RPC error: ${error.message}`);

const result = (schema as z.ZodType).safeParse(value);
if (!result.success) {
  console.error(`[site] Content invalid for "${key}":`, result.error);
  console.error(`[site] Actual content:`, JSON.stringify(value, null, 2));
  throw new Error(`[site] Invalid content for "${key}": ...`);
}
```

**Implicaciones**:
- `data.content[key]` no matchea el schema Zod → throw con la key + valor real → `error.tsx` se renderiza.
- `lang` no existe en la BD → el RPC devuelve `{}`, el loop tira `Missing content for "..."`.
- Zod validation fail en runtime → propagado como `error.tsx` boundary.

> **Pendiente**: el proyecto no tiene fallback de idioma (si el `lang` no existe, la página se rompe). El idioma solo se puede cambiar via el LanguageToggle si la BD tiene el `lang_code` cargado.

## 📁 Archivos del sistema (en el grafo, comunidad 3)

| Archivo | Líneas | Propósito |
|---|---|---|
| `services/supabase/client.ts` | 14 | Cliente browser (publishable key, cookies) |
| `services/supabase/server.ts` | 32 | Cliente server (publishable key + cookies RSC) |
| `services/supabase/types/types.ts` | 1191 | Tipado de la BD (generado por `supabase gen types`) |
| `services/supabase/types/types.helper.ts` | corto | `PortfolioClient` type helper |
| `services/data/site.ts` | 90 | `getSiteData(lang)` (1 RPC + Zod anidado + `unstable_cache`) |
| `services/data/function-example.sql` | 87 | SQL canónico del RPC (doc + backup) |

**Total**: ~1400 líneas (incluyendo types.ts generado). **Antes**: 3 archivos de servicios (`generaldata.service.ts` + `data.service.ts` + `metadata.service.ts`) + 1 helper. **Ahora**: 1 archivo (`site.ts`) + 1 doc SQL.

## 🛠️ Cómo agregar contenido (operación cotidiana)

### Agregar un texto traducible

1. Ir a Supabase Dashboard → Table Editor → `translations`.
2. Update del row con `block_id` apuntando al key y `lang_code` deseado.
3. Cambia el JSON de `content`.
4. **No necesitás redeploy**. La cache expira en 1 hora (o usá `revalidateTag`).

### Agregar un nuevo bloque (key)

1. **En Supabase**:
   - Insert row en `content_blocks` con `key = 'section.testimonials'`.
   - Insert row en `translations` con `block_id` apuntando al nuevo key.
   - Insert row en `content_blocks_metadata` si tiene metadata.
2. **En `components/schemas.ts`**:
   ```ts
   export const TestimonialsContentSchema = z.object({
     title: z.string(),
     items: z.array(z.object({ name: z.string(), quote: z.string() })),
   });
   ```
3. **En `services/data/site.ts`** — agregar al `SitePayloadSchema`:
   ```ts
   content: z.object({
     // ...existing...
     'section.testimonials': TestimonialsContentSchema,  // ← nueva línea
   }),
   ```
4. **En `app/page.tsx`**:
   ```tsx
   const testimonials_data = { data: content["section.testimonials"] };
   <TestimonialsSection testimonials_data={testimonials_data} />
   ```
5. **Invalidar cache** (opcional, si querés ver el cambio antes de la hora):
   ```ts
   import { revalidateTag } from 'next/cache';
   revalidateTag('site:es');
   ```

### Agregar un nuevo idioma

1. Insert row en `languages` con el nuevo `code` y `is_default=false`.
2. Para cada bloque existente, insert row en `translations` con `lang_code` nuevo.
3. El LanguageToggle puede ahora setear `?lang=<nuevo>`.

## 🔗 Conexiones con otros sistemas

| Sistema | Edge con DB | Detalle |
|---|---|---|
| Orquestador (comunidad 2) | `getSiteData()` retorna `SitePayload` (cacheado) | Une DB con UI |
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

- [[learning/projects/portfolio-v2/orquestador-site-ts]] (orquestador con RPC + cache, actualizado 2026-10-07)
- [[learning/projects/portfolio-v2/tipado-zod-end-to-end]] (flujo Supabase → Zod → componente)
- [[learning/projects/portfolio-v2/sistema-imagenes-svg-image]] (custom loader)
- [[learning/frontend/css/themes/theme-system-portfolio-v2]] (sistema theming v2, paralelo)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (flujo end-to-end)
- ADR-009: `attribute="class"` en next-themes
- **ADR-024: RPC `get_site_payload` + `unstable_cache` vs Promise.all de queries** (nuevo, 2026-10-07)
- ADR-011: Schema `portfolio` en Supabase
- ADR-012: Zod para shape de content jsonb
- ADR-013: Tipado automático con `supabase gen types`

## Próximo paso

Sigo con el **Orquestador** (`services/data/site.ts` + `schemas.ts` + cómo se conecta a UI). Decime cuando quieras parar o seguir.
