---
title: "Sistema de Modal + Formulario con EmailJS"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [modal, formulario, emailjs, react-hook-form, zod, motion, animations, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** El proyecto tiene **3 modales** que se complementan: (1) `Modal.tsx` para mostrar info detallada del proyecto cuando se hace click en un card; (2) `SuccessMessage.tsx` que aparece al enviar el form exitosamente; (3) `ErrorMessage.tsx` que aparece si EmailJS falla. El `Formulary.tsx` orquesta los 3 con `useState<FormStatus>` (4 estados: `idle`/`loading`/`success`/`error`). Validación: **react-hook-form + Zod (mode: `onChange`)**. Envío: **EmailJS** (4 env vars públicas). El template de EmailJS vive en el dashboard de EmailJS (no en el código), y desde el form se mandan 2 emails: al admin (con el contenido) y un auto-reply al usuario (confirmación).

## 🎯 ¿Por qué 3 modales y no 1?

| Modal | Trigger | Uso | Animación |
|---|---|---|---|
| `Modal.tsx` | Click en `ProjectCard` | Mostrar info detallada del proyecto | Spring scale + opacity |
| `SuccessMessage.tsx` | Email enviado OK | Confirmar al usuario que recibimos | Checkmark path animation |
| `ErrorMessage.tsx` | EmailJS throw | Mostrar el error y permitir retry | X path animation |

**AnimatePresence** (motion) hace que las exit transitions se rendericen (CSS no puede animar unmount).

## 📁 Archivos

| Archivo | Líneas | Rol |
|---|---|---|
| `src/components/molecules/Modal.tsx` | 60 | Modal fullscreen con imagen + título + descripción interactiva |
| `src/components/molecules/Formulary.tsx` | 159 | Form completo (RHF + Zod + EmailJS) |
| `src/components/molecules/SuccessMessage.tsx` | 113 | Modal de éxito con checkmark animado |
| `src/components/molecules/ErrorMessage.tsx` | 107 | Modal de error con X animada |
| `src/components/schemas.ts` (líneas 4-9) | 6 | `SendEmailSchema` (validación del form) |
| `src/components/types.ts` (líneas 147-176) | 30 | Types: `FormularyProps`, `FormStatus`, `SuccessMessageProps`, `ErrorMessageProps` |
| `.env` | — | 4 env vars de EmailJS |

## 🎭 El Modal (recién agregado)

### Anatomía

```tsx
// src/components/molecules/Modal.tsx
export function Modal({ img, data, in_construction, onClose, activeTxt, setActivetxt }: ModalProps) {
  return (
    <m.div
      // Backdrop
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-page/80 backdrop-blur-sm p-4"
    >
      <m.div
        // Modal content
        initial={{ opacity: 0, scale: 0.50, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.50, y: 30 }}
        transition={{ type: "spring" }}
        onClick={(event) => event.stopPropagation()}
        className="relative w-232 h-180 rounded-3xl bg-card border border-accent/40 shadow-2xl overflow-hidden flex flex-col items-center justify-center"
      >
        {/* imagen (Button img usa el custom loader de Supabase) */}
        <Button img={img} imgStyle="object-cover mask-b-to-80%" buttonBody="h-100 pointer-events-none w-full" />
        
        {/* Título */}
        <div className="absolute inset-0 flex flex-col justify-end pl-20">
          <Title3 txt={data.category} />
          <Title2 txt={data.title} />
        </div>
        
        {/* Descripción interactiva */}
        <div className="h-full px-20 pt-5">
          <Paragraph className="text-[0.97rem]" txt={activeTxt} />
        </div>
        
        {/* Tecnologías como botones clickeables */}
        <div className="flex gap-4 mb-3">
          {data.tecnologies.map((item) => (
            <Button
              buttonBody={`size-8 cursor-pointer ${in_construction}`}
              onClick={() => setActivetxt(activeTxt === item.description ? data.paragraph : item.description)}
              key={item.name}
              aria-label={item.name}
            >
              <TecnologiesCard cardStyle="..." svg={item.icon_key} color={item.color} bar={true} />
            </Button>
          ))}
        </div>
      </m.div>
    </m.div>
  );
}
```

### 3 patrones clave del Modal

1. **Backdrop cierra el modal**: `<m.div onClick={onClose}>` en el outer. El `event.stopPropagation()` en el inner previene que el click dentro del modal lo cierre.
2. **Spring animation**: `transition={{ type: "spring" }}` da la sensación de "snap" al aparecer.
3. **Descripción interactiva**: las tecnologías son botones. Click en una tech cambia la descripción a la de esa tech. Click de nuevo → vuelve a la descripción original (`activeTxt === item.description`).

### Types del Modal

```ts
interface data extends ModalContent {
  category: string | undefined;
  title: string;
}

export interface ModalProps {
  img: string | undefined;
  in_construction: string;
  data: data;
  activeTxt: string;
  setActivetxt: (txt: string) => void;
  open: boolean;
  onClose: () => void;
};
```

> `data` extiende `ModalContent` (de schemas) **agregando** `category` y `title`. **Issue conocido**: `ModalContent = z.infer<typeof ProjectItemSchema>["modal"]` ya tiene `paragraph`, pero el modal usa `data.paragraph` (pasado por `activeTxt`). El wrapper `data` se construye en `ProjectCard.tsx`.

## ✉️ El Formulario + EmailJS

### Flujo completo

```
Usuario completa form
  ↓ RHF (useForm) + Zod (resolver)
  ↓ onChange en cada input
  ↓ Zod valida con SendEmailSchema
  ↓ Errores se muestran en <Span role="alert" />
  ↓
onSubmit (handleSubmit)
  ↓ emailjs.send(SERVICE_ID, TEMPLATE_ID, params, { publicKey: PUBLIC_KEY })
  ↓ Template de EmailJS ejecuta (manda 2 emails: admin + auto-reply al user)
  ↓
Si OK → setStatus("success") + reset() → modal SuccessMessage
Si error → setErrorMsg(...) + setStatus("error") → modal ErrorMessage
```

### `SendEmailSchema` (validación)

```ts
// src/components/schemas.ts
export const SendEmailSchema = z.object({
  name: z.string().min(2, 'Name to short!!').max(80, 'Name to large'),
  user_email: z.email('Invalid email!!').transform(v => v.toLowerCase().trim()),
  title: z.string().min(3, 'Subject to short!!'),
  message: z.string().min(8, 'Message to short!!')
});

export type SendEmail = z.infer<typeof SendEmailSchema>;
```

**4 validaciones**:
- `name`: 2-80 caracteres.
- `user_email`: email válido, normalizado a lowercase + trim.
- `title`: 3+ caracteres.
- `message`: 8+ caracteres.

**Errores se muestran con `<Span role="alert">`** (accesibilidad).

### RHF + Zod setup (en `Formulary.tsx`)

```ts
const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<SendEmail>({
  resolver: zodResolver(SendEmailSchema),
  mode: "onChange",  // valida en cada cambio (no esperar al submit)
  defaultValues: { name: "", user_email: "", title: "", message: "" }
});
```

**`mode: "onChange"`** es importante: la validación corre en cada keystroke. **Alternativas**:
- `onSubmit`: valida solo al submit (UX peor).
- `onBlur`: valida al perder foco (UX intermedia).
- `onTouched`: igual a `onBlur` pero no muestra errores hasta el primer blur.
- `all`: valida en TODO (overhead).

### EmailJS send

```ts
await emailjs.send(
  process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID!,
  process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID!,
  {
    from_name: data.name,
    reply_to: data.user_email,
    title: data.title,
    message: data.message,
  },
  { publicKey: process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY! },
);
```

**4 env vars** requeridas (en `.env`):

```env
NEXT_PUBLIC_EMAILJS_SERVICE_ID=service_xxx
NEXT_PUBLIC_EMAILJS_TEMPLATE_ID=template_xxx
NEXT_PUBLIC_EMAILJS_PUBLIC_KEY=public_key_xxx
```

### Manejo de errores

```ts
catch (err) {
  const e = err as Record<string, unknown>;
  console.error("EmailJS error:", JSON.stringify(e, Object.getOwnPropertyNames(e || {}), 2));
  console.error("Error keys:", e && Object.keys(e));
  console.error("Error status:", e && (e.status || e.code));
  console.error("Error text:", e && (e.text || e.message));
  const errorMessage = typeof e?.text === "string" ? e.text
    : typeof e?.message === "string" ? e.message
    : "Error desconocido al enviar el mensaje";
  setErrorMsg(errorMessage);
  setStatus("error");
}
```

**Robusto**: intenta extraer `text` o `message` del error object, si no, usa un fallback genérico.

## 🎨 El template de EmailJS (no está en el código)

El template vive en el **dashboard de EmailJS** (no en este repo). Tiene 2 emails configurados:

1. **Al admin (vos)**: con los datos del form. Variables disponibles: `{{from_name}}`, `{{reply_to}}`, `{{title}}`, `{{message}}`.
2. **Auto-reply al user**: confirmando que el mensaje fue recibido. Variable: `{{to_name}}` o similar (configurable en el template).

> **No podemos verificar el template exacto** desde el código. Solo sabemos qué variables se le pasan.

## 🟢 El Modal de éxito (SuccessMessage)

```tsx
<AnimatePresence>
  {show && (
    <m.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="success-title"
    >
      <m.div initial={{ opacity: 0, scale: 0.9, y: 20 }} ...>
        <div className="absolute inset-0 opacity-30 blur-2xl" style={{ background: "radial-gradient(circle at top, var(--glow-accent) 0%, transparent 70%)" }} />
        <m.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.1 }} className="size-20 rounded-full bg-success-soft border-2 border-success">
          <svg viewBox="0 0 24 24">
            <m.path d="M5 13l4 4L19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }} />
          </svg>
        </m.div>
        {/* texto + botón cerrar */}
      </m.div>
    </m.div>
  )}
</AnimatePresence>
```

**3 animaciones encadenadas**:
1. Backdrop fade-in (200ms).
2. Modal scale + slide (spring).
3. Checkmark pathLength animation (500ms con delay 300ms).

## 🔴 El Modal de error (ErrorMessage)

Idéntico a SuccessMessage, pero con:
- Border `border-destructive/40` (rojo en vez de success verde).
- Icon es una **X** con 2 path strokes (en vez de checkmark).
- `role="alertdialog"` (en vez de `dialog`).
- Botón de retry incluido (opcional).

```ts
export interface ErrorMessageProps {
  show: boolean;
  onClose: () => void;
  onRetry?: () => void;
  title?: string;
  message?: string;
}
```

## 🔄 Integración de los 3 modales

En `Formulary.tsx`:

```ts
const [status, setStatus] = useState<FormStatus>("idle");
const [errorMsg, setErrorMsg] = useState<string>("");

const closeModal = () => { setStatus("idle"); setErrorMsg(""); };

// En el JSX:
<SuccessMessage show={status === "success"} onClose={closeModal} />
<ErrorMessage
  show={status === "error"}
  onClose={closeModal}
  onRetry={() => { setErrorMsg(""); }}
  message={errorMsg}
/>
```

**`status`** es la única fuente de verdad. Los 3 modales (incluyendo el Modal principal del proyecto) se renderizan según `status` u otros flags.

## ⚠️ Issues conocidas

### 1. **El `data` del Modal es un wrapper redundante**

```ts
interface data extends ModalContent {
  category: string | undefined;
  title: string;
}
```

`ModalContent` (de schemas) ya tiene `paragraph`, `img_key`, `tecnologies`. `data` le agrega `category` y `title` solo para pasarlo al modal. **Issue**: `data` debería ser un tipo más limpio, no una extensión.

**Fix planeado**: `data = Pick<ProjectItem, 'tecnologies'> & { category: string; title: string; paragraph: string; }`.

### 2. **`autoCloseMs` definido pero no usado**

```ts
export interface SuccessMessageProps {
  show: boolean;
  onClose: () => void;
  title?: string;
  message?: string;
  autoCloseMs?: number;  // ← declarado, no implementado
}
```

**Issue**: el modal solo se cierra con click. **Fix**: usar `useEffect` con `setTimeout`.

### 3. **No hay validación del lado del servidor**

`SendEmailSchema` valida en el cliente (Zod + RHF). Pero **EmailJS recibe los datos crudos** y los pasa al template. Un usuario malicioso podría bypasear la validación con DevTools y enviar spam al admin.

**Fix**: configurar un webhook de Supabase Edge Function que valida server-side antes de enviar el email.

### 4. **El template de EmailJS no está versionado**

El template vive en el dashboard de EmailJS. Si alguien lo cambia ahí, **no hay registro de qué cambió**. Tampoco hay CI que verifique que las variables (`{{from_name}}`, etc.) coincidan con el `Formulary.tsx`.

**Fix**: usar una Edge Function de Supabase con el template embebido (versión controlada en el repo).

### 5. **No hay rate limiting**

Un usuario puede spamear el botón "Enviar" y enviar 100 emails en 10 segundos. **No hay throttle**.

**Fix**: deshabilitar el botón mientras `isSubmitting=true` (eso ya está) + rate limit en EmailJS dashboard o en una Edge Function.

## 🛠️ Cómo agregar una validación al form

1. Editar `SendEmailSchema` en `schemas.ts`:
   ```ts
   export const SendEmailSchema = z.object({
     name: z.string().min(2).max(80),
     user_email: z.email().transform(v => v.toLowerCase().trim()),
     title: z.string().min(3),
     message: z.string().min(8).max(1000),  // ← nueva validación
   });
   ```

2. El cambio se propaga automáticamente al form (RHF + Zod resolver) y a los errores visibles (`<Span>` con `role="alert"`).

## 🛠️ Cómo agregar un nuevo modal

1. Crear `src/components/molecules/MiModal.tsx`.
2. Definir `MiModalProps` en `types.ts`.
3. Usar `<AnimatePresence>` + `<m.div initial animate exit>` con `role="dialog"`.
4. Click en backdrop → `onClose()`.
5. Agregar `export * from "./molecules/MiModal";` en `components.ts`.

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** — el form **NO toca la DB**. EmailJS es externo.
- **Tipado Zod** — `SendEmailSchema` se valida en RHF + Zod resolver.
- **Motion** — todos los modales usan `<AnimatePresence>` + `<m.div>`.
- **Theming v2** — los modales usan `bg-card`, `border-border`, `text-foreground`, etc.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (DB)
- [[learning/projects/portfolio-v2/orquestador-generaldata-service]] (orquestador)
- [[learning/projects/portfolio-v2/sistema-imagenes-svg-image]] (custom loader)
- [[learning/projects/portfolio-v2/sistema-ui-base-atoms-molecules]] (atoms + molecules)
- [[learning/projects/portfolio-v2/motion-integration-guide]] (motion)
- ADR-014: Animaciones con CSS puro (no useInView)
- ADR-017: Labels de proyectos en translations

## Próximo paso

Sigo con **Loading / Skeletons** (skeletons de /home) o **Header / Navegación**. Decime.
