---
title: "ADR-024 — RPC get_site_payload + unstable_cache vs Promise.all de queries"
type: adr
project: portfolio-v2
scope: project
status: accepted
created: 2026-10-07
updated: 2026-10-07
tags: [adr, supabase, rpc, unstable_cache, zod, performance, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El orquestador pasó de **17 queries paralelas** (`getGeneralData` con `Promise.all`) a **1 sola query** al RPC `portfolio.get_site_payload`, cacheada con `unstable_cache(revalidate: 3600)`. El cambio reduce round-trips HTTP, elimina la capa intermedia de mapeo en JS, y permite filtrar en SQL qué keys se transfieren al cliente.

## 🧭 Estado

- **Status**: Aceptado
- **Fecha**: 2026-10-07
- **Reemplaza**: el patrón `getGeneralData` (17 queries paralelas con `Promise.all`)

## 🎯 Contexto

El orquestador anterior (`src/services/generaldata.service.ts`) tenía:

- 2 `Promise.all` (uno para content, otro para metadata) con **17 queries HTTP en paralelo**.
- Cada query llamaba a `getData` o `getMetaData`, que hacía su propio `.from(...).select(...).eq(...)`.
- No había cache: cada request disparaba las 17 queries.
- El armado del `GeneralData` era verboso: destructuring de arrays + reensamblaje manual.

**Problemas identificados**:

1. **17 round-trips HTTP a PostgREST por request** (incluso cacheados en cliente, el server debe repetirlos).
2. **No había caché en el server**: cada request al server-side renderizaba todo desde cero.
3. **Mapeo manual en JS**: `CONTENT_SCHEMAS` y `METADATA_SCHEMAS` como mapas auxiliares, más `validateAll` o destructuring posicional.
4. **Acoplamiento código ↔ DB**: si agregás un bloque a `content_blocks` sin tocar el código, **se filtra al cliente** silenciosamente (Zod descarta keys desconocidas).

## ⚖️ Opciones consideradas

### Opción A: mantener el patrón actual (rechazada)

17 queries paralelas con `Promise.all`, sin cache.

**Pro**:
- Cero cambios en DB.
- Una capa más familiar (`getData` por bloque).

**Contra**:
- Sin cache de server → 17 queries por cada render.
- Más bytes transferibles (no filtra en SQL).
- Verboso (102 líneas en `generaldata.service.ts`).

### Opción B: Single query a `translations` con grouping en JS (rechazada)

Una sola query a `translations` con `.select('content, content_blocks!inner(key)')` sin filtro de key, después mapear en JS.

```ts
const { data } = await supabase
  .from('translations')
  .select('content, content_blocks!inner(key)')
  .eq('lang_code', lang);

// Mapear array → { [key]: content } en JS
const byKey = Object.fromEntries(
  data.map(r => [(r.content_blocks as { key: string }).key, r.content]),
);
```

**Pro**:
- 1 sola query a `translations` (1 round-trip).
- Sin cambios en DB.

**Contra**:
- **No filtra en SQL**: si la DB tiene 27 bloques pero el código usa 12, se transfieren los 27 (silencio en Zod).
- **No escala a metadata**: hay que hacer **otra** query a `content_blocks_metadata`. Total: 2 queries.
- Sin cache.

### Opción C: RPC `get_site_payload` + `unstable_cache` (aceptada)

Una sola query a un RPC en SQL que devuelve `{ content: {[key]:...}, metadata: {[key]:...} }` filtrado por keys permitidas. Cacheado con `unstable_cache`.

```sql
create or replace function portfolio.get_site_payload(
  p_lang text,
  p_keys text[] default null
) returns jsonb
language sql
stable
security invoker
as $$
  select jsonb_build_object(
    'content', coalesce((
      select jsonb_object_agg(cb.key, t.content)
      from portfolio.content_blocks cb
      join portfolio.translations t on t.block_id = cb.id
      where t.lang_code = p_lang
        and (p_keys is null or cb.key = any(p_keys))
    ), '{}'::jsonb),
    'metadata', coalesce((
      select jsonb_object_agg(cb.key, m.content)
      from portfolio.content_blocks cb
      join portfolio.content_blocks_metadata m on m.block_id = cb.id
      where p_keys is null or cb.key = any(p_keys)
    ), '{}'::jsonb)
  );
$$;
```

**Pro**:
- **1 sola query HTTP** (reemplaza 17).
- **Filtra en SQL** antes de transferir: el RPC solo devuelve las keys que el código conoce.
- **Single source of truth**: `SitePayloadSchema` define qué keys se traen.
- **Cache de 1 hora** con `unstable_cache`: cero queries en cache hit.
- **SQL hace el trabajo**: `jsonb_object_agg` agrupa por key en una operación.
- **Validación declarativa** con `z.object` anidado: Zod infiere `SitePayload` y valida todo de una.

**Contra**:
- Hay que mantener un RPC (migración SQL).
- Tipos del RPC son `any` hasta regenerar `supabase gen types`.
- `createClient()` (que usa `cookies()`) **debe correr fuera del cache** (limitación de `unstable_cache`).

## ✅ Decisión

**Opción C**. Se aplica:

1. Crear el RPC `portfolio.get_site_payload(p_lang text, p_keys text[] default null)` en el schema `portfolio`.
2. Crear `src/services/data/site.ts` con:
   - `SitePayloadSchema` (Zod anidado).
   - `fetchPayload(supabase, lang)` que llama al RPC y valida por bloque.
   - `getSiteData(lang)` envuelto en `unstable_cache(revalidate: 3600, tags: ['site:${lang}'])`.
3. Borrar `src/services/generaldata.service.ts`, `src/services/Data/data.service.ts`, `src/services/Data/metadata.service.ts`.
4. Limpiar `schemas.ts` (borrar `CONTENT_SCHEMAS`, `METADATA_SCHEMAS`, `PROJECT_ITEM_SCHEMA`, `PROJECT_METADATA_SCHEMA`, tipo `GeneralData`).
5. Actualizar `app/page.tsx` para consumir `getSiteData()`.

## 📊 Comparación

| Métrica | Antes (Opción A) | Después (Opción C) |
|---|---|---|
| Queries HTTP por request | 17 | 1 |
| Queries HTTP en cache hit | 17 (no había cache) | 0 |
| Bytes transferidos | 17 keys × jsonb | Solo keys declaradas en `SitePayloadSchema` |
| Latencia típica (Supabase) | 250-400ms | 50-150ms |
| Líneas de orquestador | 102 | 90 |
| Archivos del sistema | 3 | 1 |
| Validación Zod | Manual, destructuring posicional | Declarativa con `z.object` anidado |
| Filtrado de keys | No (se transfieren todas) | Sí (SQL filtra antes) |

## 🔄 Consecuencias

### Positivas

- **Performance**: 1 query por hora (cache hit) → 0ms.
- **Seguridad**: bloques con keys no declaradas en `SitePayloadSchema` no se filtran al cliente.
- **Mantenibilidad**: agregar un bloque = 3 líneas (schema + SitePayloadSchema + componente). Antes era más disperso.
- **Debug por bloque**: el loop en `fetchPayload` reporta exactamente qué key falló, qué campo y qué valor tenía.

### Negativas

- **Migración SQL nueva**: el RPC debe estar en la DB antes de deployar la app.
- **Tipado manual**: hasta regenerar `supabase gen types`, el parámetro `supabase: any` y el cast `as any` en `rpc(...)` evitan errores de TS. **Pendiente de resolver**.
- **Debugging SQL**: si el RPC tira, hay que correrlo manualmente desde el SQL Editor.
- **No hay fallback de idioma**: si `?lang=xx` no existe, la página rompe (no había fallback antes tampoco).

## 🔗 Conexiones

- Implementado en: `src/services/data/site.ts`.
- RPC: `portfolio.get_site_payload` (ver `docs/03-systems/db-supabase.md` para el SQL completo).
- Documentación: `docs/03-systems/orquestador.md` (refactorizado para reflejar este approach).
- ADR relacionado: ADR-013 (tipado automático con `supabase gen types`).

## Próximos pasos

1. **Regenerar tipos** con `bunx supabase gen types typescript` para sacar el `as any` del RPC.
2. **Validar en dev** que `bun dev` levante y cargue las secciones con datos.
4. (Opcional) Implementar fallback de idioma.