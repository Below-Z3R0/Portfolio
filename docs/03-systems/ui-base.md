---
title: "Sistema de UI base — atoms + molecules"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [ui, atoms, molecules, components, props-tipadas, typescript, portfolio-v2, system, react]
verified_with: minimax-m3
---

> **TL;DR:** El sistema de UI base del portfolio sigue **Atomic Design**: atoms (Button, LinkButton, Span, Title1-4, IconRender) + molecules (NavBar, Formulary, ProjectCard, Modal, ErrorMessage, SuccessMessage, TecnologiesCard). **Todos los contracts están en `types.ts`** (tipados, sin `any`), heredan de `ButtonHTMLAttributes<HTMLButtonElement>` para Button, y los molecules **reciben data del orquestador** como props tipadas (no hacen fetch directo). El `barrel components.ts` re-exporta todo para que los componentes solo importen de un lugar.

## 🎯 Filosofía de la UI base

3 principios:

1. **Atoms = puros visuales** (no fetchean, no tienen estado de negocio). Reciben `className` o `buttonBody` para personalizar.
2. **Molecules = UI con data** (reciben data del orquestador via props tipadas, no hacen fetch).
3. **Organisms = secciones completas** (reciben la sección entera del orquestador, la renderizan con la UI base).

> **No hay lógica de negocio en los atoms**. Si un atom necesita hacer un fetch, eso es una **señal de que debería ser molecule**.

## 📁 Archivos del sistema (comunidades 0 y 1 del grafo)

| Comunidad | Archivo | Rol |
|---|---|---|
| 1 (atoms base) | `src/components/atoms/Button.tsx` | `<button>` polimórfico (txt/svg/img/children) |
| 1 | `src/components/atoms/LinkButton.tsx` | `<a target="_blank">` con misma API que Button |
| 1 | `src/components/atoms/Span.tsx` | `<span>` con `role` (para `alert`) e `id` (aria) |
| 1 | `src/components/atoms/Title1-4.tsx` | Headings semánticos (h1, h2, h3, h4) |
| 1 | `src/components/atoms/IconRender.tsx` | Resuelve `name` → `ICON_REGISTRY[name]` |
| 0 (molecules) | `src/components/molecules/NavBar.tsx` | Barra de navegación |
| 0 | `src/components/molecules/ProjectCard.tsx` | Card de proyecto (con modal) |
| 0 | `src/components/molecules/Modal.tsx` | **NUEVO** — modal fullscreen con info del proyecto |
| 0 | `src/components/molecules/Formulary.tsx` | Form con RHF + Zod + EmailJS |
| 0 | `src/components/molecules/TecnologiesCard.tsx` | Card de skill (tecnología) |
| 0 | `src/components/molecules/ErrorMessage.tsx` | Modal de error (con `<m.path>` anim) |
| 0 | `src/components/molecules/SuccessMessage.tsx` | Modal de éxito (con checkmark anim) |

## 🧩 El corazón: `types.ts`

Todos los contracts viven en `types.ts`. Es **el archivo más importante del sistema de UI** porque define qué props acepta cada componente y de dónde viene cada tipo.

### 3 grupos de tipos

```ts
// 1. Tipos inferidos de schemas.ts (data de BD)
import type { HeroSection, ProjectItem, ModalContent, ... } from "./schemas";
import type { IconKey } from "@/services/assets/icon-registry";

// 2. Globales
export type Theme = "dark" | "light" | "system";
export type Language = "en" | "es";

// 3. Contratos UI (atoms + molecules + organisms)
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  onClick?: MouseEventHandler<HTMLButtonElement>;
  children?: ReactNode;
  alt?: string;
  img?: string | null;
  /** Key del ICON_REGISTRY o path .svg */
  svg?: IconKey | string;
  svgStyle?: string;
  txt?: string | null;
  buttonBody?: string;
  txtStyle?: string;
  imgStyle?: string;
}
```

> **3 reglas de `types.ts`**:
> 1. **No `any`** (nunca).
> 2. **Hereda de tipos nativos** cuando es posible (`ButtonHTMLAttributes<HTMLButtonElement>`).
> 3. **Re-exporta tipos de schemas** (no los duplica).

## 🧱 Atoms — la base polimórfica

### `Button.tsx` (25 líneas)

```tsx
import Image from "next/image";
import { Span } from "../components";
import type { ButtonProps } from "../types";
import { IconRender } from "./IconRender";

export function Button({ txt, img, children, svg, alt, svgStyle, buttonBody, txtStyle, imgStyle, type = "button", onClick }: ButtonProps) {
  return (
    <button className={`flex justify-center items-center ${buttonBody}`} type={type} onClick={onClick}>
      {txt && <Span txt={txt} className={txtStyle} />}
      {svg && <IconRender name={svg} className={`size-full ${svgStyle}`} />}
      {img && (
        <Image src={`/${img}`} alt={alt || "icon"} className={`size-full ${imgStyle}`} width={80} height={80} />
      )}
      {children}
    </button>
  );
}
```

**Patrón polimórfico**: el Button puede renderizar **4 tipos de contenido** (txt, svg, img, children) según qué prop le pasás. El `className` viene 100% del consumidor (`buttonBody`).

**Regla**: nunca hardcodear estilos en atoms. La composición vive en molecules/organisms.

### `LinkButton.tsx` (30 líneas)

Mismo patrón, pero usa `<a target="_blank">` para links externos. **Diferencia clave**: el `link` se renderiza como `href` con `rel="noopener noreferrer"` si es externo (no empieza con `#`).

```tsx
<a
  href={link ?? "https://github.com/Below-Z3R0"}
  className={`flex justify-center items-center ${buttonBody}`}
  target={link?.startsWith("#") ? undefined : "_blank"}
  rel={link?.startsWith("#") ? undefined : "noopener noreferrer"}
>
```

**Fallback seguro**: si `link` es `null`, usa GitHub del usuario.

### `Span.tsx` (14 líneas)

```tsx
export function Span({ txt, className, children, role, id }: SpanProps) {
  return (
    <span id={id} role={role}
          className={`text-foreground font-sans text-lg text-balance leading-relaxed font-medium ${className ?? ""}`}>
      {children}
      {txt}
    </span>
  );
}
```

**Uso**: texto inline con `id` y `role="alert"` para accesibilidad (errores de form). El `className` es opcional.

### `Title1-4.tsx` (4 archivos, ~12 líneas cada uno)

```tsx
// Title2.tsx (ejemplo)
export function Title2({ txt, className }: TitleProps) {
  return <h2 className={`text-4xl text-wrap-balance tracking-tight text-left text-foreground ${className ?? ""}`}>{txt}</h2>;
}
```

**Patrón**: cada Title es un wrapper de `<h1>/<h2>/<h3>/<h4>` con estilos por defecto. El consumidor solo pasa `txt` y opcionalmente `className` para override.

**Decisión clave**: `text-wrap-balance` (Tailwind v4) para balance de texto automático (evita líneas de 1 sola palabra).

### `IconRender.tsx` (14 líneas)

```tsx
export function IconRender({ name, className }: IconRendererProps) {
  const InlineComponent = ICON_REGISTRY[name as keyof typeof ICON_REGISTRY];
  if (InlineComponent) {
    return <InlineComponent className={className} />;
  }
  return null;
}
```

**Issue conocido**: usa `as keyof` que es un type assertion. Si `name` no está en `ICON_REGISTRY`, retorna `null`. **Mejor**: validar con Zod antes (`IconNameSchema.safeParse`).

## 🧪 Molecules — la lógica UI

### `NavBar.tsx` — barra de navegación

Recibe `nav_data: NavbarSection` (del orquestador) y props de layout:

```tsx
export interface NavBarProps {
  nav_data: NavbarSection;
  name?: boolean;
  GeneralOrganization?: string;
  LinksOrganization?: string;
  ThemeMenuOrganization?: string;
}
```

**Datos del orquestador**: `nav_data.data` = `NavbarItem[]` (links de navegación con `{ id, link, name }`).

### `Formulary.tsx` — formulario de contacto (159 líneas)

El molecule más complejo. Usa:
- `react-hook-form` para state del form
- `zodResolver(SendEmailSchema)` para validación
- `emailjs.send()` para enviar el email
- `AnimatePresence` para mostrar `SuccessMessage` o `ErrorMessage`

```tsx
const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SendEmail>({
  resolver: zodResolver(SendEmailSchema),
  mode: "onChange",
  defaultValues: { name: "", user_email: "", title: "", message: "" }
});
```

**4 estados posibles** (`FormStatus`):
- `idle` (form en blanco)
- `loading` (isSubmitting, muestra `<LoadingDots>`)
- `success` (email enviado, muestra `<SuccessMessage>`)
- `error` (falla, muestra `<ErrorMessage>` con el mensaje)

### `ProjectCard.tsx` — card de proyecto

Recibe `project_data: { meta, data: ProjectItem }` y `labels_data`:

```tsx
export interface ProjectCardProps {
  project_data: { meta: ProjectsMetadata; data: ProjectItem };
  labels_data: { featured: string; in_construction: string };
  category: string | undefined;
}
```

**Tiene estado local** (`useState` para `activeTxt` que cambia al hacer click en una tecnología).

### `Modal.tsx` — modal fullscreen (NUEVO, recién agregado)

Recibe `img`, `data` (con `category` y `title`), `activeTxt` y `setActivetxt`:

```tsx
export interface ModalProps {
  img: string | undefined;
  in_construction: string;
  data: { category: string | undefined; title: string };
  activeTxt: string;
  setActivetxt: (txt: string) => void;
  open: boolean;
  onClose: () => void;
}
```

**Patrón**: backdrop con `<m.div>` (motion) + contenido que click sobre backdrop hace `onClose`. Usa `Button img` que internamente usa el loader de Supabase.

### `TecnologiesCard.tsx` — card de skill (10 cards renderizados en /)

Recibe `TecnologiesConfig`:

```tsx
export interface TecnologiesConfig {
  svg: IconKey | string;
  color?: string;
  name?: string;
  bar?: boolean;
  cardStyle?: string;
  iconStyle?: string;
  description?: string;
}
```

**Performance**: optimizado en sesión 2026-10-05 (sin `backdrop-blur-xs`, sin `transition-all`, `group-hover:blur-2xl` solo en hover).

### `ErrorMessage.tsx` + `SuccessMessage.tsx` — modales de feedback

```tsx
export type FormStatus = "idle" | "loading" | "success" | "error";

export interface SuccessMessageProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoCloseMs?: number;  // ← existe en el type pero no se usa
}
```

**Patrón**: ambos usan `<AnimatePresence>` para exit animations (cuando se cierra el modal, el SVG se anima fuera).

## 🎯 El barrel: `components.ts`

```ts
// src/components/components.ts
export * from "./atoms/Button";
export * from "./atoms/IconRender";
export * from "./atoms/LinkButton";
// ...
export * from "./schemas";
export * from "./types";
```

**Por qué existe**:
- Los componentes importan de un solo lugar (`from "../components"`).
- Re-exporta también `schemas` y `types` (single import point).
- Permite tree-shaking: solo lo importado se incluye en el bundle.

> **Issue conocido**: barrel re-exports **rompen el RSC boundary** en algunos casos. Por eso `Modal` y `ErrorMessage` (que son client components) **importan directamente** del path (`from "../molecules/Modal"`), no del barrel.

## ⚠️ Issues conocidas

### 1. **El `as keyof` en `IconRender`**

```ts
const InlineComponent = ICON_REGISTRY[name as keyof typeof ICON_REGISTRY];
if (InlineComponent) { return <InlineComponent ... />; }
return null;  // ← fallback silencioso
```

**Issue**: si `name` es inválido, renderiza `null` sin warning. Mejor:

```ts
const validation = IconNameSchema.safeParse(name);
if (!validation.success) return null;
const InlineComponent = ICON_REGISTRY[validation.data];
```

### 2. **El `autoCloseMs?: number` no se usa**

Definido en `SuccessMessageProps` pero no implementado. **Issue**: el modal solo se cierra con click (manual). No hay auto-close.

**Fix planeado**: usar `useEffect` con `setTimeout` cuando `show=true` y `autoCloseMs > 0`.

### 3. **El `<Image>` con `width={80} height={80}` está hardcoded**

```tsx
<Image src={`/${img}`} alt={alt || "icon"} width={80} height={80} className="..."} />
```

**Issue**: el `80×80` es para íconos. Si pasás un `image_key` que es una foto, el tamaño se ve mal. Mejor: el consumidor pasa `width`/`height` como props, o detectar si es `ICON_REGISTRY` vs Storage.

### 4. **El barrel re-exporta `schemas` y `types`**

Re-exporta desde `components.ts` por conveniencia, pero **puede generar ciclos de imports** si los schemas importan componentes (que no pasa acá, pero es un riesgo).

## 🛠️ Cómo agregar un nuevo component

### Atom (sin lógica)

1. Crear `src/components/atoms/MiAtomo.tsx`.
2. Definir `MiAtomoProps` en `types.ts`.
3. Agregar `export * from "./atoms/MiAtomo";` en `components.ts`.
4. Documentar arriba del component con JSDoc (sigue el patrón de `Button`).

### Molecule (con lógica)

1. Crear `src/components/molecules/MiMolecula.tsx`.
2. Definir `MiMoleculaProps` en `types.ts` (acepta data del orquestador o props locales).
3. Si hace fetch, importá los services (`getData`, etc.).
4. Si tiene estado local, usar `useState` (no `useReducer` salvo necesidad real).
5. Agregar a `components.ts`.
6. **No** poner `useEffect` para "initializar" data — eso es trabajo del padre (Server Component).

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** — los molecules reciben data del orquestador.
- **Icon registry** — `IconRender` consume `ICON_REGISTRY` + `IconNameSchema`.
- **Imágenes** — Button/LinkButton/Modal usan `<Image>` con el custom loader de Supabase.
- **Theming v2** — `className` con utilities como `bg-card`, `text-foreground`, etc.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (DB)
- [[learning/projects/portfolio-v2/orquestador-generaldata-service]] (cómo llegan los datos a los molecules)
- [[learning/projects/portfolio-v2/sistema-imagenes-svg-image]] (sistema de assets)
- [[learning/projects/portfolio-v2/motion-integration-guide]] (animaciones)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (theming)
- ADR-018: Arquitectura de tipado en 3 capas
- ADR-020: Imports directos en lugar de barrel
- ADR-022: Props semánticas en Button/LinkButton

## Próximo paso

Sigo con el **Modal** (recién agregado) + **Formulario + EmailJS**. Decime cuando parar o seguir.
