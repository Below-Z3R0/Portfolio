# Graph Report - graph  (2026-11-08)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 276 nodes · 561 edges · 12 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 23 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `fe836e67`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/types.ts
- components.ts
- types/types.ts
- icon-registry.ts
- skeletonindex.tsx
- IconRender.tsx
- page.tsx
- NavBar.tsx
- Formulary.tsx
- layout.tsx
- theming.v2.ts
- IASection

## God Nodes (most connected - your core abstractions)
1. `Button()` - 12 edges
2. `Paragraph()` - 12 edges
3. `Title2()` - 11 edges
4. `Title3()` - 8 edges
5. `ProjectsSectionProps` - 6 edges
6. `EyebrowReveal()` - 6 edges
7. `LinkButton()` - 6 edges
8. `TitleProps` - 5 edges
9. `SkeletonPulse()` - 5 edges
10. `Title4()` - 5 edges

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

## Communities (12 total, 0 thin omitted)

### Community 0 - "components/types.ts"
Cohesion: 0.05
Nodes (65): AboutMeContent, AboutMeContentSchema, AboutMeMetadata, AboutMeMetadataSchema, AboutMeSection, Contact, ContactContent, ContactContentSchema (+57 more)

### Community 1 - "components.ts"
Cohesion: 0.08
Nodes (25): easeOut, EyebrowReveal(), PopReveal(), sectionVariants, SlideReveal(), spring, staggerContainerVariants, StaggerGroup() (+17 more)

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
Cohesion: 0.16
Nodes (12): IconRender(), LinkButton(), Span(), Title4(), ButtonProps, IconRendererProps, LinkButtonProps, SpanProps (+4 more)

### Community 6 - "page.tsx"
Cohesion: 0.16
Nodes (11): Home(), PageProps, SectionReveal(), Formulary(), AboutMeSection(), ContactSection(), Footer(), ProjectsSection() (+3 more)

### Community 7 - "NavBar.tsx"
Cohesion: 0.24
Nodes (8): ThemeSwitcher(), ThemeToggle(), Theme, ThemeData, useTheme(), NavBar(), Header(), HeaderProps

### Community 8 - "Formulary.tsx"
Cohesion: 0.17
Nodes (8): LoadingDots(), ErrorMessage(), SuccessMessage(), SendEmail, SendEmailSchema, ErrorMessageProps, FormStatus, SuccessMessageProps

### Community 9 - "layout.tsx"
Cohesion: 0.24
Nodes (6): geistMono, geistSans, metadata, BackgroundFX(), ThemeProvider(), NoiseTexture()

### Community 10 - "theming.v2.ts"
Cohesion: 0.29
Nodes (6): ALL_TAILWIND_UTILITIES, NOTE: Este archivo existe únicamente para integrar globals.css dentro del grafo…, TailwindUtility, Theme, ThemeToken, themingConventions

### Community 11 - "IASection"
Cohesion: 0.70
Nodes (5): currentLang, general_data, IASection, OSSection, SectionReveal

## Knowledge Gaps
- **51 isolated node(s):** `ContactList`, `ContactSectionMetadata`, `GeneralContacts`, `GeneralData`, `GeneralThemes` (+46 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 70 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `components.ts` to `Formulary.tsx`, `IconRender.tsx`, `NavBar.tsx`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `getSiteData()` connect `page.tsx` to `components/types.ts`, `types/types.ts`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **What connects `ContactList`, `ContactSectionMetadata`, `GeneralContacts` to the rest of the system?**
  _51 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05004389815627744 - nodes in this community are weakly interconnected._
- **Should `components.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08295625942684766 - nodes in this community are weakly interconnected._
- **Should `types/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07862903225806452 - nodes in this community are weakly interconnected._
- **Should `icon-registry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.12561576354679804 - nodes in this community are weakly interconnected._