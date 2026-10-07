---
title: "Sistema de Testing, CI y Deploy (gap importante)"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [testing, ci, deploy, vitest, github-actions, vercel, gap, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto **NO tiene tests, NO tiene CI, NO tiene config de deploy explícita**. Esto es un gap importante que conviene documentar para el futuro. Los scripts disponibles son solo `dev`, `build`, `start`, `lint` (Biome), `format`, y `gen-types` (regenera tipos desde Supabase). Deploy se asume via Vercel (default Next.js) sin config custom. Esta es la **documentación de un gap**, no de un sistema existente.

## 🎯 Por qué este gap existe (y por qué documentarlo)

El proyecto es un **portfolio personal** de un solo dev. En la práctica:

- **No hay tests** porque el código es mostly UI estática + fetch de Supabase. Un test E2E valdría más que 50 unit tests.
- **No hay CI** porque no hay PRs (trabajo en main directo).
- **No hay config de deploy explícita** porque Vercel auto-detecta Next.js y funciona out-of-the-box.

> **Esto no es "técnico incompleto"**, es **"decisión consciente para el scope"**. Pero conviene documentarlo porque:
> - Cuando otro dev entre al proyecto, va a asumir defaults.
> - Si crece a un producto, va a necesitar tests desde día 1.
> - Si lo abrís a colaboradores, vas a querer CI.

## 📁 Lo que SÍ existe

### Scripts disponibles (`package.json`)

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "biome check",
  "format": "biome format --write",
  "gen-types": "supabase gen types typescript --project-id hlsjbvwnqcwrzfuyocja --schema portfolio > src/types"
}
```

| Script | Cuándo usarlo |
|---|---|
| `bun run dev` | Levanta el server local (Turbopack + Next.js 16) |
| `bun run build` | Build de producción (genera `.next/`) |
| `bun run start` | Sirve el build de producción |
| `bun run lint` | Biome check (lint) |
| `bun run format` | Biome format (auto-fix) |
| `bun run gen-types` | Regenera `src/types` desde Supabase |

### `next.config.ts` (config mínima)

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,    // React Compiler habilitado
  images: {
    loader: "custom",
    loaderFile: "./src/services/assets/supabase-image-loader.ts",
  },
};

export default nextConfig;
```

**Solo 2 configs**:
- `reactCompiler: true` (optimización de React).
- Custom image loader (Supabase).

## ❌ Lo que NO existe (y debería existir si el proyecto crece)

### 1. Tests

**Estado**: 0 archivos de test. `find . -name "*.test.*"` devuelve vacío.

**Herramientas que encajarían** (en orden de prioridad):
- **Vitest** + **React Testing Library** para unit tests de components.
- **Playwright** o **Cypress** para E2E (simula el flujo "abrir `/` → ver home → click en un proyecto → ver modal").
- **MSW (Mock Service Worker)** para mockear Supabase en unit tests.

**Test mínimo viable** (si decidís agregar tests):

```ts
// src/__tests__/schemas.test.ts
import { describe, it, expect } from "vitest";
import { SendEmailSchema } from "@/components/schemas";

describe("SendEmailSchema", () => {
  it("rejects short name", () => {
    const result = SendEmailSchema.safeParse({ name: "a", user_email: "a@b.com", title: "valid title", message: "valid message" });
    expect(result.success).toBe(false);
  });
  it("accepts valid input", () => {
    const result = SendEmailSchema.safeParse({ name: "John", user_email: "John@x.com", title: "Hello", message: "World" });
    expect(result.success).toBe(true);
  });
});
```

**Por qué empezar por acá**: los schemas son puros (no tienen dependencias), y un cambio en el formato de la BD rompe todos los componentes. Un test de validación de schema es el **máximo valor por mínima inversión**.

### 2. CI (Continuous Integration)

**Estado**: 0 archivos en `.github/`. No hay workflows.

**Mínimo viable** (si lo agregás):

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push:
    branches: [main]
  pull_request:
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run lint
      - run: bun run build
      - run: bun run gen-types
```

> **No corro tests** porque no hay. Pero al menos valida que el build pasa y los tipos se regeneran.

### 3. Deploy (configuración explícita)

**Estado**: sin `vercel.json`, sin `.vercel/`, sin `.github/workflows/deploy.yml`.

**Asunción**: Vercel auto-detecta Next.js y hace deploy. Funciona con:

- `git push` a main → Vercel detecta PR o push.
- Build command: `bun run build` (auto-detectado).
- Output: `.next/`.
- Environment variables: configuradas en Vercel Dashboard (las 4 de EmailJS + 2 de Supabase).

**Si quisieras un deploy explícito** (para Vercel):

```json
// vercel.json
{
  "buildCommand": "bun run build",
  "installCommand": "bun install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

> `iad1` = US East (Virginia), que es donde tu Supabase está hosteado.

## 📊 Gap analysis (qué falta para producción)

| Sistema | Estado actual | Esfuerzo para producir | Impacto |
|---|---|---|---|
| Unit tests (schemas, services) | ❌ 0 | 1-2 días | Medio (regresiones) |
| E2E test (home → modal) | ❌ 0 | 1 día | Alto (UX) |
| CI (GitHub Actions) | ❌ 0 | 30 min | Bajo (no PRs aún) |
| Deploy config (Vercel) | ❌ Default | 15 min | Bajo (auto-detect funciona) |
| Monitoring (Sentry, LogRocket) | ❌ 0 | 1 día | Alto (debugging) |
| Lighthouse CI | ❌ 0 | 30 min | Alto (Core Web Vitals) |
| Storybook (component library) | ❌ 0 | 1 día | Bajo (no es una lib) |
| Chromatic (visual regression) | ❌ 0 | 30 min setup | Medio |

**Total estimado para producción-ready**: ~4-5 días.

## 🔧 Cómo agregar tests (cuando sea necesario)

### Paso 1: Setup de Vitest

```bash
bun add -d vitest @vitest/ui @testing-library/react jsdom
```

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
  },
});
```

### Paso 2: Primer test (schemas)

```ts
// src/__tests__/schemas.test.ts
import { describe, it, expect } from "vitest";
import { SendEmailSchema } from "@/components/schemas";

describe("SendEmailSchema", () => {
  it("validates complete form", () => {
    const result = SendEmailSchema.safeParse({
      name: "John",
      user_email: "john@example.com",
      title: "Hello",
      message: "World",
    });
    expect(result.success).toBe(true);
  });
  it("normalizes email to lowercase", () => {
    const result = SendEmailSchema.safeParse({
      name: "John",
      user_email: "JOHN@EXAMPLE.COM",
      title: "Hello",
      message: "World",
    });
    if (result.success) {
      expect(result.data.user_email).toBe("john@example.com");
    }
  });
});
```

### Paso 3: Test E2E con Playwright

```bash
bun add -d @playwright/test
bunx playwright install --with-deps chromium
```

```ts
// e2e/home.spec.ts
import { test, expect } from "@playwright/test";

test("home loads with hero section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Emmanuel Centeno | Full Stack Developer")).toBeVisible();
});
```

## 🔧 Cómo agregar CI

Crear `.github/workflows/ci.yml` (mínimo viable, mostrado arriba).

**Para deploy automático en merge a main**, agregar:
```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v1
      - run: bun install
      - run: bun run build
      - run: bun run gen-types
      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: ${{ '--prod' }}
```

## 🛠️ Cómo deploy manualmente (sin CI)

```bash
# 1. Asegurarse de que el build pasa localmente
bun run build

# 2. Verificar que las env vars están en Vercel
#    (no se commitean, están en Vercel Dashboard)
#    - NEXT_PUBLIC_SUPABASE_URL
#    - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
#    - NEXT_PUBLIC_EMAILJS_SERVICE_ID
#    - NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
#    - NEXT_PUBLIC_EMAILJS_PUBLIC_KEY

# 3. Push a main
git add . && git commit -m "..." && git push origin main

# 4. Vercel detecta el push y hace deploy
#    (o usar Vercel CLI: vercel --prod)
```

## 🔍 Cómo depurar errores en producción (sin monitoring)

```bash
# 1. Vercel Dashboard → tu proyecto → Logs (runtime logs)
# 2. O usar Vercel CLI:
bunx vercel logs <deployment-url>

# 3. Para errores de Supabase:
#    - Login en Supabase Dashboard
#    - Logs → Postgres logs (queries lentas, errores)
#    - API → Logs (errores 4xx/5xx)

# 4. Para errores de EmailJS:
#    - Login en EmailJS Dashboard
#    - History → ver envíos fallidos
```

> **Sin monitoring (Sentry, LogRocket)**, dependés de los logs de Vercel + Supabase + EmailJS. **Funciona** para un portfolio personal, pero es ruidoso para producción.

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** — `gen-types` regenera el tipado desde la BD.
- **Form** — `SendEmailSchema` debería tener un test de validación.
- **Modal** — un test E2E debería cubrir "abrir modal → click en tecnología → ver descripción".

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (origen de los tipos)
- [[learning/projects/portfolio-v2/sistema-modal-formulario-emailjs]] (qué testear primero)
- [[learning/projects/portfolio-v2/sistema-ui-base-atoms-molecules]] (qué componentes testear)

## Próximo sistema

Ya cubrí los 9 principales + este de testing/CI. Quedan:

- **next/font en profundidad** (cómo funciona self-host, subsets, variable system)
- **i18n de metadata** (cómo hacer que `metadata.title` cambie con `?lang`)
- **Manejo de errores a nivel de servicio** (try/catch en `data.service.ts`, fallback strategies)
- **Patrón de barrel `components.ts`** (re-exports, ciclos, RSC boundary issues)
- **Type helpers** (`PortfolioClient`, derivación desde `Database`)

Decime cuál priorizar o si querés un **overview final** que conecte todos los sistemas.
