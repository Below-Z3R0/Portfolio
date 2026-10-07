# Documentation — Portfolio-v2

> Documentación técnica completa del proyecto. Cada sistema está documentado en su propio archivo, organizado por categoría. El grafo de Graphify (en `graph/graphify-out/`) mapea todas las relaciones entre archivos.
>
> Para presentación y quick-start, ver el [README principal](../README.md) en la raíz.

## 🗺️ Mapa de sistemas

| # | Sistema | Doc | Estado | Comunidad Graphify |
|---|---|---|---|---|
| 1 | Base de datos (Postgres schema + RLS + RPC) | [db-supabase.md](./03-systems/db-supabase.md) | ✅ | C3 |
| 2 | Carga de contenido (RPC + orquestador + cache) | [orquestador.md](./03-systems/orquestador.md) | ✅ | C2 |
| 3 | Theming v2 (4 paletas, 36 vars, shadcn conventions) | [theming-v2-flow.md](./03-systems/theming-v2-flow.md) + [theming-system.md](./03-systems/theming-system.md) | ✅ | C5, C7, C8 |
| 4 | Motion (LazyMotion + 7 wrappers level-based) | [motion-integration.md](./03-systems/motion-integration.md) | ✅ | C0 |
| 5 | UI base (atoms + molecules + barrel) | [ui-base.md](./03-systems/ui-base.md) + [barrel-type-helpers.md](./03-systems/barrel-type-helpers.md) | ✅ | C0, C1 |
| 6 | Modal + Form + EmailJS (3 modales con AnimatePresence) | [modal-form-emailjs.md](./03-systems/modal-form-emailjs.md) + [animate-presence.md](./03-systems/animate-presence.md) | ✅ | C0 |
| 7 | Sistema de Imágenes (dual: raster + SVG) | [images-svg.md](./03-systems/images-svg.md) | ✅ | C4, C10 |
| 8 | Loading / Skeletons (6 archivos) | [loading-skeletons.md](./03-systems/loading-skeletons.md) | ✅ | C6 |
| 9 | Header / Navegación (mobile + desktop) | [header-nav.md](./03-systems/header-nav.md) | ✅ | C0, C9 |
| 10 | i18n (URL query param) | [i18n.md](./03-systems/i18n.md) + [i18n-metadata-extensions.md](./03-systems/i18n-metadata-extensions.md) | ✅ | C5 |
| 11 | SEO + metadata + next/font + ErrorBoundary | [seo-metadata.md](./03-systems/seo-metadata.md) + [fonts-next-font.md](./03-systems/fonts-next-font.md) | ✅ | C7 |
| 12 | Manejo de errores (data layer + ErrorBoundary) | [error-handling.md](./03-systems/error-handling.md) | ✅ | cross-cutting |
| 13 | Paleta Rosepine (referencia) | [color-palette-catalog.md](./03-systems/color-palette-catalog.md) | ✅ | — |

## 🏗️ God nodes (símbolos más conectados)

| # | Símbolo | Edges | Rol |
|---|---|---|---|
| 1 | `components/types.ts` | 257 | Tipos e interfaces centralizados |
| 2 | `components/schemas.ts` | 316 | Zod schemas (fuente de verdad de la data) |
| 3 | `services/data/site.ts` | 90 | `getSiteData(lang)` (1 RPC + Zod anidado + `unstable_cache`) |
| 4 | `app/globals.css` | — | Theming v2 (4 paletas × 36 vars) |
| 5 | `components/animations/Animations.tsx` | 311 | 7 wrappers level-based (Motion) |
| 6 | `components/atoms/Button.tsx` | 25 | Atomo más usado |

## 📂 Estructura de esta documentación

```
docs/
├── README.md (este archivo)
├── 01-getting-started/         # Para arrancar el proyecto (próximamente)
├── 02-architecture/            # Arquitectura general (próximamente)
└── 03-systems/                 # 18 docs de sistemas individuales (+1 deprecated)
│   ├── db-supabase.md
│   ├── orquestador.md
│   ├── theming-v2-flow.md
│   ├── theming-system.md
│   ├── color-palette-catalog.md
│   ├── motion-integration.md
│   ├── ui-base.md
│   ├── modal-form-emailjs.md
│   ├── animate-presence.md
│   ├── images-svg.md
│   ├── loading-skeletons.md
│   ├── header-nav.md
│   ├── i18n.md
│   ├── i18n-metadata-extensions.md
│   ├── seo-metadata.md
│   ├── fonts-next-font.md
│   ├── error-handling.md
│   ├── barrel-type-helpers.md
│   └── _deprecated/                  # Patrones viejos, conservados por referencia
│       └── orquestador-promise-all-pattern.md   # getGeneralData (17 queries) → reemplazado por site.ts
└── 04-decisions/                # ADRs
    └── 024-rpc-get-site-payload.md   # RPC + cache vs Promise.all (2026-10-07)
├── 05-issues/                  # Issues conocidos
│   ├── issues.md                # Catálogo maestro de issues (#001-#027)
│   └── testing-ci-deploy.md     # Gap documentado
├── 06-reference/                # Referencias rápidas
│   └── systems-overview.md      # Overview consolidado
└── graph/
    └── graphify-out/            # Grafo de código (regenerable)
        ├── GRAPH_REPORT.md
        ├── graph.html
        ├── graph.json
        └── .graphify_analysis.json
```

## 🧪 Cómo regenerar el grafo

```bash
cd ~/Documents/Github/Portfolio-v2/portfolio-v2
source .venv/bin/activate
graphify extract src/ --out docs/graph/
graphify cluster-only docs/graph/
python3 docs/graph/restore-theming-edges.py
```

> El script `restore-theming-edges.py` restaura las 10 edges manuales del theming v2 que el cluster borra.

## 📊 Stats del corpus (al 2026-10-05)

- **Archivos analizados:** ~60 .ts/.tsx/.css en `src/` + 1 doc conceptual (`theming.v2.ts` proxy)
- **Comunidades detectadas:** 18 (12 principales, 6 thin)
- **Edges:** 553
- **Sistemas documentados:** 17 individuales + 1 overview + 1 issues + 1 deprecated
- **Docs en `docs/`:** 20 archivos

## 🔗 Cómo se conectan los sistemas

```
   [DB + Supabase] ← RPC get_site_payload
       │
       └──► [Orquestador] ← 1 sola query cacheada (unstable_cache 1h)
                │
                ├──► [Zod schemas] ← validación declarativa con z.object anidado
                └──► [SitePayload] ← tipado end-to-end
                │
       ├──► [i18n] ← multi-idioma (es/en)
       │
       ├──► [Theming v2] ← 4 paletas (dark/light/rosepine-*)
       │
       ├──► [Motion] ← 7 wrappers + LazyMotion
       │
       ├──► [Sistema de Imágenes] ← dual: raster + SVG
       │
       └──► [Sistema de errores] ← captura throws del data layer
```

Si entendés la BD, el resto se lee solo. Por eso el orden arranca por ahí.

## 🔗 Ver también

- [README principal](../README.md) — quick-start y descripción del proyecto
- [Issues conocidos](./05-issues/issues.md) — catálogo de deudas técnicas
- [Systems overview](./06-reference/systems-overview.md) — overview consolidado
- [Graph report](./graph/graphify-out/GRAPH_REPORT.md) — grafo de código detallado
