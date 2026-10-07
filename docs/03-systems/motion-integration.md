---
title: "Motion + LazyMotion en portfolio-v2 — guía de integración"
type: integration-guide
project: portfolio-v2
scope: project
status: active
created: 2026-09-28
updated: 2026-09-28
tags: [motion, framer-motion, lazy-motion, animation, portfolio-v2, theming, react, nextjs, integration, level-based]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto usa `motion/react` (no `framer-motion`) a través de un patrón **level-based reveal**: 7 wrappers semánticos (`SectionReveal`, `TextReveal`, `SlideReveal`, `StaggerGroup`, `StaggerItem`, `EyebrowReveal`, `PopReveal`) + 2 utilities (`LoadingDots`, `ExpandLine`, `scrollToSection`) definidos en `src/components/animations/Animations.tsx`. Los wrappers se montan una vez al `<LazyMotion features={domAnimation} strict>` en `app/layout.tsx`, lo que reduce el bundle ~70% vs la alternativa `motion`. Cada sección consume wrappers específicos según su rol semántico (`HeroSection` = `PopReveal`+`StaggerGroup`, `AboutMeSection` = `SlideReveal`, `SkillsSection` = `StaggerGroup`+`EyebrowReveal`, etc.). **Esta es la guía de integración**, no la guía de Motion en sí — para fundamentos teóricos ver los wikilinks al final.

## 🎯 Filosofía del patrón

En lugar de animar **elementos sueltos** desde cada componente con `motion.div`, el proyecto centraliza animaciones en un set de **wrappers semánticos** que se reutilizan en todas las secciones. Cada wrapper tiene un rol claro:

| Wrapper | Rol | Trigger |
|---|---|---|
| `SectionReveal` | contenedor entero de sección | `whileInView` con `once: true` |
| `TextReveal` | texto secundario (párrafos, descripciones) | `whileInView` con `once: true` |
| `SlideReveal` | contenido bipartito (imagen + texto) | `whileInView` con `direction` |
| `StaggerGroup` | contenedor con children escalonados | variantes con `staggerChildren: 0.08` |
| `StaggerItem` | hijo directo de `StaggerGroup` | hereda `hidden/show` del parent |
| `EyebrowReveal` | mini-título arriba de secciones (eyebrow) | `whileInView` con delay corto |
| `PopReveal` | badges, status indicators, iconos animados | `whileInView` con spring preset |

**Ventajas del patrón:**
- **Tree-shakeable**: cada sección importa solo lo que usa.
- **Tema-aware**: las animaciones no dependen de colores, son motion puro.
- **DRY**: las constantes `easeOut`, `spring`, `sectionVariants`, etc. viven una sola vez.
- **Consistencia visual**: todas las secciones comparten el mismo easing.

## 🗂️ Archivos centrales

### 1. `src/components/animations/Animations.tsx` (311 líneas, el corazón)

Define **todo** el sistema de animación del proyecto:

- **Constantes**:
  - `easeOut = [0.16, 1, 0.3, 1]` — Apple-like easeOut (suave desaceleración).
  - `spring = { type: "spring", stiffness: 80, damping: 20 }` — spring preset físico.
- **Variantes reutilizables** (5):
  - `sectionVariants`: `{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } } }`
  - `textVariants`: opacity only, duration: 0.9.
  - `staggerContainerVariants`: opacity + `staggerChildren: 0.08, delayChildren: 0.05`.
  - `staggerItemVariants`: `{ hidden: { opacity: 0, y: 20, scale: 0.96 }, show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: easeOut } } }`.
- **Wrappers** (7) + utilities (3).
- **Re-export** de `LazyMotion` y `domAnimation` para uso en `layout.tsx`.

**Patrón crítico**: cada wrapper usa `viewport={{ once: true, margin: "-10% 0px" }}`. Eso significa que la animación se dispara **una sola vez** cuando el elemento entra al viewport con un 10% de margen arriba/abajo. Sin re-animaciones al hacer scroll back.

### 2. `src/app/layout.tsx`

```tsx
<ThemeProvider attribute="class" defaultTheme="dark"
                enableSystem={false}
                themes={["light", "dark", "rosepine-dark", "rosepine-light"]}
                disableTransitionOnChange>
  <LazyMotion features={domAnimation} strict>
    <BackgroundFX />
    {children}
  </LazyMotion>
</ThemeProvider>
```

**`LazyMotion` con `features={domAnimation}` y `strict={true}`**:
- `domAnimation` es **el subconjunto mínimo** de features de Motion: opacity, transform, transformOrigin. Suficiente para ~95% de casos (reveals, slides, staggers, springs).
- `strict={true}` hace que motion lance un error si vos usás `<motion.div>` directamente en lugar de `<m.div>`. Es la red de seguridad que evita el bundle completo.
- **Resultado**: bundle de Motion pasa de **~30 KB (full motion)** a **~4.6 KB solo lo necesario**. Esa es la magia de LazyMotion.

## 🔗 Qué wrapper usa cada sección (mapa real)

```
app/page.tsx                      → <SectionReveal> (cada sección adentro)
├── <HeroSection>                 → PopReveal (status badge) + StaggerGroup + StaggerItem
├── <SkillsSection>               → EyebrowReveal (eyebrow text) + StaggerGroup + StaggerItem
├── <ProjectsSection>             → EyebrowReveal (eyebrow "Construir, una pieza a la vez") + SectionReveal
├── <AboutMeSection>              → EyebrowReveal + SlideReveal (dirección "left"/"right" para bipartito)
└── <ContactSection>              → sin animación de reveal (es siempre visible)

molecules/Formulary.tsx         → LoadingDots (mientras isSubmitting)
components/atoms/BackgroundFX.tsx → sin wrappers (es CSS puro)
```

## 🎓 Patrón 2026 aplicado

### Patrón 1: Level-based reveal en lugar de animación por elemento

```tsx
// ✓ Patrón del proyecto: contenedor semántico
<SectionReveal>
  <HeroSection ... />
</SectionReveal>

// ✗ Anti-pattern: animar elementos sueltos
<m.div
  initial={{ opacity: 0, y: 24 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ duration: 0.7 }}
>
  <HeroSection ... />
</m.div>
```

El proyecto prefiere definir el contenedor una vez y confiar en `SectionReveal`. Si necesitás animar elementos sueltos dentro (ej: cards en grid), usás `StaggerGroup` + `StaggerItem`.

### Patrón 2: Variantes globales, props de delay local

```tsx
// Definido una sola vez en Animations.tsx
const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: easeOut } },
};

// Uso: props de delay local, variantes globales
<SectionReveal delay={0.2}>
  <SkillsSection />
</SectionReveal>
```

`<SectionReveal delay={0.2}>` espera 200ms antes de animar, pero la variante (qué animar) viene de `Animations.tsx`. **No redefinas variantes locales, solo pasá `delay`**.

### Patrón 3: Always controlable — no Infinity loops

`LoadingDots` es **controlado** por la prop `isLoading`:
```tsx
if (!isLoading) return null;  // ← No renderiza, no anima, no consume CPU
```

La versión anterior usaba `repeat: Infinity` con `repeatType: "reverse"` siempre montado, lo cual drenaba batería + rompía animación cuando re-render. **Regla del proyecto: ninguna animación corre más allá de su ciclo de vida lógico.**

## 🎨 Cómo se ve en HTML/SSR

Importante: las animaciones son **client-side**. El wrapper `LazyMotion` requiere `"use client"`. El HTML del SSR viene con `opacity: 0` porque la animación aún no corrió:

```html
<!-- SSR (animación no corrió) -->
<div class="opacity-0 translate-y-6" style="opacity:0;transform:translateY(24px)">
  <HeroSection>...</HeroSection>
</div>

<!-- Después de hidratación (animación disparó) -->
<div class="" style="opacity:1;transform:none">
  <HeroSection>...</HeroSection>
</div>
```

**Esto es esperado.** Si ves "flash" donde aparece el contenido, es porque Motion aún no controló el `opacity`. La transición es de 0.7s con `easeOut`, no perceptible.

## ⚠️ Errores comunes que NO debés repetir

| ❌ Anti-pattern | ✓ Fix en el proyecto |
|---|---|
| Importar `motion` (librería entera, ~30KB) | Importar `motion/react` (LazyMotion sub) |
| Usar `<motion.div>` directamente | Usar `<m.div>` (el sub-version de LazyMotion) |
| Definir variantes en cada componente | Definir variantes en `Animations.tsx` (una sola vez) |
| `repeat: Infinity` siempre montado | `repeat: Infinity` solo dentro de `LoadingDots` con `isLoading` controlado |
| `transition={{ ... }}` en cada `<m.div>` | `<SectionReveal transition={{ delay }}>` (el wrapper controla) |
| Múltiples `<LazyMotion>` en el árbol | UN solo `<LazyMotion>` en `app/layout.tsx` (root) |

## 🔧 Cómo agregar un nuevo wrapper

Si necesitás, por ejemplo, un `ZoomInReveal`:

```tsx
// 1. En Animations.tsx, agregar la variante
const zoomVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: easeOut } },
};

// 2. Wrapper
export function ZoomInReveal({
  children,
  delay = 0,
  className = "",
}: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <m.div
      variants={zoomVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      transition={{ delay }}
      className={className}
    >
      {children}
    </m.div>
  );
}

// 3. Re-export del Animations.tsxindex.ts (si lo usás)
export { ZoomInReveal };
```

Y ya está disponible para usar en cualquier sección.

## 📦 Relaciones con el sistema theming v2

Las animaciones **no dependen del tema**. Usan `opacity`, `transform: translate/scale`, `transition` de CSS Motion nativo. No hay clases de Tailwind que cambien con el tema. Eso significa que un cambio de tema **no re-anima** el contenido — solo cambia colores.

Si querés que la transición de tema sea animada (fade entre palettes), se hace a nivel de CSS con `transition: background-color 200ms` en el `<body>` o en `.bg-card`. Pero **eso es CSS, no Motion**.

## 📚 Recursos relacionados

- [[learning/frontend/css/libraries/motion/motion-index]] — índice de Motion (fundamentos teóricos)
- [[learning/frontend/css/libraries/motion/fundamentals/spring-and-gestures]] — guía de springs
- [[learning/frontend/css/libraries/motion/fundamentals/use-scroll-and-use-transform]] — scroll-linked animations
- [[learning/frontend/css/libraries/motion/patterns/layout-and-exit-animations]] — patterns avanzados (layoutId, AnimatePresence)
- [[learning/projects/portfolio-v2/theming-v2-flow]] — flujo completo del theming (paralelo al sistema de animations)
- [[learning/projects/portfolio-v2/raw/globals-css-theming-v2]] — nodo conceptual de globals.css

## 🔗 Conexión al sistema v2 (grafo de Graphify)

El archivo `Animations.tsx` tiene **16 edges INFERRED** en el grafo:

- `app_page → SectionReveal` (la página compone la primera sección con `SectionReveal`)
- `AboutMeSection → EyebrowReveal + SlideReveal`
- `HeroSection → PopReveal + StaggerGroup + StaggerItem`
- `ProjectsSection → EyebrowReveal + SectionReveal`
- `SkillsSection → EyebrowReveal + StaggerGroup + StaggerItem`
- `Formulary → LoadingDots`
- `Animations` (contiene) `SectionReveal, TextReveal, SlideReveal, StaggerGroup, StaggerItem, EyebrowReveal, PopReveal, ExpandLine, scrollToSection, LoadingDots, easeOut, spring`

El hub de Animations es central porque toda sección del portfolio toca este archivo.
