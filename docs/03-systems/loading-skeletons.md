---
title: "Sistema de Loading / Skeletons"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [loading, skeletons, suspense, app-loading, route-loading, portfolio-v2, system, react]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto usa el sistema nativo de Next.js con `app/loading.tsx` (route-level) que muestra un `HomePageSkeleton` mientras Next.js hace Server-Side Rendering. El skeleton es una **réplica de la home** con la misma estructura (`<section>`, `<div>`, etc.) pero con `<SkeletonPulse />` (divs con `bg-muted animate-pulse`) en lugar de contenido real. No usa librerías externas (como `react-loading-skeleton` o `react-content-loader`); está hecho a mano en 6 archivos.

## 🎯 Filosofía

- **Replicar la estructura del home** (mismo orden de secciones, mismo layout).
- **Animación de pulse** (Tailwind `animate-pulse`) — no librerías custom.
- **Sin lógica de negocio** — solo es JSX estático con divs animados.
- **Reutilizable** — `<SkeletonPulse />` es la unidad básica, se compone en cards más grandes.

> **Por qué no `react-loading-skeleton` o similar**: el proyecto no usa librerías externas para esto. Es un **micro-ecosistema** hecho a mano (6 archivos, ~200 líneas total).

## 📁 Archivos (6)

| Archivo | Líneas | Rol |
|---|---|---|
| `src/app/loading.tsx` | 100+ | **El route loader** — se renderiza mientras `app/page.tsx` está cargando |
| `src/components/skeletons/skeletonindex.tsx` | 8 | Barrel: re-exporta los 6 skeletons |
| `src/components/skeletons/SkeletonPulse.tsx` | 5 | **El átomo base** (`<div className="bg-muted animate-pulse">`) |
| `src/components/skeletons/NavBarSkeleton.tsx` | 20 | Skeleton del NavBar |
| `src/components/skeletons/FormularySkeleton.tsx` | 30 | Skeleton del Formulary (en el form) |
| `src/components/skeletons/ProjectsCardSkeleton.tsx` | 25 | Skeleton de un ProjectCard |
| `src/components/skeletons/TecnologiesCardSkeleton.tsx` | 10 | Skeleton de un TecnologiesCard |
| `src/components/skeletons/HomePageSkeleton.tsx` | 100+ | **La composición completa** (replica de la home) |

## 🧱 El átomo: `SkeletonPulse` (5 líneas)

```tsx
export const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded-md ${className}`} />
);
```

**3 props**:
- `bg-muted`: el color (viene del theme v2 — es un gris sutil).
- `animate-pulse`: la animación (Tailwind utility nativa, fade in/out).
- `rounded-md`: bordes redondeados.

> **No hay variants de tamaño, color, forma**: el consumidor pasa `className` para customizar. Es atómico.

## 🏗️ El barrel: `skeletonindex.tsx`

```ts
export { FormularySkeleton } from "./FormularySkeleton";
export { NavBarSkeleton } from "./NavBarSkeleton";
export { ProjectCardSkeleton } from "./ProjectsCardSkeleton";
export { TecnologiesCardSkeleton } from "./TecnologiesCardSkeleton";
export { HomePageSkeleton } from "./HomePageSkeleton";
```

**Por qué existe**: permite que `app/loading.tsx` importe de un solo lugar: `from "../components/skeletons/skeletonindex"`.

## 🔄 Cómo funciona el route loading

```
Browser: GET /
  ↓
Next.js detecta que app/page.tsx es async (Server Component)
  ↓ Next.js renderiza app/loading.tsx EN PARALELO mientras page.tsx está cargando
  ↓
Browser recibe HTML inicial con el skeleton (puede verse en < 100ms)
  ↓
app/page.tsx termina de fetchear data de Supabase (~250-400ms)
  ↓
Next.js hace streaming swap: skeleton → contenido real
```

> **Si el componente no es async**, el skeleton se ve apenas un frame (casi imperceptible). Como `page.tsx` es async (`await getGeneralData()`), el skeleton se ve ~250-400ms.

## 🏠 El HomePageSkeleton: réplica de la home

```tsx
// src/components/skeletons/HomePageSkeleton.tsx
const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded-xl ${className}`} />
);  // ← REDEFINIDO localmente (mismo que SkeletonPulse.tsx)

export function HomePageSkeleton() {
  return (
    <div className="text-foreground min-h-screen font-display bg-background">
      <NavBarSkeleton />
      
      <section className="py-50 max-w-241.5 mx-auto px-5">
        <div className="gap-4 flex flex-col justify-start items-start h-full">
          <div className="flex items-center gap-3">
            <SkeletonPulse className="rounded-full size-20 border border-border border border-border" />
            <SkeletonPulse className="w-48 h-8 rounded-full" />
          </div>
          <SkeletonPulse className="w-full max-w-2xl h-16 mb-5" />
          <div className="space-y-3 w-full max-w-2xl">
            <SkeletonPulse className="w-full h-4" />
            <SkeletonPulse className="w-11/12 h-4" />
            <SkeletonPulse className="w-full h-4 mt-4" />
            <SkeletonPulse className="w-9/12 h-4" />
          </div>
          <nav className="flex gap-4 mt-8">
            <SkeletonPulse className="w-36 h-11 rounded-xl" />
            <SkeletonPulse className="w-36 h-11 rounded-xl" />
          </nav>
        </div>
      </section>
      
      <section className="flex flex-col gap-8 max-w-241.5 mx-auto py-20 px-5">
        {/* Tecnologies skeleton (Frontend, Backend, DevOps) */}
        {["Frontend", "Backend", "DevOps"].map((cat) => (
          <div key={cat} className="flex flex-col items-start gap-6 w-full">
            <SkeletonPulse className="w-24 h-6 ml-4" />
            <div className="flex flex-row flex-wrap justify-center gap-4 w-full">
              {[1, 2, 3, 4].map((i) => (
                <TecnologiesCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ))}
      </section>
      
      {/* ... Projects skeleton (2 cards), AboutMe skeleton, Contact skeleton con FormularySkeleton, Footer */}
    </div>
  );
}
```

**6 secciones en el skeleton** (mismo orden que la home real):

1. **NavBar** (`<NavBarSkeleton />`)
2. **Hero** (avatar + título + párrafos + 2 botones)
3. **Tecnologies** (3 categorías × 4 cards)
4. **Projects** (2 project cards)
5. **AboutMe** (texto + imagen)
6. **Contact** (texto + `<FormularySkeleton />`)
7. **Footer** (links + texto)

> **Issue conocido**: el `HomePageSkeleton` **redefine `SkeletonPulse` localmente** en lugar de importar el de `SkeletonPulse.tsx`. Esto es DRY violation.

## 📦 Los skeletons específicos

### `NavBarSkeleton` (20 líneas)

```tsx
export function NavBarSkeleton() {
  return (
    <nav className="z-20 qw:left-5 qw:right-5 left-2 right-2 max-w-241.5 h-18.5 p-5 mt-1 rounded-2xl fixed mx-auto flex items-center justify-between bg-background/80 backdrop-blur-xl border border-border shadow-2xl hidden ew:flex">
      <SkeletonPulse className="w-32 h-6" />
      <div className="flex gap-4 items-center">
        <SkeletonPulse className="w-14 h-4 hidden qw:block" />
        <SkeletonPulse className="w-14 h-4 hidden qw:block" />
        <SkeletonPulse className="w-14 h-4 hidden qw:block" />
        <SkeletonPulse className="size-7 rounded-full" />
        <SkeletonPulse className="size-7 rounded-full" />
      </div>
    </nav>
  );
}
```

> El NavBar real se renderiza solo en `qw:` (921px+). Por eso el skeleton también tiene `hidden ew:flex` para ocultarse en mobile (consistente con el comportamiento real).

### `FormularySkeleton` (30 líneas)

```tsx
export function FormularySkeleton() {
  return (
    <div className="rounded-3xl size-full flex flex-col p-[5%] bg-card border border-border shadow-2xl space-y-6">
      <SkeletonPulse className="w-1/2 h-8 mb-2" />
      <div className="w-full space-y-4">
        <div className="space-y-2">
          <SkeletonPulse className="w-24 h-4" />
          <SkeletonPulse className="w-full h-11 rounded-md" />
        </div>
        <div className="space-y-2">
          <SkeletonPulse className="w-24 h-4" />
          <SkeletonPulse className="w-full h-11 rounded-md" />
        </div>
        <div className="space-y-2">
          <SkeletonPulse className="w-24 h-4" />
          <SkeletonPulse className="w-full h-11 rounded-md" />
        </div>
        <div className="space-y-2">
          <SkeletonPulse className="w-24 h-4" />
          <SkeletonPulse className="w-full h-40 rounded-xl" />
        </div>
        <SkeletonPulse className="w-7/12 h-12 rounded-md" />
      </div>
    </div>
  );
}
```

**4 inputs + 1 textarea + 1 submit button** = replica exacta del form real (mismas clases, mismo orden).

### `ProjectsCardSkeleton` (25 líneas)

```tsx
export function ProjectCardSkeleton() {
  return (
    <article className="qw:h-100 w-full min-h-100 rounded-xl flex qw:flex-row flex-col-reverse justify-between p-5 bg-card border border-border shadow-lg">
      <div className="qw:w-[50%] h-full w-full flex flex-col mt-3 qw:mt-0 items-start gap-3">
        <SkeletonPulse className="w-40 h-10 rounded-xl" />
        <SkeletonPulse className="w-3/4 h-8 mt-1" />
        <div className="w-full flex-1 space-y-2">
          <SkeletonPulse className="w-full h-4" />
          <SkeletonPulse className="w-full h-4" />
          <SkeletonPulse className="w-2/3 h-4" />
        </div>
        <div className="flex flex-col gap-4 w-full">
          <div className="flex gap-2">
            <SkeletonPulse className="w-20 h-8" />
            <SkeletonPulse className="w-20 h-8" />
          </div>
          <div className="flex justify-between items-center w-full">
            <div className="flex gap-2">
              <SkeletonPulse className="size-6" />
              <SkeletonPulse className="size-6" />
              <SkeletonPulse className="size-6" />
            </div>
            <SkeletonPulse className="h-8 w-20 rounded-full" />
          </div>
        </div>
      </div>
      <SkeletonPulse className="qw:w-[47.9%] qw:h-full h-48 rounded-xl" />
    </article>
  );
}
```

**Replicación exacta del `ProjectCard.tsx`** (mismas clases, mismo layout, solo cambia el contenido del `SkeletonPulse` por la imagen real).

### `TecnologiesCardSkeleton` (10 líneas)

```tsx
export function TecnologiesCardSkeleton() {
  return (
    <div className="w-32 h-32 flex flex-col items-center justify-center p-4 bg-popover backdrop-blur-sm border border-border rounded-3xl">
      <SkeletonPulse className="size-12 rounded-2xl mb-3" />
      <SkeletonPulse className="w-16 h-3" />
    </div>
  );
}
```

**Versión más pequeña** porque la card de skills es más simple.

## 🛠️ Cómo agregar un nuevo skeleton

1. **Si agregás una sección nueva a la home**:
   - Crear `MiSeccionSkeleton.tsx` en `src/components/skeletons/`.
   - Exportar en `skeletonindex.tsx`.
   - Agregar al `HomePageSkeleton` en la posición correcta.

2. **Si agregás un campo a un form/card**:
   - Editar el skeleton existente (ej. `FormularySkeleton`).
   - Mantener la **misma estructura de clases** que el componente real (mismas alturas, mismos `w-*`).

> **Regla de oro**: el skeleton debe verse **casi igual** al componente real pero sin contenido. El usuario no debería notar la diferencia de layout entre el skeleton y el componente cargado.

## ⚠️ Issues conocidas

### 1. **`HomePageSkeleton` redefine `SkeletonPulse` localmente**

```tsx
// HomePageSkeleton.tsx línea 5-7
const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded-xl ${className}`} />
);
```

> **Issue**: DRY violation. La misma función está en `SkeletonPulse.tsx`.

**Fix**: importar de `SkeletonPulse`:
```tsx
import { SkeletonPulse } from "./SkeletonPulse";
```

### 2. **No hay skeleton para `/error` o `not-found`**

Si la página rompe (`error.tsx`), el usuario ve un error real. No hay un `error.tsx` skeleton. **No es estrictamente necesario** porque la pantalla de error es un caso raro.

### 3. **Los skeletons no se animan diferente según el viewport**

En mobile (sin `qw:`) el NavBar se oculta (`hidden ew:flex`). En el skeleton, los `SkeletonPulse` de los links del navbar también se ocultan (`hidden qw:block`). **Issue menor**: el skeleton es fiel al componente real, pero no hay un fallback "mobile-friendly" para el NavBar.

### 4. **El `<SkeletonPulse>` no acepta `style` prop**

```tsx
export const SkeletonPulse = ({ className }: { className?: string }) => (
  <div className={`bg-muted animate-pulse rounded-md ${className}`} />
);
```

> **Issue**: si necesitas `width` o `height` con `style={{}}` (ej. para `width: 50%`), no podés. Todo tiene que ir por `className`.

**Fix**: agregar `style?: CSSProperties` prop.

## 🔗 Conexiones con otros sistemas

- **app/page.tsx** — el `HomePageSkeleton` se renderiza mientras `page.tsx` hace el `await getGeneralData()`.
- **Theming v2** — usa `bg-muted`, `bg-card`, `border-border` (los skeletons respetan el theme).
- **Motion** — no usan motion (son divs puros, no client components).

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (DB — el await que activa el skeleton)
- [[learning/projects/portfolio-v2/orquestador-generaldata-service]] (orquestador)
- ADR-014: Animaciones con CSS puro (no useInView)

## Próximo paso

Sigo con **Header / Navegación** (Header component + NavBar integrado) o lo que decidas. Decime cuando parar.
