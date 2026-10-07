---
title: "Orquestador generaldata.service.ts — el puente entre DB y UI"
type: system-documentation
project: portfolio-v2
scope: project
status: active
created: 2026-10-05
updated: 2026-10-05
tags: [orquestador, supabase, zod, schemas, parallel-queries, server-component, portfolio-v2, system]
verified_with: minimax-m3
---

> **TL;DR:** `generaldata.service.ts` es el **único punto de entrada** de toda la data de la DB hacia la UI. Llama a `getData` 12 veces (content) + `getMetaData` 9 veces (metadata) en **paralelo con `Promise.all`**, valida cada bloque contra su Zod schema, y reensambla todo en una `Promise<GeneralData>`. El componente Server `app/page.tsx` lo consume, propaga a las 7 secciones, y todo el tipado es **end-to-end** desde SQL hasta el JSX.

## 🎯 Por qué existe este orquestador

Sin él, cada componente tendría que hacer su propio `await supabase.from(...)` + su propio Zod parse, **replicando 17 veces** la lógica de fetch + validación. Con el orquestador, **un solo lugar** sabe cómo se llama la DB, cómo se valida, y cómo se entrega.

```ts
// SIN orquestador (cada componente hace lo suyo):
function HeroSection() {
  const { data, error } = await supabase.from("translations").select(...).eq(...);
  if (error) throw new Error(...);
  const parsed = HeroContentSchema.parse(data.content);
  return <Title2 txt={parsed.title_lg} />;
}

// CON orquestador (un solo punto de entrada):
const generalData = await getGeneralData("es");
return (
  <HeroSection
    hero_data={generalData.hero_section.data}
    contact_meta={generalData.hero_section.meta.contacts}
  />
);
```

## 📁 El archivo en su totalidad (102 líneas)

```ts
// src/services/generaldata.service.ts
"use server";
import {
  type GeneralData,
  type ContactSectionMetadata,
  CONTENT_SCHEMAS,
  GeneralContactsSchema,
  METADATA_SCHEMAS,
  PROJECT_ITEM_SCHEMA,
  PROJECT_METADATA_SCHEMA,
} from "../components/schemas";
import { getData } from "./Data/data.service";
import { getMetaData } from "./Data/metadata.service";
import { createClient } from "./supabase/server";

export const getGeneralData = async (lang: string = "es",): Promise<GeneralData> => {
  const supabase = await createClient();

  const [
    hero_section,
    navbar_section,
    skills_section,
    projects_section,
    aboutme_section,
    contact_section,
    footer_section,
    centenoadvisory,
    centenoadvisory_db,
    centenoadvisory_features,
    portfolio,
    nincy,
  ] = await Promise.all([
    getData("section.hero", lang, supabase, CONTENT_SCHEMAS["section.hero"]),
    getData("section.navbar", lang, supabase, CONTENT_SCHEMAS["section.navbar"]),
    getData("section.skills", lang, supabase, CONTENT_SCHEMAS["section.skills"]),
    getData("section.projects", lang, supabase, CONTENT_SCHEMAS["section.projects"]),
    getData("section.aboutme", lang, supabase, CONTENT_SCHEMAS["section.aboutme"]),
    getData("section.contact", lang, supabase, CONTENT_SCHEMAS["section.contact"]),
    getData("section.footer", lang, supabase, CONTENT_SCHEMAS["section.footer"]),

    getData("project.centeno-advisory", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.centeno-advisory-db", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.centeno-advisory-features", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.portfolio", lang, supabase, PROJECT_ITEM_SCHEMA),
    getData("project.nincy", lang, supabase, PROJECT_ITEM_SCHEMA),
  ]);

  const [
    hero_meta,
    skills_section_meta,
    aboutme_section_meta,
    centenoadvisory_meta,
    centenoadvisory_db_meta,
    centenoadvisory_features_meta,
    portfolio_meta,
    nincy_meta,
    contacts_meta,
  ] = await Promise.all([
    getMetaData("section.hero", supabase, METADATA_SCHEMAS["section.hero"]),
    getMetaData("section.skills", supabase, METADATA_SCHEMAS["section.skills"]),
    getMetaData("section.aboutme", supabase, METADATA_SCHEMAS["section.aboutme"]),
    getMetaData("project.centeno-advisory", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.centeno-advisory-db", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.centeno-advisory-features", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.portfolio", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("project.nincy", supabase, PROJECT_METADATA_SCHEMA),
    getMetaData("general.contacts", supabase, GeneralContactsSchema),
  ]);

  const contacts_meta_array: ContactSectionMetadata = Object.values(contacts_meta);

  return {
    hero_section: { data: hero_section, meta: { general: hero_meta, contacts: contacts_meta } },
    navbar_section: { data: navbar_section.data },
    skills_section: { data: skills_section, meta: skills_section_meta },
    aboutme_section: { data: aboutme_section, meta: aboutme_section_meta },
    contact_section: { data: contact_section, meta: contacts_meta_array },
    footer_section: { data: footer_section, meta: navbar_section.data },
    projects_section,
    projects_array: [
      { key: 1, data: centenoadvisory, meta: centenoadvisory_meta },
      { key: 2, data: centenoadvisory_db, meta: centenoadvisory_db_meta },
      { key: 3, data: centenoadvisory_features, meta: centenoadvisory_features_meta },
      { key: 4, data: portfolio, meta: portfolio_meta },
      { key: 5, data: nincy, meta: nincy_meta },
    ],
  };
};
```

## 🧠 Anatomía (3 partes)

### Parte 1: Setup

```ts
"use server";                                          // Server-only
const supabase = await createClient();                  // Server client con cookies
```

`createClient()` (de `supabase/server.ts`) lee las cookies de Next.js y crea un cliente Supabase con auth context.

### Parte 2: Fetch paralelo (17 queries)

```ts
const [...] = await Promise.all([
  getData("section.hero", ...),      // 1 query content
  getData("section.navbar", ...),    // 1 query content
  // ... 6 content más
  getData("project.centeno-...", ...),  // 1 query content
  // ... 4 projects content
]);
```

`Promise.all` dispara las 12 queries en paralelo. **En serie serían 12×N ms; en paralelo son ~N ms** (donde N es la latencia de Supabase, típicamente 20-50ms).

**17 queries en paralelo** ≈ 250-400ms en Supabase (depende de la red).

### Parte 3: Reensamblaje

```ts
return {
  hero_section: { data: hero_section, meta: { general: hero_meta, contacts: contacts_meta } },
  navbar_section: { data: navbar_section.data },
  // ...
  projects_array: [
    { key: 1, data: centenoadvisory, meta: centenoadvisory_meta },
    // ...
  ],
};
```

**Estructura del output**:

```ts
interface GeneralData {
  hero_section: HeroSection;          // { data, meta: { general, contacts } }
  navbar_section: NavbarSection;      // { data: NavbarItem[] }
  skills_section: SkillsSection;      // { data, meta: { categories } }
  projects_section: ProjectsSection;  // content (sin wrapper)
  aboutme_section: AboutMeSection;    // { data, meta: { image_key } }
  contact_section: ContactSection;    // { data, meta: ContactItem[] }
  footer_section: FooterSection;      // { data, meta: NavbarItem[] (reusado) }
  projects_array: ProjectsList;       // [5 items, cada uno { key, data, meta } ]
}
```

## 🔍 Por qué algunos se "wappean" distinto

Mirando el código:

| Key | Estructura final | Por qué |
|---|---|---|
| `hero_section` | `{ data, meta: { general, contacts } }` | Hero usa tanto la metadata del bloque (`general`) como la metadata de `general.contacts` |
| `navbar_section` | `{ data: navbar_section.data }` | Navbar no tiene metadata propia, solo array de links |
| `footer_section` | `meta: navbar_section.data` | **Footer reusa los mismos links del navbar** para su navegación |
| `contact_section` | `meta: contacts_meta_array` | `Object.values(contacts_meta)` lo convierte de `{ github, linkedin }` a `ContactItem[]` |
| `projects_section` | `projects_section` directo (sin wrapper) | El content de projects es solo `{ title_sm, title_lg, paragraph, labels }`, no necesita wrapper |

Esas decisiones están **en el orquestador** porque son la "lógica de armado" del payload. Si las moviera a cada componente, repetiría la lógica de armado.

## 🧬 Los schemas que importan

El orquestador usa 3 objetos del `schemas.ts`:

```ts
// schemas.ts
export const CONTENT_SCHEMAS = {
  "section.hero": HeroContentSchema,
  "section.navbar": NavbarContentSchema,
  "section.skills": SkillsContentSchema,
  "section.projects": ProjectsContentSchema,
  "section.aboutme": AboutMeContentSchema,
  "section.contact": ContactContentSchema,
  "section.footer": FooterContentSchema,
} as const;

export const METADATA_SCHEMAS = {
  "section.hero": HeroMetadataSchema,
  "general.contacts": GeneralContactsSchema,
  "section.skills": SkillsMetadataSchema,
  "section.aboutme": AboutMeMetadataSchema,
} as const;

export const PROJECT_ITEM_SCHEMA = ProjectItemSchema;
export const PROJECT_METADATA_SCHEMA = ProjectsMetadataSchema;
```

> El `as const` es lo que hace que `CONTENT_SCHEMAS["section.hero"]` esté tipado como `typeof HeroContentSchema` (no como `any`). Por eso `getData("section.hero", lang, supabase, CONTENT_SCHEMAS["section.hero"])` valida **con el schema correcto automáticamente**.

## ⚡ Patrón de uso en componentes

```ts
// app/page.tsx (Server Component)
export default async function Home({ searchParams }: PageProps<"/">) {
  const resolvedParams = await searchParams;
  const currentLang = resolvedParams.lang || "es";
  const general_data = await getGeneralData(currentLang);

  return (
    <>
      <Header nav_data={general_data.navbar_section} />

      <main id="main-content">
        <SectionReveal>
          <HeroSection hero_data={general_data.hero_section} />
        </SectionReveal>
        {/* ... 5 secciones más */}
      </main>

      <Footer footer_data={general_data.footer_section} />
    </>
  );
}
```

**Single call to `getGeneralData`** → todos los componentes reciben su data ya validada.

## 📈 Métricas

| Métrica | Valor |
|---|---|
| Queries en paralelo | 17 |
| Latencia típica (Supabase cloud) | 250-400ms |
| Latencia si fuera serie | 4-7s |
| Aceleración | ~16× |
| Líneas de código | 102 |
| Schemas Zod usados | 14 (7 content + 5 metadata + 2 de proyecto) |

## 🛠️ Cómo agregar un nuevo bloque

1. **Crear el schema Zod** en `schemas.ts`:
   ```ts
   export const NuevaContentSchema = z.object({ title: z.string(), paragraph: z.string() });
   export type NuevaContent = z.infer<typeof NuevaContentSchema>;
   ```

2. **Agregar al mapa CONTENT_SCHEMAS**:
   ```ts
   export const CONTENT_SCHEMAS = {
     "section.hero": HeroContentSchema,
     "section.nueva": NuevaContentSchema,  // ← acá
     // ...
   };
   ```

3. **Agregar al tipo GeneralData**:
   ```ts
   export type GeneralData = {
     // ...
     nueva_section: { data: NuevaContent };
   };
   ```

4. **Agregar query en getGeneralData**:
   ```ts
   const [..., nueva_section] = await Promise.all([
     // ...
     getData("section.nueva", lang, supabase, CONTENT_SCHEMAS["section.nueva"]),
   ]);

   return {
     // ...
     nueva_section: { data: nueva_section },
   };
   ```

5. **Pasar al componente** en `app/page.tsx`:
   ```tsx
   <NuevaSection data={general_data.nueva_section.data} />
   ```

## ⚠️ Issues conocidas

### 1. Comentarios en código sugieren sistemas no usados

```ts
/*     os_section,
    os_array: [
      { key: 1, data: centenoadvisory, meta: centenoadvisory_meta },
      // ...
    ],
    ia_section,
    ia_array: [
      // ...
    ],*/
```

Hay **sistemas OS (Open Source) e IA (AI)** que están **comentados** en el orquestador. No se usan en el frontend (`IASection` y `OSSection` existen en `src/components/organims/` pero no se importan en `app/page.tsx`). **Decisión pendiente**: eliminar o implementar.

### 2. La función acepta `lang: string` sin validar

```ts
export const getGeneralData = async (lang: string = "es",): Promise<GeneralData> => {
```

Si el `lang` no existe en la BD, el `getData` interno **falla con throw** (Zod error). No hay fallback. La página rompe.

**Fix**: validar `lang` contra una lista permitida al inicio.

## 🔗 Conexiones con otros sistemas

- **DB + Supabase** (comunidad 3) — los `getData`/`getMetaData` son la interface.
- **Theming v2** (comunidad 8) — no se mezcla directamente.
- **Icon registry** (comunidad 4) — `IconNameSchema` se valida al usar `data.tecnologies[].icon_key`.
- **Formulario** (comunidad 5) — usa schemas distintos, no la BD.
- **Imágenes** (comunidad 10) — `image_key` se referencia en metadata pero la URL la construye `supabaseImageLoader`.

## 🔗 Ver también

- [[learning/projects/portfolio-v2/db-supabase-headless-cms]] (DB)
- [[learning/projects/portfolio-v2/tipado-zod-end-to-end]] (tipado SQL → Zod → componente)
- [[learning/projects/portfolio-v2/theming-v2-flow]] (theming)
- ADR-019: page.tsx como único orquestador de queries
- ADR-013: Tipado automático con `supabase gen types`
- ADR-012: Zod para el shape de content jsonb

## Próximo paso

Sigo con el **Sistema de Imágenes** (`<Image>` con supabase-image-loader.ts, configuración en `next.config.ts`, vs SVG inline con icon-registry). Decime cuando parar.
