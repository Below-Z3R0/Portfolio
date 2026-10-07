---
title: "DEPRECATED — getData / getMetaData / getGeneralData (Promise.all de 17 queries)"
type: system-documentation
project: portfolio-v2
scope: project
status: deprecated
deprecated_on: 2026-10-07
deprecated_by: services/data/site.ts (RPC + unstable_cache)
replaced_by: ../orquestador.md + ../../../04-decisions/024-rpc-get-site-payload.md
tags: [deprecated, supabase, zod, schemas, parallel-queries, getGeneralData, portfolio-v2, system]
verified_with: minimax-m3
---

> ⚠️ **DEPRECATED 2026-10-07**. Esta documentación describe el patrón viejo (`getData`/`getMetaData`/`getGeneralData` con 17 queries paralelas). Se conserva **solo como referencia histórica** del antes/después del refactor.
>
> **No usar en código nuevo**. Para el flujo actual, ver:
> - `../orquestador.md` (orquestador actual con RPC + cache)
> - `../../../04-decisions/024-rpc-get-site-payload.md` (ADR con el rationale del cambio)
> - `../db-supabase.md` (DB + RPC actualizado, sin este patrón)

## 🎯 Por qué se deprecó

| Aspecto | Antes (este patrón) | Ahora (`site.ts` + RPC) |
|---|---|---|
| Queries HTTP por request | 17 paralelas | 1 RPC |
| Cache de server | No | `unstable_cache` 1 hora |
| Round-trips en cache hit | 17 (no había cache) | 0 |
| Validación Zod | Manual, destructuring posicional | Declarativa con `z.object` anidado |
| Filtrado de keys | No (se transferían todas) | Sí (SQL filtra con `p_keys`) |
| Líneas del orquestador | 102 | 90 |
| Archivos del sistema | 3 (`generaldata.service.ts` + 2 helpers) | 1 (`site.ts`) |

## 📁 Archivos del patrón deprecado

Estos archivos **ya no existen en el repo** (fueron borrados el 2026-10-07). Documentados acá solo para entender qué resolvía cada uno.

### `src/services/Data/data.service.ts` (25 líneas)

```ts
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

**Rol**: traía UN bloque de `translations` filtrando por `lang_code` + `content_blocks.key`. Validaba con Zod.

### `src/services/Data/metadata.service.ts` (23 líneas)

```ts
import type { z } from "zod";
import type { PortfolioClient } from "../supabase/types/types.helper";

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
      `Error fetching metadata for block_key ${block_key}: ${error.message}`
    );

  return schema.parse(data.content);
};
```

**Rol**: idéntico a `getData` pero sobre `content_blocks_metadata` (sin `lang_code` porque metadata no es traducible).

### `src/services/generaldata.service.ts` (102 líneas)

```ts
import {
  type GeneralData,
  type ContactSectionMetadata,
  CONTENT_SCHEMAS,
  GeneralContactsSchema,
  METADATA_SCHEMAS,
  PROJECT_ITEM_SCHEMA,
  PROJECT_METADATA_SCHEMA,
} from "../components/schemas";
import { getData } from "./Data/data.service";
import { getMetaData } from "./Data/metadata.service";
import { createClient } from "./supabase/server";

export const getGeneralData = async (lang: string = "es"): Promise<GeneralData> => {
  const supabase = await createClient();

  // 1) 8 queries de content (paralelo)
  const [
    hero_section, navbar_section, skills_section, projects_section,
    aboutme_section, contact_section, footer_section,
    centenoadvisory, centenoadvisory_db, centenoadvisory_features,
    portfolio, nincy,
  ] = await Promise.all([
    getData("section.hero", lang, supabase, CONTENT_SCHEMAS["section.hero"]),
    getData("section.navbar", lang, supabase, CONTENT_SCHEMAS["section.navbar"]),
    getData("section.skills", lang, supabase, CONTENT_SCHEMAS["section.skills"]),
    getData("section.projects", lang, supabase, CONTENT_SCHEMAS["section.projects"]),
    getData("section.aboutme", lang, supabase, CONTENT_SCHEMAS["section.aboutme"]),
    getData("section.contact", lang, supabase, CONTENT_SCHEMAS["section.contact"]),
    getData("section.footer", lang, supabase, CONTENT_SCHEMAS["section.footer"]),

    getData("project.centeno-advisory", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.centeno-advisory-db", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.centeno-advisory-features", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.portfolio", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.nincy", lang, supabase, PROJECT_ITEM_SCHEMA),
  ]);

  // 2) 9 queries de metadata (paralelo)
  const [
    hero_meta, skills_section_meta, aboutme_section_meta,
    centenoadvisory_meta, centenoadvisory_db_meta, centenoadvisory_features_meta,
    portfolio_meta, nincy_meta, contacts_meta,
  ] = await Promise.all([
    getMetaData("section.hero", supabase, METADATA_SCHEMAS["section.hero"]),
    getMetaData("section.skills", supabase, METADATA_SCHEMAS["section.skills"]),
    getMetaData("section.aboutme", supabase, METADATA_SCHEMAS["section.aboutme"]),
    getMetaData("project.centeno-advisory", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.centeno-advisory-db", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.centeno-advisory-features", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.portfolio", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.nincy", supabase, PROJECT_METADATA_SCHEMA),
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

**Rol**: orquestador que llamaba a `getData`/`getMetaData` 12 + 5 veces en `Promise.all`, validaba con Zod, y reensamblaba en `GeneralData`.

## 🧠 Por qué este patrón ya no sirve

1. **17 round-trips HTTP por request**. Sin cache, cada render disparaba 17 queries. Con cache de Next.js podías mitigar HTTP, pero no DB load.

2. **Mapeo manual en JS**. `CONTENT_SCHEMAS` y `METADATA_SCHEMAS` como mapas auxiliares, más destructuring posicional de arrays. Verboso y propenso a errores de orden.

3. **Tipo orquestador dedicado (`GeneralData`)**. Cada cambio de bloque tocaba como una superficie (schema + mapa + destructuring + reensamble + tipo). 5 lugares por cada bloque nuevo.

4. **No filtraba keys en SQL**. Si la DB tenía bloques que el código no conocía, **se transferían igual** (Zod descarta keys desconocidas en silencio). Esto es un foot-gun de seguridad.

## 🚨 Lo que aún podrías leer útil de acá

Si estás migrando código viejo o querés entender qué resolvía cada función, las firmas genéricas siguen siendo útiles como referencia mental:

- `getData<T>(block_key, lang, supabase, schema)` → un bloque, validado con T
- `getMetaData<T>(block_key, supabase, schema)` → un bloque de metadata, validado con T

El RPC actual hace lo mismo pero en SQL: `get_site_payload(p_lang, p_keys)` → todos los bloques, validados en TS con `SitePayloadSchema`.

## 🔗 Ver también (patrón actual)

- `../orquestador.md` — orquestador nuevo (`site.ts`)
- `../db-supabase.md` — DB + RPC actualizado
- `../../../04-decisions/024-rpc-get-site-payload.md` — ADR del refactor

## Deprecado por

ADR-024 (2026-10-07): RPC `get_site_payload` + `unstable_cache` vs Promise.all de queries.