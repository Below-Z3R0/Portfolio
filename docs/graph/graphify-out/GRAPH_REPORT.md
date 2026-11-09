# Graph Report - graph  (2026-11-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 285 nodes · 568 edges · 15 communities (13 shown, 2 thin omitted)
- Extraction: 95% EXTRACTED · 4% INFERRED · 1% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `78d0e4e5`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components.ts
- Animations.tsx
- schemas.ts
- types/types.ts
- components/types.ts
- icon-registry.ts
- skeletonindex.tsx
- layout.tsx
- IconRender.tsx
- SectionReveal
- theming.v2.ts
- portfolio.get_site_payload
- ProjectCardProps
- AboutMeSection
- NavBarProps

## God Nodes (most connected - your core abstractions)
1. `Button()` - 12 edges
2. `Paragraph()` - 12 edges
3. `Title2()` - 11 edges
4. `Title3()` - 8 edges
5. `ProjectsSectionProps` - 6 edges
6. `EyebrowReveal()` - 6 edges
7. `LinkButton()` - 6 edges
8. `TitleProps` - 5 edges
9. `Title4()` - 5 edges
10. `useTheme()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --calls--> `getSiteData()`  [EXTRACTED]
  app/page.tsx → services/data/site.ts
- `ButtonProps` --references--> `IconKey`  [EXTRACTED]
  components/types.ts → services/assets/icon-registry.ts
- `TecnologiesConfig` --references--> `IconKey`  [EXTRACTED]
  components/types.ts → services/assets/icon-registry.ts
- `ProjectsSectionProps` --references--> `ProjectsList`  [EXTRACTED]
  components/types.ts → components/schemas.ts
- `ProjectsSectionProps` --references--> `ProjectsSection`  [EXTRACTED]
  components/types.ts → components/schemas.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Project Section Rendering with Shared Data** — app_pending_sectionreveal, app_pending_ossection, app_pending_iasection, app_pending_general_data_projects_section, app_pending_general_data_projects_array, app_pending_currentlang [INFERRED 0.90]

## Communities (15 total, 2 thin omitted)

### Community 0 - "components.ts"
Cohesion: 0.07
Nodes (24): LoadingDots(), Button(), LanguageToggle(), Span(), ThemeSwitcher(), ThemeToggle(), Title4(), Theme (+16 more)

### Community 1 - "Animations.tsx"
Cohesion: 0.09
Nodes (31): Home(), PageProps, easeOut, EyebrowReveal(), PopReveal(), SectionReveal(), sectionVariants, SlideReveal() (+23 more)

### Community 2 - "schemas.ts"
Cohesion: 0.09
Nodes (30): AboutMeContent, AboutMeContentSchema, AboutMeMetadataSchema, ContactContentSchema, ContactItemSchema, ContactList, ContactListSchema, ContactSectionMetadata (+22 more)

### Community 3 - "types/types.ts"
Cohesion: 0.08
Nodes (22): emailJsEnv, ensure(), MissingEnvError, supabaseEnv, createClient(), CompositeTypes, Constants, Database (+14 more)

### Community 4 - "components/types.ts"
Cohesion: 0.08
Nodes (30): AboutMeMetadata, Contact, ContactContent, ContactSection, FooterContent, FooterSection, Form, HeroContent (+22 more)

### Community 5 - "icon-registry.ts"
Cohesion: 0.13
Nodes (26): IconComponent, IconNameSchema, AlertCircleIcon(), DayAndNightIcon(), DockerIcon(), FigmaIcon(), FramerIcon(), GitHubIcon() (+18 more)

### Community 6 - "skeletonindex.tsx"
Cohesion: 0.24
Nodes (5): FormularySkeleton(), NavBarSkeleton(), ProjectCardSkeleton(), SkeletonPulse(), TecnologiesCardSkeleton()

### Community 7 - "layout.tsx"
Cohesion: 0.24
Nodes (6): geistMono, geistSans, metadata, BackgroundFX(), ThemeProvider(), NoiseTexture()

### Community 8 - "IconRender.tsx"
Cohesion: 0.27
Nodes (7): IconRender(), ButtonProps, IconRendererProps, LinkButtonProps, TecnologiesConfig, ICON_REGISTRY, IconKey

### Community 9 - "SectionReveal"
Cohesion: 0.28
Nodes (9): currentLang, general_data.ia_array (commented reference), general_data.ia_section (commented reference), general_data.os_section (commented reference), general_data.projects_array, general_data.projects_section, IASection, OSSection (+1 more)

### Community 10 - "theming.v2.ts"
Cohesion: 0.29
Nodes (6): ALL_TAILWIND_UTILITIES, NOTE: Este archivo existe únicamente para integrar globals.css dentro del grafo…, TailwindUtility, Theme, ThemeToken, themingConventions

### Community 11 - "portfolio.get_site_payload"
Cohesion: 0.40
Nodes (4): portfolio.content_blocks, portfolio.content_blocks_metadata, portfolio.translations, portfolio.get_site_payload()

### Community 12 - "ProjectCardProps"
Cohesion: 0.67
Nodes (3): ProjectItem, ProjectsMetadata, ProjectCardProps

## Ambiguous Edges - Review These
- `general_data.ia_array (commented reference)` → `IASection`  [AMBIGUOUS]
  app/pending.txt · relation: references
- `general_data.ia_array (commented reference)` → `OSSection`  [AMBIGUOUS]
  app/pending.txt · relation: references
- `general_data.ia_section (commented reference)` → `IASection`  [AMBIGUOUS]
  app/pending.txt · relation: references
- `general_data.os_section (commented reference)` → `OSSection`  [AMBIGUOUS]
  app/pending.txt · relation: references

## Knowledge Gaps
- **56 isolated node(s):** `HeaderProps`, `PageProps`, `TailwindUtility`, `Theme`, `ThemeToken` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 79 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `general_data.ia_array (commented reference)` and `IASection`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `general_data.ia_array (commented reference)` and `OSSection`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `general_data.ia_section (commented reference)` and `IASection`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `general_data.os_section (commented reference)` and `OSSection`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `Button()` connect `components.ts` to `Animations.tsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `getSiteData()` connect `Animations.tsx` to `schemas.ts`, `types/types.ts`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `HeaderProps`, `PageProps`, `TailwindUtility` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._