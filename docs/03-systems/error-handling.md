---
title: "Sistema de manejo de errores (data layer + ErrorBoundary)"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [error-handling, data-service, supabase, error-boundary, fallback, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto tiene **dos capas de manejo de errores** que NO están bien conectadas. La capa 1 está en `data.service.ts` / `metadata.service.ts` / `generaldata.service.ts`: hacen `throw new Error(...)` cuando Supabase falla o cuando Zod no valida. La capa 2 está en `app/error.tsx` que captura el error y renderiza un `<ErrorPage>` con botón de retry. **El gap**: NO hay un `loading.tsx` que se muestre mientras la promesa está pendiente, no hay cache de último valor conocido, y no hay retry exponencial. **El usuario ve la pantalla de error después de ~250-400ms de carga silenciosa**. Esto es funcional pero minimalista.

## 🎯 Filosofía: 2 capas sin coordinación

1. **Capa 1 (data layer)**: throw cuando algo falla (Supabase timeout, Zod no valida, lang no existe).
2. **Capa 2 (ErrorBoundary)**: captura el throw, renderiza un componente de error con un botón "Reintentar".

**No hay**:
- Try/catch con fallback (ej. "si falla, muestra datos estáticos de fallback").
- Loading state (el usuario no ve "cargando..." mientras la promesa está pendiente).
- Retry exponencial.
- Cache de último valor conocido.

> Esto es **funcional pero básico**. Para un portfolio personal está OK. Para producción se necesita más.

## 📁 Archivos

| Archivo | Rol |
|---|---|
| `src/services/Data/data.service.ts` | `getData<T>(block_key, lang, supabase, schema)` con throw en error |
| `src/services/Data/metadata.service.ts` | `getMetaData<T>` con throw en error |
| `src/services/generaldata.service.ts` | Orquestador que hace 17 queries, **sin try/catch** |
| `src/app/error.tsx` | ErrorBoundary raíz |
| `src/components/organims/ErrorPage.tsx` | Molecule que renderiza el error UI |
| `src/components/molecules/ErrorMessage.tsx` | Modal de error para el form (distinto) |

## 🔍 El throw en `data.service.ts`

```ts
export const getData = async <Schema extends z.ZodType>(
  block_key: string,
  lang: string,
  supabase: PortfolioClient,
  schema: Schema,
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
      `Error fetching data for block_key ${block_key} and language ${lang}: ${error.message}`,
    );

  return schema.parse(data.content);  // ← también puede throw
};
```

**3 throw points**:
1. `supabase.from(...).single()` falla si no encuentra rows (PostgREST error 406).
2. `data` es `null` si el query devuelve 0 rows.
3. `schema.parse(data.content)` falla si la validación Zod no matchea.

**Mensaje del error**: tiene `block_key` y `lang` (útil para debug).

## 🔍 El orquestador NO tiene try/catch

```ts
// generaldata.service.ts
const [
  hero_section,
  navbar_section,
  // ... 16 más
] = await Promise.all([
  getData("section.hero", ...),
  // ... 16 más
]);
```

> **Si UNA sola query falla, las 17 fallan al mismo tiempo** (porque `Promise.all` rechaza en la primera). El usuario ve el error global, **no las que sí funcionaron**.

**Fix planeado** (no implementado):
```ts
const results = await Promise.allSettled([
  getData("section.hero", ...),
  // ...
]);

const [hero_section, navbar_section, ...] = results.map(r => {
  if (r.status === "fulfilled") return r.value;
  // Fallback o throw según contexto
  return FALLBACKS[i];
});
```

> `Promise.allSettled` espera a todas y devuelve `{status, value|reason}` por cada una. Más robusto.

## 🔍 El `error.tsx` (la otra capa)

```tsx
"use client";
import { useEffect } from "react";
import { ErrorPage } from "../components/components";

export default function Err({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Error crítico en la HomePage:", error);
  }, [error]);

  return (
    <ErrorPage
      message={`Hubo un problema al conectar con el servidor. ${error.message ?? "Unknown error"}`}
      onRetry={reset}
    />
  );
}
```

**3 partes**:
1. `useEffect` loguea el error en consola (debug).
2. `reset` es la función que Next.js pasa para reintentar el render.
3. `ErrorPage` molecule (en `organims/`) renderiza el UI.

## 🎨 El `<ErrorPage>` molecule

```tsx
// src/components/organims/ErrorPage.tsx (extracto)
<div className="min-h-screen w-full flex items-center justify-center p-6">
  <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl flex flex-col items-center text-center space-y-6">
    {/* Icon con X animada */}
    <m.path d="M6 6l12 12M18 6L6 18" />
    <Title2>¡Ups! Algo salió mal</Title2>
    <Paragraph>{message}</Paragraph>
    {onRetry && <Button onClick={onRetry} txt="Reintentar" ... />}
  </div>
</div>
```

**Estructura**:
- Card centrada (max-w-md).
- Icon de error (la X con `motion`).
- Title2 + Paragraph con el mensaje.
- Button "Reintentar" (opcional).

## 🔄 El flujo completo del error

```
Server Component (app/page.tsx) ejecutando
  ↓
await getGeneralData("en")
  ↓
getGeneralData llama 17 queries en Promise.all
  ↓
Una query falla: supabase.from(...).single() throws
  ↓
El error se propaga por el Promise chain
  ↓
Next.js captura el throw en el ErrorBoundary
  ↓
Renderiza app/error.tsx (en lugar de app/page.tsx)
  ↓
<ErrorPage message={...} onRetry={reset} />
  ↓
User ve el error
  ↓
User hace click en "Reintentar"
  ↓
reset()  ← Next.js re-intenta el render de app/page.tsx
  ↓
Si Supabase ya volvió → page.tsx normal
Si sigue caído → app/error.tsx de nuevo
```

## ⚠️ Issues conocidas

### 1. **No hay loading state**

El usuario **no ve nada** mientras la promesa está pendiente (250-400ms). El `app/loading.tsx` existe y renderiza `<HomePageSkeleton>`, **pero solo si Next.js detecta que la página es async**. Como `page.tsx` es async, el skeleton se ve brevemente. **Issue menor**: el skeleton es bueno, pero el cambio de skeleton → error es abrupto.

### 2. **No hay fallback (datos estáticos si falla Supabase)**

```ts
// Ideal:
const data = await getData(...).catch(() => FALLBACK_DATA[block_key]);
```

> **Issue**: si Supabase está caído, la página se rompe aunque tengas un fallback hardcoded. No hay fallback.

**Fix planeado**:
```ts
// src/services/Data/fallbacks.ts (nuevo)
export const FALLBACKS: Record<string, any> = {
  "section.hero": { title: "...", contact: "..." },
  // ... 12 más
};

export const getData = async <S>(...) => {
  try {
    return await fetchFromSupabase();
  } catch (e) {
    console.error("Supabase failed, using fallback:", e);
    return FALLBACKS[block_key];  // ← fallback hardcoded
  }
};
```

> Esto requiere mantener los fallbacks sincronizados con la BD. **No trivial**.

### 3. **No hay cache de último valor conocido**

```ts
// Ideal: cache en memoria
const cache = new Map<string, { data: any; timestamp: number }>();

export const getData = async (...) => {
  if (cache.has(key) && Date.now() - cache.get(key).timestamp < 60_000) {
    return cache.get(key).data;  // ← usa cache si < 1min
  }
  // ... fetch
  cache.set(key, { data, timestamp: Date.now() });
};
```

> **Issue**: cada request refetchea. Si Supabase está lento, la página se demora. No hay cache local.

### 4. **El `error.digest` no se muestra al usuario**

```ts
error: Error & { digest?: string };
```

> Next.js provee un `digest` único (hash) que se puede usar para tracking server-side errors. El proyecto lo ignora.

**Fix**: loguear el `digest` para buscar en Vercel logs:
```ts
useEffect(() => {
  console.error("Error crítico en la HomePage:", error, error.digest);
  // O enviar a Sentry/Datadog
}, [error]);
```

### 5. **El error.message puede exponer info interna**

```tsx
message={`Hubo un problema al conectar con el servidor. ${error.message ?? "Unknown error"}`}
```

> **Issue**: `error.message` puede tener info del SQL (ej. `relation "translations" does not exist`). **Riesgo de seguridad en producción**.

**Fix**: sanitizar el mensaje o no exponerlo:
```ts
const safeMessage = error.message.includes("relation") ? "Error de base de datos" : error.message;
```

### 6. **No hay distinción entre tipos de error**

Todos los errores se manejan igual (throw + ErrorBoundary). Pero hay diferencias importantes:

| Tipo | Comportamiento actual | Debería ser |
|---|---|---|
| Supabase timeout (network) | Throw → ErrorBoundary | Loading + retry, después ErrorBoundary |
| Supabase 404 (no existe) | Throw → ErrorBoundary | Fallback a datos hardcoded |
| Zod validation fail | Throw → ErrorBoundary | ErrorBoundary + log con el schema que falló |
| `lang` no existe en BD | Throw → ErrorBoundary | Fallback a `lang=es` (default) |
| `block_key` no existe | Throw → ErrorBoundary | Fallback a un bloque vacío |

> **Ideal**: cada tipo de error tiene su propio handler.

## 🛠️ Cómo agregar un fallback con cache

```ts
// src/services/Data/data.service.ts
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL_MS = 60_000; // 1 minuto

export const getData = async <S extends z.ZodType>(
  block_key: string, lang: string, supabase: PortfolioClient, schema: S,
): Promise<z.infer<S>> => {
  const cacheKey = `${block_key}:${lang}`;
  
  // 1. Intentar cache
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }
  
  // 2. Fetch con fallback
  try {
    const { data, error } = await supabase
      .from("translations")
      .select(...)
      .eq(...)
      .limit(1)
      .single();
    
    if (error || !data) {
      // Fallback si existe cache viejo (incluso expirado)
      if (cached) {
        console.warn(`Using stale cache for ${cacheKey}`);
        return cached.data;
      }
      throw new Error(`...`);
    }
    
    const parsed = schema.parse(data.content);
    cache.set(cacheKey, { data: parsed, timestamp: Date.now() });
    return parsed;
  } catch (e) {
    if (cached) {
      console.warn(`Using stale cache for ${cacheKey} after error`);
      return cached.data;
    }
    throw e;
  }
};
```

## 🛠️ Cómo agregar monitoring (Sentry, Datadog, etc.)

```ts
// app/error.tsx
"use client";
import * as Sentry from "@sentry/nextjs";

export default function Err({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { digest: error.digest } });
  }, [error]);
  
  return <ErrorPage message={...} onRetry={reset} />;
}
```

```bash
bun add @sentry/nextjs
bunx @sentry/wizard@latest -i nextjs
```

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** — el throw en `data.service.ts` es la primera capa.
- **ErrorBoundary (`app/error.tsx`)** — la segunda capa.
- **Form (Modal de error)** — la tercera capa (form-level error).
- **Theming v2** — el `<ErrorPage>` usa `bg-card`, `border-destructive/40`, etc.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (origen del error en Supabase)
- [[learning/projects/portfolio-v2/sistema-modal-formulario-emailjs]] (error del form, distinto)
- [[learning/projects/portfolio-v2/sistema-seo-metadata-fonts-errorboundary]] (cómo se renderiza el error)
- [[learning/projects/portfolio-v2/testing-ci-deploy-gap]] (cómo testear estos errores)

## Próximo sistema

Sigo con **Patrón de barrel `components.ts`**, **Type helpers** (`PortfolioClient`), **i18n de metadata**, o un **overview final** que conecte todos los sistemas documentados.

Decime.
