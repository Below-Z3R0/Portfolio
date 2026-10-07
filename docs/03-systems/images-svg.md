---
title: "Sistema de assets: Imágenes raster vs SVG inline"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [imagenes, svg, next-image, supabase-storage, supabase-image-loader, icon-registry, portfolio-v2, system, assets]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto usa **dos sistemas distintos** para servir assets visuales: (1) **Imágenes raster** (`.jpg`, `.png`) con `<Image>` de Next.js + **custom loader** que apunta a Supabase Storage con `?width=&quality=`; (2) **SVGs inline** con un **registry tipado** (`ICON_REGISTRY`) donde cada `icon_key` se valida con Zod y se renderiza inline. **No se mezclan** — el flujo de "imagen" es distinto al flujo de "ícono", y la decisión arquitectónica clave es: **SVG para íconos porque son UI controls (cambiantes con tema)**, **raster para imágenes porque son contenido (fijas)**.

## 🎯 Por qué dos sistemas

| Pregunta | Raster (`<Image>`) | SVG inline (`ICON_REGISTRY`) |
|---|---|---|
| **¿Qué renderiza?** | Fotos (CV, mockups de proyectos) | Íconos (React, Next.js, brand) |
| **¿Cambia con el tema?** | No (la foto del CV es la misma en dark/light) | Sí (algunos SVGs usan `currentColor` para tomar color del theme) |
| **¿Se cachea?** | Sí, por el loader de Supabase + Next/Image | No (inline en el bundle JS) |
| **¿Tamaño bundle?** | Bajo (lazy load, fuera del HTML) | Alto (inline = parte del bundle) |
| **¿Lazy load?** | Sí, por default | No (vienen con el bundle) |
| **¿Tipado seguro?** | Sí (string src) | Sí (`IconKey` type) |
| **¿Validación Zod?** | No (es solo string) | Sí (`IconNameSchema`) |

## 📁 Sistema 1: Imágenes raster (custom loader)

### 3 archivos

| Archivo | Líneas | Rol |
|---|---|---|
| `next.config.ts` | 12 | Config global: activa `loader: "custom"` y `loaderFile` |
| `src/services/assets/supabase-image-loader.ts` | 16 | El loader: añade `?width=&quality=` a la URL de Supabase |
| (componentes que usan `<Image>`) | varios | `HeroSection`, `AboutMeSection`, `ProjectCard` |

### `next.config.ts`

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    loader: "custom",
    loaderFile: "./src/services/assets/supabase-image-loader.ts",
  },
};

export default nextConfig;
```

> `loaderFile` debe ser **ruta relativa a `next.config.ts`**. Por eso `./src/services/assets/...`, no `src/services/...`.

### `supabase-image-loader.ts`

```ts
import type { ImageLoaderProps } from "next/image";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default function supabaseImageLoader({ src, width, quality }: ImageLoaderProps) {
  const cleanSrc = src.replace(/^\//, ""); // quita el leading slash

  if (cleanSrc.startsWith("http")) {
    const url = new URL(cleanSrc);
    url.searchParams.set("width", width.toString());
    url.searchParams.set("quality", (quality ?? 75).toString());
    return url.href;
  }

  return `${SUPABASE_URL}/storage/v1/object/public/project-images/${cleanSrc}?width=${width}&quality=${quality ?? 75}`;
}
```

**Lógica**:

1. Si `src` es URL completa (`https://...`) → agrega `?width=&quality=` como query params (Supabase CDN soporta `?resize=`).
2. Si `src` es path relativo (ej. `"ImgCV.jpg"`) → construye URL completa a Supabase Storage + `?width=&quality=`.

### ¿Cómo se usa?

```tsx
// HeroSection.tsx (ejemplo real)
<Image
  src={`/${hero_data.meta.general.image_key}`}     // ej. "/ImgCV.jpg"
  alt="Foto de perfil de Emmanuel Centeno"
  width={80}
  height={80}
  priority
  className="rounded-full size-25 border border-border object-cover bg-card ring-2 ring-primary/10"
/>
```

```tsx
// ProjectCard.tsx
<Image
  src={`/${project_data.meta.image_key}`}            // ej. "/centenoadvisory.png"
  alt="icon"
  width={80}
  height={80}
  className="object-cover mask-x-to-r"
/>
```

`/` al inicio = la imagen está en el bucket `project-images` de Supabase Storage.

### Flujo completo

```
<Image src="/ImgCV.jpg" width={80} quality={80} />
  ↓ Next/Image llama a supabaseImageLoader({ src: "ImgCV.jpg", width: 80, quality: 80 })
  ↓ Loader retorna: "https://<supabase>/storage/v1/object/public/project-images/ImgCV.jpg?width=80&quality=80"
  ↓ Next/Image hace fetch de esa URL
  ↓ Supabase Storage redimensiona la imagen on-the-fly y la cachea
  ↓ Browser recibe la imagen optimizada
```

### ¿Por qué no usar `<img>` directo?

- **`<img>` no optimiza** (no convierte a WebP, no redimensiona, no lazy-load por default).
- **`<Image>`** sí hace todo eso + placeholder + blur-up.

## 📁 Sistema 2: SVG inline (registry)

### 4 archivos

| Archivo | Líneas | Rol |
|---|---|---|
| `src/services/assets/Icons.tsx` | 627 | Los 19 SVG components hardcoded |
| `src/services/assets/icon-registry.ts` | 61 | El `ICON_REGISTRY` + `IconNameSchema` (Zod) |
| `src/components/atoms/IconRender.tsx` | 14 | El componente que resuelve `name` → `ICON_REGISTRY[name]` |
| (componentes consumidores) | varios | `TecnologiesCard`, `TecnologiesSection`, `ProjectCard`, `Modal`, `HeroSection` |

### `ICON_REGISTRY` (el corazón)

```ts
// icon-registry.ts
import {
  ReactIcon, DockerIcon, NodeIcon, SupaBaseIcon, /* ... 19 iconos */
} from "@/services/assets/Icons";

type IconComponent = React.ComponentType<React.SVGProps<SVGSVGElement>>;

export const ICON_REGISTRY = {
  react: ReactIcon,
  docker: DockerIcon,
  node: NodeIcon,
  // ... 19 total
} as const satisfies Record<string, IconComponent>;

export const IconNameSchema = z
  .string()
  .refine(
    (val) => val in ICON_REGISTRY,
    { message: "Debe ser una key del registry (react, docker...)" }
  );

export type IconKey = keyof typeof ICON_REGISTRY;
```

**3 partes**:

1. **`ICON_REGISTRY`**: objeto indexado por `icon_key`. El `as const satisfies Record<string, IconComponent>` es lo que hace que TS sepa las keys exactas (no `string`).
2. **`IconNameSchema`**: Zod que valida que cualquier string que venga de la BD sea una key válida.
3. **`IconKey` type**: union literal (`"react" | "docker" | ...`) para tipar las props.

### `IconRender.tsx` (el resolver)

```ts
import { ICON_REGISTRY } from "../../services/assets/icon-registry";

export function IconRender({ name, className }: IconRendererProps) {
  const InlineComponent = ICON_REGISTRY[name as keyof typeof ICON_REGISTRY];

  if (InlineComponent) {
    return <InlineComponent className={className} />;
  }
  return null;  // fallback si no matchea
}
```

### ¿Cómo se usa?

```tsx
// TecnologiesCard.tsx
<IconRender
  name={skill.icon_key}              // ej. "react"
  className="size-full text-(--tech-color) filter drop-shadow-[0_0_12px_var(--tech-color)]/50"
/>
```

### Flujo completo

```
<IconRender name="react" className="..." />
  ↓ const InlineComponent = ICON_REGISTRY["react"]  // lookup
  ↓ return <ReactIcon className="..." />
  ↓ <ReactIcon> es <svg>...</svg> inline (en el bundle)
```

### ¿Por qué inline y no `<Image src="react.svg">`?

- **Inline = 0 latencia** (ya está en el bundle).
- **`<Image src="react.svg">` = 1 HTTP request** por cada ícono.
- **Permite usar `currentColor`** (los SVGs usan `fill="currentColor"`), así que el color del ícono es controlado por la utility `text-X` de Tailwind (que se conecta al `--color-X` del theme).
- **Type-safe** (no hay strings mágicos sin validar).

## 🆚 Comparación: ¿cuándo usar cada uno?

| Caso | Usar |
|---|---|
| Foto del CV, mockups de proyectos, screenshots | **`<Image>` con Supabase loader** |
| Logos de marcas (React, Next.js, Docker) | **`<IconRender>` con `icon_key` en la BD** |
| Iconos UI (close, hamburger, language) | **`<IconRender>` con `icon_key` hardcoded en `IconRender` o import directo** (como en `Modal.tsx`, `ProjectCard.tsx`) |
| Backgrounds o imágenes decorativas grandes | **`<Image>` con Supabase loader** |

## 📊 Métricas y comparativa de bundle

| Métrica | `<Image>` con Supabase | `<IconRender>` (SVG inline) |
|---|---|---|
| Bundle JS | 0 KB (lazy) | ~37 KB (todo `Icons.tsx` inline) |
| Bundle inicial (First Load) | Bajo | **+37 KB** |
| Requests HTTP | 1 por imagen visible (lazy) | 0 (inline) |
| Re-renders al cambiar tema | No | Sí (algunos SVGs usan `currentColor`) |
| Tipado | `string` (URL) | `IconKey` (union literal) + Zod |

## ⚠️ Issues conocidas

### 1. **No hay lazy loading para los SVGs**

Los 19 SVGs están **inline en `Icons.tsx`** (37 KB). Si un usuario entra a `/home` y nunca ve "FigmaIcon", igual se descargó.

**Fix planeado** (no implementado):
- Opción A: **`React.lazy()` con un archivo por icono** (19 archivos).
- Opción B: **SVG sprite map** (un archivo `sprite.svg` con `<symbol>`s, usado con `<use href="/sprite.svg#react" />`).
- Opción C: **SVGO en build** para minificar los paths de los SVGs.

### 2. **`IconRender.tsx` con `as keyof`**

```ts
const InlineComponent = ICON_REGISTRY[name as keyof typeof ICON_REGISTRY];
```

El `as` es un **type assertion** que puede mentir en runtime. Si `name` no está en `ICON_REGISTRY`, retorna `undefined` y el componente renderiza `null`.

**Mejor**: validar con Zod antes:

```ts
const validation = IconNameSchema.safeParse(name);
if (!validation.success) return null;
const InlineComponent = ICON_REGISTRY[validation.data];
```

(El `IconNameSchema` ya existe, no se está usando en `IconRender`.)

### 3. **El `image_key` en la BD es string libre, no validado**

```ts
// metadata.service.ts
{ /* data.content es jsonb */ }
return ProjectsMetadataSchema.parse(data.content);
```

`ProjectsMetadataSchema` valida que `image_key: z.string()` pero no que la imagen **exista** en Supabase Storage. Si la BD dice `"foto-que-no-existe.png"`, la imagen rompe en runtime.

**Fix**: agregar un check en el orquestador o en el componente que use el `<Image>`.

## 🛠️ Cómo agregar un asset nuevo

### Agregar una imagen raster

1. Subir a Supabase Storage → bucket `project-images`.
2. Insertar/actualizar en la BD:
   - `translations` con `lang_code="es"` + FK a `content_blocks.key="section.hero"` + `content: { ... }` (que incluye `image_key` referenciando el archivo).
3. En el componente, `<Image src="/mi-foto.jpg" ... />`.
4. Listo. `supabaseImageLoader` redimensiona automáticamente.

### Agregar un ícono

1. Agregar el componente SVG en `src/services/assets/Icons.tsx`:
   ```ts
   export const MiIcono = (props: React.SVGProps<SVGSVGElement>) => (
     <svg {...props}>
       <title>MiIcono</title>
       <path d="..." fill="currentColor" />
     </svg>
   );
   ```

2. Registrar en `icon-registry.ts`:
   ```ts
   import { MiIcono } from "@/services/assets/Icons";
   export const ICON_REGISTRY = {
     // ...
     mi_icono: MiIcono,
   } as const satisfies Record<string, IconComponent>;
   ```

3. Usar en cualquier componente:
   ```tsx
   <IconRender name="mi_icono" className="..." />
   ```

4. (Opcional) Validar `icon_key` en la BD. La columna en `translations.content.tecnologies[].icon_key` debe matchear con la key del registry (Zod lo valida al parsear).

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** — `image_key` se referencia en metadata; el URL la construye el loader.
- **Theming v2** — SVGs usan `currentColor` (que toma el color del theme).
- **Modal** (NUEVO) — usa `<Button img>` que internamente usa el loader de Supabase.
- **TecnologiesCard / SkillsSection** — usan `<IconRender>` con `icon_key` validado por Zod.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (DB)
- [[learning/projects/portfolio-v2/orquestador-generaldata-service]] (orquestador)
- [[learning/projects/portfolio-v2/motion-integration-guide]] (motion)
- ADR-004: IconRegistry híbrido (inline + Storage)
- ADR-006: `[key]` vs `val in` en lookup del registry
- ADR-007: Supabase Storage con custom Next/Image loader
- ADR-017: Labels de proyectos en translations

## Próximo paso

Sigo con el **Sistema de UI base** (atoms + molecules: Button, LinkButton, Span, IconRender, TecnologiesCard). Decime cuando parar.
