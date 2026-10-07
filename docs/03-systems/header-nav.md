---
title: "Sistema de Header / Navegación"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [header, navbar, navigation, mobile, responsive, theming, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El Header del portfolio es un wrapper de `NavBar` que adapta el comportamiento desktop vs mobile. Desktop: una sola barra con logo + links + iconos de tema/idioma. Mobile: hamburger button (oculto en desktop) que abre un dropdown con los links. La data (`nav_data`) viene del orquestador (tabla `translations` con `lang_code` actual). El componente es "use client" porque tiene estado (`isOpen` para el menu mobile) y el `NavBar` también lo es porque tiene interactividad (ThemeSwitcher, LanguageToggle).

## 🎯 Filosofía

- **Un solo componente Header que detecta mobile/desktop** via `qw:` y `ew:` breakpoints.
- **Reutiliza NavBar** (desktop) y NavBar (mobile) con props diferentes (`GeneralOrganization` cambia).
- **Sin lógica de scroll** (no se esconde al scrollear, no se pega al top en mobile).
- **Sin sticky behavior** — el NavBar es `fixed` pero no cambia al scrollear.

## 📁 Archivos (comunidades 0 y 9 del grafo)

| Archivo | Líneas | Rol |
|---|---|---|
| `src/components/organims/Header.tsx` | 53 | Wrapper con estado + responsive (desktop/mobile) |
| `src/components/molecules/NavBar.tsx` | ~100 | El nav bar real (links + logo + theme + lang) |
| `src/components/atoms/ThemeSwitcher.tsx` | ~40 | UI para elegir tema (4 paletas) |
| `src/components/atoms/LanguageToggle.tsx` | ~30 | UI para elegir idioma |
| `src/components/atoms/BackgroundFX.tsx` | 14 | Los efectos de fondo (no parte del Header pero relacionado) |

> **3 organismos/componentes** que importan el `NavBar` con diferentes props: `Header`, `Footer` y el `NavBar` standalone. Es el "componente más reutilizado" del sistema.

## 🧬 Anatomía del Header (53 líneas)

```tsx
"use client";
import { useState } from "react";
import { Button, NavBar } from "../components";
import type { NavBarProps } from "../types";

type HeaderProps = {
  nav_data: NavBarProps["nav_data"];
};

export function Header({ nav_data }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <header>
      {/* 1) NavBar desktop (qw:921px+) */}
      <NavBar
        nav_data={nav_data}
        name={true}
        GeneralOrganization="hidden ew:flex"
      />

      {/* 2) Hamburger button mobile (oculto en desktop) */}
      <nav aria-label="Navegación móvil"
           className="z-1 qw:left-5 qw:right-5 left-2 right-2 max-w-241.5 p-5 mt-5 rounded-2xl mx-auto flex gap-6 items-center justify-between ew:hidden">
        <div className="flex fixed w-full justify-end mx-auto pr-10 z-1">
          <Button svg={"hamburnav"} buttonBody="size-7"
                  svgStyle="text-foreground"
                  onClick={() => setIsOpen(!isOpen)}
                  aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
                  aria-expanded={isOpen} />
        </div>
      </nav>

      {/* 3) Dropdown menu mobile (cuando isOpen=true) */}
      {isOpen && (
        <div className="fixed top-20 right-4 z-50 ew:hidden">
          <NavBar
            nav_data={nav_data}
            GeneralOrganization="flex-col! items-end! bg-background/95! backdrop-blur-xl! rounded-2xl! shadow-2xl! gap-2! p-3! static! max-w-48!"
            LinksOrganization="flex! flex-col! items-end! gap-2!"
            ThemeMenuOrganization="right-0! top-0! relative! ml-0! mt-2! w-full! z-1"
          />
        </div>
      )}
    </header>
  );
}
```

### 3 partes

1. **NavBar desktop** (`qw:921px+`, `hidden ew:flex`): el nav bar normal con logo + links + iconos.
2. **Hamburger button mobile** (`ew:hidden` = hidden en `ew:700px+`): visible solo en mobile.
3. **Dropdown mobile** (`isOpen && ew:hidden`): aparece al click en el hamburger, usa el **mismo `<NavBar>`** con clases diferentes (columna en lugar de fila).

## 📊 Data flow

```
Orquestador (generaldata.service.ts)
  ↓ retorna: { navbar_section: { data: NavbarItem[] } }
  ↓
app/page.tsx
  ↓ <Header nav_data={general_data.navbar_section} />
  ↓
Header.tsx
  ↓ <NavBar nav_data={nav_data} ... />
  ↓
NavBar.tsx
  ↓ renderiza links: nav_data.data.map(item => <LinkButton link={item.link} txt={item.name} />)
```

**Tipado end-to-end**: `NavbarItem` viene de `schemas.ts` (validado por `NavbarContentSchema`).

## 🎨 Mobile vs Desktop: las 3 props diferentes

| Prop | Desktop | Mobile (dropdown) |
|---|---|---|
| `GeneralOrganization` | `"hidden ew:flex"` (oculto en mobile) | `"flex-col! items-end! bg-background/95! backdrop-blur-xl! rounded-2xl! shadow-2xl! gap-2! p-3! static! max-w-48!"` |
| `LinksOrganization` | (default) | `"flex! flex-col! items-end! gap-2!"` |
| `ThemeMenuOrganization` | (default) | `"right-0! top-0! relative! ml-0! mt-2! w-full! z-1"` |

> **`!` (Tailwind v4 important modifier)** se usa mucho en mobile porque el `NavBar` tiene `flex-row` por default (desktop), y mobile necesita sobreescribirlo.

## 🔄 El NavBar reutilizable

El `NavBar` recibe 4 props de layout:

```ts
export interface NavBarProps {
  nav_data: NavbarSection;
  name?: boolean;
  GeneralOrganization?: string;
  LinksOrganization?: string;
  ThemeMenuOrganization?: string;
}
```

`name` = mostrar el logo (en desktop sí, en mobile no).
Los otros 3 son **organizadores** que permiten reusar el NavBar en distintos contextos (Header desktop, Header mobile, Footer).

## 🛠️ Cómo agregar una nueva sección al NavBar

1. Editar `NavBar.tsx` para agregar un nuevo `<LinkButton>` o `<ThemeSwitcher>`.
2. Si el link viene de la BD, agregarlo a `translations.content_blocks` con `key="section.navbar"` + un nuevo item en el array.
3. Si es un link estático (no traducible), agregarlo directamente en el componente.

> **Regla**: si el link cambia por idioma, va a la BD. Si es estático (ej. "GitHub profile"), va en el código.

## ⚠️ Issues conocidas

### 1. **El menú mobile no cierra al click en un link**

Cuando hacés click en un link del dropdown mobile, **navega a la sección** (`href="#Home"`) pero **no cierra el menú**. El usuario queda con el menú abierto y tiene que cerrarlo manualmente con la X.

**Fix**: agregar `onClick={() => setIsOpen(false)}` en cada link del NavBar cuando se está renderizando en mobile.

### 2. **El `BackgroundFX` se renderiza en TODAS las páginas**

```tsx
// app/layout.tsx
<ThemeProvider ...>
  <LazyMotion features={domAnimation} strict>
    <BackgroundFX />
    {children}
  </LazyMotion>
</ThemeProvider>
```

> El `BackgroundFX` se monta una vez en el root layout. Se pinta detrás de **todo** el sitio. **Issue menor**: el SVG con `feTurbulence` (filtro de ruido) consume CPU. Si el navegador es mobile débil, puede haber jank al scrollear.

**Fix**: usar un solo `BackgroundFX` ya está optimizado (el noise usa CSS `mix-blend-mode: soft-light`).

### 3. **El dropdown mobile no tiene animación de entrada/salida**

```tsx
{isOpen && (
  <div className="fixed top-20 right-4 z-50 ew:hidden">
    <NavBar ... />
  </div>
)}
```

> Aparece/desaparece de golpe (sin `<AnimatePresence>` o `<m.div>`). **Issue UX**: el usuario no tiene feedback visual del cambio.

**Fix**: usar motion:

```tsx
<AnimatePresence>
  {isOpen && (
    <m.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      ...
    >
      <NavBar ... />
    </m.div>
  )}
</AnimatePresence>
```

### 4. **El NavBar fixed y el contenido de la página no tienen spacer**

El NavBar es `fixed top-0`, pero el contenido de la página **no tiene padding-top** para evitar que el NavBar tape el contenido. **Issue visual**: el Hero empieza debajo del NavBar (visible si scrolleas).

**Fix**: agregar `pt-X` al primer `<section>` de la página (donde X = la altura del NavBar, ~`pt-18.5`).

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** — `nav_data` viene del orquestador.
- **Theming v2** — el `ThemeSwitcher` consume el sistema de temas.
- **i18n** — el `LanguageToggle` cambia el `lang_code` que se pasa al orquestador.
- **Motion** — el `BackgroundFX` está dentro del `LazyMotion` (aunque no usa motion directamente).

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (origen de nav_data)
- [[learning/projects/portfolio-v2/orquestador-generaldata-service]] (cómo llega nav_data al Header)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (sistema de temas)
- [[learning/projects/portfolio-v2/motion-integration-guide]] (motion)

## Próximo paso

Sigo con los sistemas restantes que detecté en el audit:

- **EmailJS en profundidad** (template setup, env vars, debug)
- **next-themes + attribute="class"** (ya documentado parcialmente)
- **next/font (Geist)** 
- **`<AnimatePresence>` y exit animations**
- **i18n (multi-idioma)**
- **SEO / metadata / favicon**
- **ErrorBoundary (`app/error.tsx`)**
- **Testing / CI / Deploy** (no existe en el proyecto)

Decime qué sistema priorizar o si querés un overview final en vez de entrar en otro específico.
