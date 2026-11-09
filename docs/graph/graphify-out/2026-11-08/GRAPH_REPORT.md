# Graph Report - graph  (2026-11-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 277 nodes · 569 edges · 13 communities (11 shown, 2 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 32 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fe836e67`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- schemas.ts
- Animations.tsx
- types/types.ts
- icon-registry.ts
- skeletonindex.tsx
- IconRender.tsx
- components/types.ts
- components.ts
- ProjectCardProps
- theming.v2.ts
- AboutMeSection
- IASection
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
9. `ProjectCard()` - 5 edges
10. `SkeletonPulse()` - 5 edges

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
- **Projects Section Rendering Flow** — app_pending_section_reveal, app_pending_os_section, app_pending_ia_section, app_pending_general_data, app_pending_current_lang [EXTRACTED 0.95]

## Communities (13 total, 2 thin omitted)

### Community 0 - "schemas.ts"
Cohesion: 0.09
Nodes (30): AboutMeContent, AboutMeContentSchema, AboutMeMetadataSchema, ContactContentSchema, ContactItemSchema, ContactList, ContactListSchema, ContactSectionMetadata (+22 more)

### Community 1 - "Animations.tsx"
Cohesion: 0.09
Nodes (32): Home(), PageProps, easeOut, EyebrowReveal(), PopReveal(), SectionReveal(), sectionVariants, SlideReveal() (+24 more)

### Community 2 - "types/types.ts"
Cohesion: 0.08
Nodes (22): emailJsEnv, ensure(), MissingEnvError, supabaseEnv, createClient(), CompositeTypes, Constants, Database (+14 more)

### Community 3 - "icon-registry.ts"
Cohesion: 0.13
Nodes (26): IconComponent, IconNameSchema, AlertCircleIcon(), DayAndNightIcon(), DockerIcon(), FigmaIcon(), FramerIcon(), GitHubIcon() (+18 more)

### Community 4 - "skeletonindex.tsx"
Cohesion: 0.24
Nodes (5): FormularySkeleton(), NavBarSkeleton(), ProjectCardSkeleton(), SkeletonPulse(), TecnologiesCardSkeleton()

### Community 5 - "IconRender.tsx"
Cohesion: 0.27
Nodes (7): IconRender(), ButtonProps, IconRendererProps, LinkButtonProps, TecnologiesConfig, ICON_REGISTRY, IconKey

### Community 6 - "components/types.ts"
Cohesion: 0.08
Nodes (30): AboutMeMetadata, Contact, ContactContent, ContactSection, FooterContent, FooterSection, Form, HeroContent (+22 more)

### Community 7 - "components.ts"
Cohesion: 0.07
Nodes (23): LoadingDots(), Button(), LanguageToggle(), Span(), ThemeSwitcher(), ThemeToggle(), Title4(), Theme (+15 more)

### Community 8 - "ProjectCardProps"
Cohesion: 0.67
Nodes (3): ProjectItem, ProjectsMetadata, ProjectCardProps

### Community 9 - "theming.v2.ts"
Cohesion: 0.14
Nodes (12): geistMono, geistSans, metadata, BackgroundFX(), ThemeProvider(), ALL_TAILWIND_UTILITIES, NOTE: Este archivo existe únicamente para integrar globals.css dentro del grafo…, TailwindUtility (+4 more)

### Community 11 - "IASection"
Cohesion: 0.70
Nodes (5): currentLang, general_data, IASection, OSSection, SectionReveal

## Knowledge Gaps
- **51 isolated node(s):** `ContactList`, `ContactSectionMetadata`, `GeneralContacts`, `GeneralData`, `GeneralThemes` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 71 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `components.ts` to `Animations.tsx`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `getSiteData()` connect `Animations.tsx` to `schemas.ts`, `types/types.ts`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `ContactList`, `ContactSectionMetadata`, `GeneralContacts` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `schemas.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08870967741935484 - nodes in this community are weakly interconnected._
- **Should `Animations.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0858843537414966 - nodes in this community are weakly interconnected._
- **Should `types/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._
- **Should `icon-registry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12561576354679804 - nodes in this community are weakly interconnected._