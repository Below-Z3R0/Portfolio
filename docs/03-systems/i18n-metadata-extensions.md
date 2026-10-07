---
title: "i18n de metadata — cómo hacer que `<html lang>`, `metadata.title`, y OpenGraph cambien con `?lang=`"
type: extension
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [i18n, metadata, opengraph, html-lang, next-themes, portfolio-v2, extension]
verified_with: minimax-m3
---

> **TL;DR:** Este doc es una **extensión** de `sistema-i18n-multi-idioma.md`. Cubre cómo propagar el `?lang=` a 3 lugares que actualmente NO lo respetan: (1) `<html lang>` (siempre es `en`); (2) `metadata.title` y `description` (estáticos); (3) las URLs internas (los `<a href="#Home">` no preservan el lang). Es un issue separado del sistema de i18n principal porque requiere cambios en `app/layout.tsx` + `app/page.tsx` + un middleware opcional.

## 🎯 3 lugares que NO respetan `?lang=`

### 1. `<html lang="en">` (hardcoded en `app/layout.tsx`)

```tsx
// ACTUAL
<html lang="en" ...>
```

> **Issue**: aunque el sitio es bilingüe (ES/EN), el `lang` attribute del `<html>` siempre es `en`. Esto afecta:
> - **SEO** (Google indexa el sitio como English).
> - **Screen readers** (leen con pronunciation de English).
> - **Traducción automática** del browser (ofrece English cuando la página está en Spanish).
> - **OpenGraph** (`og:locale` se deriva del `lang` del HTML).

### 2. `metadata.title` y `metadata.description` (estáticos en `app/layout.tsx`)

```ts
// ACTUAL
export const metadata: Metadata = {
  title: "Emmanuel.dev",
  description: "Created by Emmanuel.dev",
};
```

> **Issue**: si el usuario navega a `?lang=es`, el `<title>` sigue siendo "Emmanuel.dev". Lo mismo con `description`. **No hay i18n de metadata**.

### 3. Las URLs internas no preservan `?lang=`

```tsx
// ACTUAL
<a href="#Home">Inicio</a>
<a href="#Tecnologies">Habilidades</a>
```

> **Issue**: si el user está en `?lang=en` y hace click en "Home", la URL queda `#Home` (sin `?lang=en`). El idioma se pierde. El user tiene que volver a seleccionar el idioma.

## 🛠️ Fix 1 — `<html lang>` dinámico

### Opción A: pasar `lang` desde `page.tsx` (recomendado)

```tsx
// app/page.tsx
export default async function Home({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const currentLang = resolvedParams.lang || "es";
  const general_data = await getGeneralData(currentLang);

  return (
    <html lang={currentLang} ...>
      <body ...>
        <ThemeProvider ...>
          ...
        </ThemeProvider>
      </body>
    </html>
  );
}
```

> **Issue**: `app/layout.tsx` ya no es usado para el `<html>`. **Fix**: mover el `<html>` y `<body>` a `page.tsx`. Next.js 16 permite layout que retorna `null` o `ReactNode` directamente.

### Opción B: leer de `next/headers` en `app/layout.tsx`

```tsx
// app/layout.tsx
import { headers } from "next/headers";

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const headersList = await headers();
  const lang = headersList.get("x-language") || "es";  // ← necesita un middleware
  return (
    <html lang={lang} ...>
      ...
    </html>
  );
}
```

> **Issue**: `next/headers` no expone automáticamente el query param `?lang=`. Necesitas un **middleware** que setee un header `x-language`.

### Opción C: middleware para detectar el lang

```ts
// middleware.ts (nuevo)
import { NextResponse, type NextRequest } from "next/server";

const SUPPORTED_LANGS = ["es", "en"] as const;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const lang = request.nextUrl.searchParams.get("lang") || "es";
  response.headers.set("x-language", lang);
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico).*)"],
};
```

> Con esto, `headersList.get("x-language")` en `app/layout.tsx` retorna el lang actual.

**Fix mínimo**: crear `middleware.ts` + leer el header en layout.

## 🛠️ Fix 2 — `metadata.title` y `description` dinámicos

### Opción A: `generateMetadata` async

```tsx
// app/page.tsx
import type { Metadata } from "next";

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const { lang = "es" } = await searchParams;
  const t = await getTranslations(lang);  // o un dict local
  return {
    title: t("title"),
    description: t("description"),
  };
}
```

> **Issue**: requiere un sistema de translations (next-intl, react-i18next, o un dict propio).

### Opción B: dict local en `app/i18n.ts`

```ts
// app/i18n.ts (nuevo)
const DICT = {
  es: {
    title: "Emmanuel Centeno — Full Stack Developer",
    description: "Portfolio de Emmanuel Centeno...",
  },
  en: {
    title: "Emmanuel Centeno — Full Stack Developer",
    description: "Emmanuel Centeno's portfolio...",
  },
} as const;

export const getMeta = (lang: string = "es") => DICT[lang as keyof typeof DICT] || DICT.es;
```

Uso:
```ts
export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { lang = "es" } = await searchParams;
  const t = getMeta(lang);
  return { title: t.title, description: t.description };
}
```

> **Issue**: el dict local hay que mantenerlo sincronizado con la BD. Si agregás un idioma, agregás 2 entradas en el dict.

### Opción C: leer de la BD

```ts
// services/metadata.service.ts
export const getMetadata = async (lang: string, supabase: PortfolioClient) => {
  const { data } = await supabase
    .from("general_data")
    .select("content")
    .eq("section_name", "metadata")
    .single();
  return data?.content;
};
```

> **Issue**: la BD no tiene una tabla `metadata` traducible. Habría que crearla (o agregar un row en `general_data` con `section_name="metadata"`).

## 🛠️ Fix 3 — URLs internas preservan `?lang=`

### Opción A: helper en cada link

```tsx
// app/components/LinkWithLang.tsx
"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function LinkWithLang({ href, ...props }: { href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  const searchParams = useSearchParams();
  const lang = searchParams.get("lang");
  const finalHref = lang ? `${href}?lang=${lang}` : href;
  return <Link href={finalHref} {...props} />;
}
```

> **Issue**: requiere usar `<LinkWithLang>` en lugar de `<a>` o `<Link>` directo. Invasivo.

### Opción B: middleware que reescribe los links

```ts
// middleware.ts
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const lang = request.nextUrl.searchParams.get("lang");
  if (lang) {
    response.headers.set("x-pathname", request.nextUrl.pathname + `?lang=${lang}`);
  }
  return response;
}
```

> **Issue**: el middleware reescribe headers, no el HTML. **Limitado**.

### Opción C: cookie + helper

```ts
// En LanguageToggle (ya existe)
const toggleLanguage = () => {
  const newLang = currentLang === "es" ? "en" : "es";
  document.cookie = `lang=${newLang}; path=/; max-age=31536000`;
  router.refresh();
};
```

```ts
// middleware.ts (lee cookie)
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const lang = request.nextUrl.searchParams.get("lang") || request.cookies.get("lang")?.value || "es";
  response.headers.set("x-language", lang);
  return response;
}
```

> **Issue**: requiere cookie. Y `next-intl` o similar para traducir el contenido.

## 🛠️ Fix combinado (recomendado para portfolio personal)

Si querés **el máximo impacto con mínima invasividad**:

1. **`middleware.ts`** (nuevo) — detecta `?lang=` y setea `x-language` header.
2. **`app/layout.tsx`** — lee `x-language` y setea `<html lang>`.
3. **`app/page.tsx`** — pasa el `lang` a `<html>` via layout async, y `generateMetadata` que devuelve `title` y `description` en el idioma correcto.
4. **`LanguageToggle`** (ya existe) — preserva `?lang=` en la URL al navegar.

> **Limitación**: las URLs internas siguen sin preservar `?lang=`. Esto requiere **un wrapper de Link** o un dict de traducciones para el contenido. **Esfuerzo mayor**.

## ⚠️ Issues adicionales relacionados (no documentados)

1. **El `Footer.tsx` recibe `meta: NavbarItem[]` (los links del navbar) reusado**. Si el Footer necesita textos diferentes a la NavBar, esto se rompe.
2. **El `LanguageToggle` no preserva `?lang=` después de navegar internamente** (los `<a href="#">` no incluyen el query param).
3. **El `getMetaData` (en orquestador) NO incluye metadata dinámica** — solo el `general.contacts` se lee.
4. **No hay fallback de idioma** — si `?lang=pt` no está en la BD, la página rompe (throw en `getData`).
5. **El `metadataBase`** no está configurado — los OpenGraph URLs son relativos.
6. **El `robots`** no está configurado — Google puede no indexar bien.

## 🔗 Ver también

- [[sistema-i18n-multi-idioma]] (el sistema de i18n principal)
- [[sistema-seo-metadata-fonts-errorboundary]] (metadata estática + ErrorBoundary)
- [[sistema-db-supabase-headless-cms]] (cómo se lee el lang de la BD)
- [[sistema-orquestador-generaldata-service]] (cómo se propaga el lang)
- ADR-017: Labels de proyectos en translations

## Cuándo aplicar este fix

| Cambio | Esfuerzo | Impacto |
|---|---|---|
| Fix 1: `<html lang>` dinámico | Bajo (middleware + 1 línea en layout) | **Alto** (SEO, a11y, OG) |
| Fix 2: `metadata.title` dinámico | Bajo (dict + generateMetadata) | **Alto** (SEO, social sharing) |
| Fix 3: URLs preservan `?lang=` | Alto (wrapper o cookie) | Medio (UX) |
| OpenGraph con `lang` | Bajo (add a metadata) | Alto (social) |
| `robots.txt` + `sitemap.xml` | Bajo (1 archivo cada uno) | Alto (SEO) |

**Total esfuerzo**: ~3 horas para cubrir Fix 1 + Fix 2 + OpenGraph. Fix 3 puede esperar.
