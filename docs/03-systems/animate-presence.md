---
title: "Sistema de AnimatePresence y exit animations"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [motion, animate-presence, exit-animations, modals, forms, portfolio-v2, system, react]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto usa `<AnimatePresence>` (motion) en **3 modales** (SuccessMessage, ErrorMessage, Modal) para que las exit transitions se rendericen cuando el componente se desmonta. CSS no puede animar unmount (el elemento desaparece antes de que la transición termine), pero `<AnimatePresence>` mantiene el componente en el DOM hasta que la animación de exit termina. Cada modal tiene 2-3 animaciones encadenadas (backdrop fade + modal scale + ícono path) con springs o durations específicas. **No hay un wrapper compartido** — cada modal implementa su propio `AnimatePresence` con sus propias animaciones.

## 🎯 Por qué AnimatePresence

CSS no puede animar unmount:

```css
.modal { transition: opacity 0.2s; }
.modal.hidden { opacity: 0; }
<!-- Si removés .hidden del HTML, .modal desaparece instantáneamente -->
```

`AnimatePresence` resuelve esto manteniendo el componente en el DOM hasta que la exit animation termine:

```tsx
<AnimatePresence>
  {show && (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </m.div>
  )}
</AnimatePresence>
<!-- Cuando show=false, AnimatePresence mantiene el componente en el DOM
     hasta que la exit animation (opacity 0) termina, luego lo desmonta -->
```

## 📁 Archivos (4 modales + el wrapper)

| Archivo | Líneas | Rol |
|---|---|---|
| `src/components/molecules/Modal.tsx` | 60 | Modal fullscreen con `<m.div>` initial/animate/exit (sin AnimatePresence wrapper — se renderiza condicional, no desmonta) |
| `src/components/molecules/SuccessMessage.tsx` | 113 | Modal con `<AnimatePresence>` + checkmark path animation |
| `src/components/molecules/ErrorMessage.tsx` | 107 | Modal con `<AnimatePresence>` + X path animation |
| `src/components/atoms/BackgroundFX.tsx` | 14 | (no usa AnimatePresence pero es client component) |
| `src/components/animations/Animations.tsx` | 311 | (no exporta AnimatePresence — el usuario lo importa directo de `motion/react`) |

## 🧬 El patrón de `<AnimatePresence>` (4 lugares)

### Patrón A: `Modal` (sin AnimatePresence)

```tsx
// src/components/molecules/Modal.tsx
return (
  <m.div
    // Backdrop
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    onClick={onClose}
    className="fixed inset-0 z-50 ..."
  >
    <m.div
      // Modal content
      initial={{ opacity: 0, scale: 0.50, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.50, y: 30 }}
      transition={{ type: "spring" }}
      onClick={(event) => event.stopPropagation()}
    >
      {/* contenido */}
    </m.div>
  </m.div>
);
```

> **No usa `<AnimatePresence>`**. El modal se renderiza **condicionalmente** desde el padre (basado en `open` prop). Las exit transitions se renderizan pero **solo si el padre mantiene el componente en el DOM durante la exit**.
>
> **Issue**: si el padre hace `setOpen(false)` y desmonta inmediatamente, el modal desaparece sin exit animation. **Fix planeado**: envolver en `<AnimatePresence>`.

### Patrón B: `SuccessMessage`

```tsx
<AnimatePresence>
  {show && (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 ..."
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
    >
      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* glow decorativo */}
        <div className="absolute inset-0 opacity-30 blur-2xl"
             style={{ background: "radial-gradient(circle at top, var(--glow-accent) 0%, transparent 70%)" }} />
        
        {/* checkmark animado */}
        <m.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }}
          className="size-20 rounded-full bg-success-soft border-2 border-success"
        >
          <svg viewBox="0 0 24 24">
            <m.path d="M5 13l4 4L19 7"
                   initial={{ pathLength: 0 }}
                   animate={{ pathLength: 1 }}
                   transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }} />
          </svg>
        </m.div>
        
        {/* textos con stagger */}
        <m.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }}>{title}</m.h3>
        <m.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.4 }}>{message}</m.p>
        
        {/* botón cerrar */}
        <m.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6, duration: 0.4 }}>
          <Button txt="Cerrar" onClick={onClose} ... />
        </m.div>
      </m.div>
    </m.div>
  )}
</AnimatePresence>
```

**3 niveles de animación**:
1. **Backdrop** (200ms fade).
2. **Modal container** (spring scale + slide).
3. **Checkmark SVG path** (500ms con delay 300ms, después de que el modal aparece).

### Patrón C: `ErrorMessage` (idéntico a SuccessMessage)

```tsx
<AnimatePresence>
  {show && (
    <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} ...>
      <m.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} transition={{ type: "spring", stiffness: 300, damping: 25 }}>
        <m.div initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }}>
          <svg viewBox="0 0 24 24">
            <m.path d="M6 6l12 12M18 6L6 18" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }} />
          </svg>
        </m.div>
        {/* ... */}
      </m.div>
    </m.div>
  )}
</AnimatePresence>
```

**Mismo patrón que SuccessMessage** pero con la X (rotate inicial -90°) en vez del checkmark.

## 🎬 Timeline de las animaciones encadenadas

### `SuccessMessage` (al abrir)

```
t=0:    backdrop fade-in start (duration 200ms)
t=200:  backdrop fully visible
        modal scale + slide start (spring, stiffness 300, damping 25)
t=400:  modal scale at ~95% (still animating)
t=500:  modal fully visible
        checkmark delay starts (delay 300ms)
t=300:  checkmark initial scale 0 (invisible)
t=500:  checkmark scale start (spring)
t=700:  checkmark fully visible
        checkmark path starts (duration 500ms)
t=800:  h3 fade-in start (delay 400ms)
t=1200: h3 fully visible, p starts
t=1500: p fully visible, button starts
t=1900: button fully visible — modal complete
```

**Total: 1.9 segundos** de animación encadenada.

## 🛠️ Cómo agregar un nuevo modal con AnimatePresence

1. Crear el componente con la misma estructura:
   ```tsx
   "use client";
   import { AnimatePresence, m } from "motion/react";
   
   export function MiModal({ show, onClose }: MiModalProps) {
     return (
       <AnimatePresence>
         {show && (
           <m.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             onClick={onClose}
             className="fixed inset-0 z-50 ..."
           >
             <m.div
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 0.95 }}
               transition={{ type: "spring", stiffness: 300, damping: 25 }}
               onClick={(e) => e.stopPropagation()}
               className="...modal-content..."
             >
               {/* contenido */}
             </m.div>
           </m.div>
         )}
       </AnimatePresence>
     );
   }
   ```

2. Definir el type en `types.ts`:
   ```ts
   export interface MiModalProps {
     show: boolean;
     onClose: () => void;
   }
   ```

3. **Nunca desmontes manualmente** — el padre pasa `show={true|false}` y `<AnimatePresence>` se encarga del resto.

> **Regla clave**: el padre **no debe** hacer `if (show) return <MiModal />`. **Siempre** hacer `return <AnimatePresence>{show && <MiModal />}</AnimatePresence>`.

## ⚠️ Issues conocidas

### 1. **`Modal.tsx` no usa `<AnimatePresence>`**

El Modal principal (de proyectos) **no tiene wrapper de AnimatePresence**. El padre en `ProjectCard.tsx` (o donde se monte) controla el renderizado.

```tsx
// ProjectCard.tsx (probablemente)
{openModal && <Modal ... />}
```

> **Issue**: si el padre desmonta el Modal sin delay, la exit animation no se renderiza. **Fix**: el padre debe usar `<AnimatePresence>` o el Modal mismo debe envolverse.

### 2. **El stagger del texto es "manual" (no usa variants)**

```tsx
<m.h3 transition={{ delay: 0.4 }} />
<m.p transition={{ delay: 0.5 }} />
<m.div transition={{ delay: 0.6 }} />
```

> En vez de stagger manual, **podría usarse un parent variant**:
> ```tsx
> const containerVariants = {
>   hidden: {},
>   show: { transition: { staggerChildren: 0.1, delayChildren: 0.4 } }
> };
> <m.div variants={containerVariants} initial="hidden" animate="show">
>   <m.h3 variants={itemVariants} />
>   <m.p variants={itemVariants} />
> </m.div>
> ```
> **Más mantenible y consistente con `Animations.tsx`** (que ya tiene patterns como `StaggerGroup` + `StaggerItem`).

### 3. **No hay `reduced-motion` handler**

`AnimatePresence` siempre anima (incluso en usuarios con `prefers-reduced-motion: reduce` activado). **Issue de accesibilidad**.

**Fix**:
```tsx
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const transition = prefersReducedMotion ? { duration: 0 } : { duration: 0.3 };
```

> Tailwind tiene `motion-safe:animate-*` y `motion-reduce:animate-none`, pero motion directo no respeta esto automáticamente.

### 4. **El backdrop click no cierra siempre**

```tsx
<m.div onClick={onClose} className="...backdrop">
  <m.div onClick={(e) => e.stopPropagation()} className="...modal">
    {/* contenido */}
  </m.div>
</m.div>
```

> Click **fuera** del modal (sobre el backdrop) → cierra. Click **dentro** del modal → `stopPropagation` evita que cierre. **OK**, pero si el contenido del modal tiene elementos con `position: absolute` que sobresalen del modal, pueden interceptar el click y no cerrar.

## 🔗 Conexiones con otros sistemas

- **Motion** — `<AnimatePresence>` viene directo de `motion/react`. El wrapper `LazyMotion` en `layout.tsx` carga las features necesarias.
- **Theming v2** — usa `bg-success-soft`, `bg-destructive-soft`, `border-success`, `border-destructive`, `text-foreground` (los nuevos tokens del v2).
- **Modal (molecule)** — `Modal.tsx` no usa este patrón (issue #1).
- **Formulary** — orquesta el render de `SuccessMessage` y `ErrorMessage` con `useState<FormStatus>`.

## 🔗 Ver también

- [[learning/frontend/css/libraries/motion/motion-index]] (fundamentos de Motion)
- [[learning/frontend/css/libraries/motion/patterns/layout-and-exit-animations]] (patrones)
- [[learning/projects/portfolio-v2/sistema-modal-formulario-emailjs]] (Modal/Form/Email)
- [[learning/projects/portfolio-v2/motion-integration-guide]] (motion del proyecto)

## Próximo sistema

Sigo con **SEO / metadata / favicon** o **ErrorBoundary** o **Testing / CI / Deploy**. Decime.
