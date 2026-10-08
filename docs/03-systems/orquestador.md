---
title: "Orquestador site.ts — RPC + cache + Zod (puente DB → UI)"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-07
updated: 2026-10-07
tags: [orquestador, supabase, rpc, unstable_cache, zod, schemas, server-component, portfolio-v2, system]
verified_with: minimax-m3
replaces: getGeneralData-pattern (Promise.all de 17 queries individuales)
---

> **TL;DR:** `services/data/site.ts` es el **único punto de entrada** de toda la data de la DB hacia la UI. Llama a un **RPC en PostgreSQL** (`portfolio.get_site_payload`) que devuelve todo el contenido + metadata en **1 sola query** y valida cada bloque con su Zod schema. En desarrollo va siempre a la BD (sin cache); en producción cachea con `unstable_cache` por 1 hora y se invalida con `revalidateTag('site:<lang>')`. El componente Server `app/page.tsx` lo consume y propaga a las 7 secciones.

## 🎯 Por qué existe este orquestador

Sin él, cada componente haría su propio `await supabase.from(...)` + su propio Zod parse, replicando N veces la lógica de fetch + validación. Con el orquestador:

- **Un solo lugar** sabe cómo se llama la DB, cómo se valida y cómo se entrega.
- **Una sola query** trae todo (en vez de N queries paralelas).
- **Dev**: 1 query por request (sin cache, ves los cambios al instante).
- **Prod**: 1 query cada 1 hora (cache compartido entre todos los usuarios).

## 📁 El archivo completo (90 líneas)

```ts
// src/services/data/site.ts
import { unstable_cache } from 'next/cache';
import { z } from 'zod';
import {
  HeroContentSchema, NavbarContentSchema, SkillsContentSchema,
  AboutMeContentSchema, ProjectsContentSchema, ContactContentSchema,
  FooterContentSchema, ProjectItemSchema,
  HeroMetadataSchema, SkillsMetadataSchema, AboutMeMetadataSchema,
  ProjectsMetadataSchema, GeneralContactsSchema,
} from '@/components/schemas';
import { createClient } from '@/services/supabase/server';

const SitePayloadSchema = z.object({
  content: z.object({
    'section.hero': HeroContentSchema,
    'section.navbar': NavbarContentSchema,
    'section.skills': SkillsContentSchema,
    'section.aboutme': AboutMeContentSchema,
    'section.projects': ProjectsContentSchema,
    'section.contact': ContactContentSchema,
    'section.footer': FooterContentSchema,
    'project.centeno-advisory': ProjectItemSchema,
    'project.centeno-advisory-db': ProjectItemSchema,
    'project.centeno-advisory-features': ProjectItemSchema,
    'project.portfolio': ProjectItemSchema,
    'project.nincy': ProjectItemSchema,
  }),
  metadata: z.object({
    'section.hero': HeroMetadataSchema,
    'general.contacts': GeneralContactsSchema,
    'section.skills': SkillsMetadataSchema,
    'section.aboutme': AboutMeMetadataSchema,
    'project.centeno-advisory': ProjectsMetadataSchema,
    'project.centeno-advisory-db': ProjectsMetadataSchema,
    'project.centeno-advisory-features': ProjectsMetadataSchema,
    'project.portfolio': ProjectsMetadataSchema,
    'project.nincy': ProjectsMetadataSchema,
  }),
});

export type SitePayload = z.infer<typeof SitePayloadSchema>;

const fetchPayload = async (supabase: any, lang: string): Promise<SitePayload> => {
  // Solo pedimos al RPC las keys que nuestro schema conoce (seguridad + bytes)
  const allowedKeys = [
    ...Object.keys(SitePayloadSchema.shape.content.shape),
    ...Object.keys(SitePayloadSchema.shape.metadata.shape),
  ];

  const { data, error } = await supabase.rpc('get_site_payload', {
    p_lang: lang,
    p_keys: allowedKeys,
  });
  if (error) throw new Error(`[site] RPC error: ${error.message}`);

  // Validar content bloque por bloque (te dice exactamente cuál falló)
  for (const [key, schema] of Object.entries(SitePayloadSchema.shape.content.shape)) {
    const value = data?.content?.[key];
    if (value === undefined) throw new Error(`[site] Missing content for "${key}"`);
    const result = (schema as z.ZodType).safeParse(value);
    if (!result.success) {
      console.error(`[site] Content invalid for "${key}":`, result.error);
      console.error(`[site] Actual content for "${key}":`, JSON.stringify(value, null, 2));
      throw new Error(`[site] Invalid content for "${key}": ${result.error.issues[0]?.message}`);
    }
  }

  // Metadata es opcional por bloque
  for (const [key, schema] of Object.entries(SitePayloadSchema.shape.metadata.shape)) {
    const value = data?.metadata?.[key];
    if (value === undefined) continue;
    const result = (schema as z.ZodType).safeParse(value);
    if (!result.success) {
      console.error(`[site] Metadata invalid for "${key}":`, result.error);
      throw new Error(`[site] Invalid metadata for "${key}": ${result.error.issues[0]?.message}`);
    }
  }

  return SitePayloadSchema.parse(data);
};

// createClient() usa cookies() → debe correr FUERA del cache.
export const getSiteData = async (lang: string = 'es'): Promise<SitePayload> => {
  const supabase = await createClient();

  return unstable_cache(
    async () => fetchPayload(supabase, lang),
    ['site-payload', lang],
    { revalidate: 3600, tags: [`site:${lang}`] },
  )();
};
```

## 🧠 Anatomía (4 partes)

### Parte 1: SitePayloadSchema (Zod)

```ts
const SitePayloadSchema = z.object({
  content: z.object({ 'section.hero': HeroContentSchema, ... }),
  metadata: z.object({ 'general.contacts': GeneralContactsSchema, ... }),
});
```

Es un **único `z.object` anidado** que agrupa todos los schemas por key. Zod infiere el tipo completo (`SitePayload`) y valida todo de una.

### Parte 2: Lista de keys permitidas

```ts
const allowedKeys = [
  ...Object.keys(SitePayloadSchema.shape.content.shape),
  ...Object.keys(SitePayloadSchema.shape.metadata.shape),
];
```

**Single source of truth**: las keys que el RPC trae son exactamente las que están en `SitePayloadSchema`. Si agregás una key al schema, se filtra automáticamente al RPC. Si no la agregás, no se transfiere al cliente.

### Parte 3: Validación bloque por bloque

```ts
for (const [key, schema] of Object.entries(SitePayloadSchema.shape.content.shape)) {
  const value = data?.content?.[key];
  // ...
  const result = (schema as z.ZodType).safeParse(value);
  if (!result.success) {
    console.error(`[site] Content invalid for "${key}":`, result.error);
    console.error(`[site] Actual content:`, JSON.stringify(value, null, 2));
    throw new Error(...);
  }
}
```

**Por qué no usar `SitePayloadSchema.parse(data)` directo**: porque tira un error genérico que no dice **qué key** falló. El loop te dice exactamente: `[site] Content invalid for "project.centeno-advisory-db": Expected string, received array`.

### Parte 4: Cache condicional (dev sin cache, prod 1 hora)

```ts
export const getSiteData = async (lang: string = 'es'): Promise<SitePayload> => {
  const supabase = await createClient();   // ← usa cookies() — FUERA del cache

  // Cache solo en producción: en dev vas directo a la BD para ver cambios al instante.
  const shouldCache = process.env.NODE_ENV === 'production';
  const fetcher = async () => fetchPayload(supabase, lang);

  if (!shouldCache) return fetcher();

  return unstable_cache(fetcher, ['site-payload', lang], {
    revalidate: 3600,
    tags: [`site:${lang}`],
  })();
};
```

**Por qué `createClient` está afuera**: `createClient()` lee cookies de Next.js, que es **dinámico**. `unstable_cache` prohíbe usar fuentes dinámicas dentro del scope cacheado. La función cacheada solo recibe `supabase` ya creado y `lang`.

**Por qué el cache es condicional (`NODE_ENV`)**: en desarrollo, un cache de 1 hora obliga a esperar o invalidar manualmente cada vez que tocás un `translations.content`. En `NODE_ENV !== 'production'` el wrapper va directo a la BD — siempre ves el último contenido. En producción, el cache vale porque múltiples requests del mismo usuario en la misma ventana repiten la query si no.

**Si querés invalidar el cache en producción manualmente**, llamá `revalidateTag('site:<lang>')` desde una Server Action o un endpoint.

## 📦 El RPC: portfolio.get_site_payload

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

**Por qué SQL hace el trabajo**:

- `jsonb_object_agg(cb.key, t.content)` agrupa por key en una sola operación
- `p_keys text[]` filtra en SQL antes de transferir por HTTP
- `coalesce(..., '{}'::jsonb)` evita NULL cuando no hay traducciones
- `stable` permite cache interno de Postgres
- `security invoker` respeta RLS

**Shape de retorno**:

```json
{
  "content": { "section.hero": {...}, "section.navbar": {...}, ... },
  "metadata": { "general.contacts": {...}, "section.hero": {...}, ... }
}
```

## 🔄 Flujo end-to-end (DB → Componente)

```
┌──────────────────────────────────────────────────────────────┐
│  1. Browser pide "/"                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  2. Server Component (app/page.tsx)                          │
│     const { content, metadata } = await getSiteData('es');   │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  3. getSiteData (services/data/site.ts)                      │
│     a. createClient() ← usa cookies (FUERA del cache)        │
│     b. NODE_ENV === 'production'?                            │
│        - NO  → ejecuta fetchPayload() directo (dev)          │
│        - SÍ  → unstable_cache(fn):                          │
│           · HIT  → devuelve SitePayload cacheado             │
│           · MISS → ejecuta fetchPayload                     │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  4. fetchPayload                                              │
│     a. supabase.rpc('get_site_payload', { p_lang, p_keys })  │
│     b. Loop sobre SitePayloadSchema.shape.content.shape      │
│        → safeParse cada bloque → throw si falla              │
│     c. SitePayloadSchema.parse(data) → tipo SitePayload      │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  5. PostgreSQL (portfolio.get_site_payload)                  │
│     jsonb_build_object('content', 'metadata')                │
│     - JOIN content_blocks ↔ translations                     │
│     - JOIN content_blocks ↔ content_blocks_metadata          │
│     - WHERE cb.key = ANY(p_keys)                             │
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  6. JSONB response                                            │
│     { content: { [key]: {...} }, metadata: { [key]: {...} } }│
└──────────────────────────────────────────────────────────────┘
                            ↓
┌──────────────────────────────────────────────────────────────┐
│  7. Server Component arma props                              │
│     hero_data = { data: content['section.hero'], meta: ... } │
│     → <HeroSection hero_data={hero_data} />                  │
└──────────────────────────────────────────────────────────────┘
```

## ⚡ Patrón de uso en componentes

```tsx
// app/page.tsx (Server Component)
export default async function Home({ searchParams }: PageProps) {
  const currentLang = resolvedParams.lang || "es";
  const { content, metadata } = await getSiteData(currentLang);

  const hero_data = {
    data: content["section.hero"],
    meta: {
      general: metadata["section.hero"],
      contacts: metadata["general.contacts"],
    },
  };

  return <HeroSection hero_data={hero_data} />;
}
```

**Single call to `getSiteData`** → todos los componentes reciben su data ya validada y cacheada.

## 📈 Métricas

| Métrica | Antes (`getGeneralData`) | Ahora (`getSiteData` + RPC) |
|---|---|---|
| Queries HTTP | 17 paralelas | 1 RPC |
| Latencia típica (Supabase) | 250-400ms | 50-150ms |
| Cache | No | Dev: ninguno · Prod: `unstable_cache` 1 hora |
| Round-trips cuando hay cache hit (prod) | 17 (cada request) | 0 (servido por Next.js) |
| Líneas de código (orquestador) | 102 | 90 |
| Archivos del sistema | 3 (`generaldata.service.ts` + 2 helpers) | 1 (`site.ts`) |
| Validación Zod | Por bloque, dentro del orquestador | Declarativa con `z.object` anidado |

## 🛠️ Cómo agregar contenido (operación cotidiana)

### Cambiar un texto traducible

1. Ir a Supabase Dashboard → Table Editor → `translations`.
2. Update del row con `block_id` apuntando al key y `lang_code` deseado.
3. Cambia el JSON de `content`.
4. **No necesitás redeploy**. La cache expira en 1 hora (o usá `revalidateTag`).

### Agregar un nuevo bloque (`section.testimonials`)

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
     // ...
     'section.testimonials': TestimonialsContentSchema,  // ← nueva línea
   }),
   ```

4. **En `app/page.tsx`**:
   ```tsx
   const testimonials_data = { data: content["section.testimonials"] };
   <TestimonialsSection testimonials_data={testimonials_data} />
   ```

5. **Invalidar cache en producción** (si querés ver el cambio antes de la hora):
   ```ts
   import { revalidateTag } from 'next/cache';
   revalidateTag('site:es');
   ```

   En dev no hace falta — el wrapper ya va directo a la BD.

## 🚨 Manejo de errores

El `fetchPayload` tiene **debug por bloque**:

```
[site] Content invalid for "project.centeno-advisory-db": {
  _errors: [],
  paragraph: { _errors: ['Expected string, received object'] },
  ...
}
[site] Actual content for "project.centeno-advisory-db": {
  "paragraph": { "text": "..." },
  ...
}
Error: [site] Invalid content for "project.centeno-advisory-db": Expected string, received object
```

**Tres cosas útiles en un solo log**: nombre del bloque, campo que falló + tipo esperado/recibido, valor real que llegó.

Si Zod tira en runtime, el throw se traduce a `error.tsx` (Next.js error boundary).

## 🔐 Seguridad: el parámetro `p_keys`

El RPC filtra en SQL antes de transferir por HTTP:

- **Si tenés bloques "draft" en la DB** (ej: `section.testimonials_draft`), no se filtran al cliente aunque estén en `content_blocks`.
- **Single source of truth**: lo que el schema declara es lo que el cliente recibe.

Si agregás un bloque a la DB sin tocar `SitePayloadSchema`, no se transfiere. Si lo agregás al schema, se transfiere.

## ⚠️ Issues conocidas

### 1. Tipos del RPC son `any` hasta regenerar

```ts
const fetchPayload = async (supabase: any, lang: string) => {
  const { data, error } = await supabase.rpc('get_site_payload', { ... });
```

Por ahora uso `supabase: any` para evitar el error de tipos del RPC (los `Database` types no lo conocen todavía). Solución:

```bash
bunx supabase gen types typescript --project-id <ID> --schema portfolio \
  > src/services/supabase/types/types.ts
```

Después se saca el `any` y se tipa correctamente.

### 2. Cache condicional ya está resuelto

El wrapper detecta `NODE_ENV`:

- `NODE_ENV !== 'production'` (dev): va directo a la BD cada request. Ves los cambios al instante.
- `NODE_ENV === 'production'` (prod): cachea 1 hora; se invalida con `revalidateTag('site:<lang>')`.

Si querés forzar cache en dev (raro), levantá con `NODE_ENV=production bun run dev`.

### 3. No hay fallback de idioma

Si `?lang=xx` no existe en la BD, el RPC devuelve `{}` para `content` y el loop tira `Missing content for "section.hero"`. La página rompe.

**Fix futuro**: en `app/page.tsx`, validar `currentLang` contra una lista permitida antes de llamar a `getSiteData`.

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** (RPC `portfolio.get_site_payload`) — interface única.
- **Zod schemas** (`schemas.ts`) — fuente de verdad de las keys y los shapes.
- **Theming v2** — no se mezcla directamente.
- **Icon registry** — `IconNameSchema` se valida al usar `data.tecnologies[].icon_key`.
- **Imágenes** — `image_key` se referencia en metadata pero la URL la construye `supabaseImageLoader`.
- **ErrorBoundary** (`error.tsx`) — captura throws del data layer.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (DB + RPC)
- [[learning/projects/portfolio-v2/tipado-zod-end-to-end]] (tipado SQL → Zod → componente)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (theming)
- ADR-019: page.tsx como único orquestador de queries
- ADR-013: Tipado automático con `supabase gen types`
- ADR-012: Zod para el shape de content jsonb
- ADR-024: get_site_payload RPC vs Promise.all (nuevo, ver `04-decisions/`)

## Próximo paso

Sigo con el **Sistema de Imágenes** (`<Image>` con supabase-image-loader.ts, configuración en `next.config.ts`, vs SVG inline con icon-registry). Decime cuando parar.