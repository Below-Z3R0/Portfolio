# Graph Report - graph  (2026-10-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 266 nodes · 552 edges · 18 communities (10 shown, 7 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.77)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `d4a3a484`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components.ts
- Animations.tsx
- generaldata.service.ts
- components/types.ts
- schemas.ts
- icon-registry.ts
- theming.v2.ts
- skeletonindex.tsx
- IconRender.tsx
- ProjectCardProps
- AboutMeSection
- FooterSection
- Form
- HeroSection
- ModalContent
- NavBarProps
- SkillsSection

## God Nodes (most connected - your core abstractions)
1. `Button()` - 12 edges
2. `Paragraph()` - 12 edges
3. `Title2()` - 11 edges
4. `Title3()` - 9 edges
5. `LinkButton()` - 7 edges
6. `ProjectsSectionProps` - 6 edges
7. `EyebrowReveal()` - 6 edges
8. `Title4()` - 6 edges
9. `getGeneralData()` - 6 edges
10. `TitleProps` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --calls--> `getGeneralData()`  [EXTRACTED]
  app/page.tsx → services/generaldata.service.ts
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

## Communities (18 total, 7 thin omitted)

### Community 0 - "components.ts"
Cohesion: 0.07
Nodes (22): LoadingDots(), Button(), LanguageToggle(), Span(), ThemeSwitcher(), ThemeToggle(), Theme, ThemeData (+14 more)

### Community 1 - "Animations.tsx"
Cohesion: 0.10
Nodes (30): PageProps, easeOut, EyebrowReveal(), PopReveal(), SectionReveal(), sectionVariants, SlideReveal(), spring (+22 more)

### Community 2 - "generaldata.service.ts"
Cohesion: 0.07
Nodes (29): Home(), ContactSectionMetadata, CONTENT_SCHEMAS, GeneralContactsSchema, GeneralData, METADATA_SCHEMAS, PROJECT_ITEM_SCHEMA, PROJECT_METADATA_SCHEMA (+21 more)

### Community 3 - "components/types.ts"
Cohesion: 0.10
Nodes (23): AboutMeMetadata, ContactContent, ContactSection, FooterContent, HeroContent, HeroMetadata, NavbarContent, ProjectsContent (+15 more)

### Community 4 - "schemas.ts"
Cohesion: 0.08
Nodes (24): AboutMeContent, AboutMeContentSchema, AboutMeMetadataSchema, Contact, ContactContentSchema, ContactItemSchema, ContactList, ContactListSchema (+16 more)

### Community 5 - "icon-registry.ts"
Cohesion: 0.15
Nodes (23): IconComponent, IconNameSchema, AlertCircleIcon(), DayAndNightIcon(), DockerIcon(), FigmaIcon(), GitHubIcon(), GitIcon() (+15 more)

### Community 6 - "theming.v2.ts"
Cohesion: 0.14
Nodes (12): geistMono, geistSans, metadata, BackgroundFX(), ThemeProvider(), ALL_TAILWIND_UTILITIES, NOTE: Este archivo existe únicamente para integrar globals.css dentro del grafo…, TailwindUtility (+4 more)

### Community 7 - "skeletonindex.tsx"
Cohesion: 0.24
Nodes (5): FormularySkeleton(), NavBarSkeleton(), ProjectCardSkeleton(), SkeletonPulse(), TecnologiesCardSkeleton()

### Community 8 - "IconRender.tsx"
Cohesion: 0.27
Nodes (7): IconRender(), ButtonProps, IconRendererProps, LinkButtonProps, TecnologiesConfig, ICON_REGISTRY, IconKey

### Community 9 - "ProjectCardProps"
Cohesion: 0.67
Nodes (3): ProjectItem, ProjectsMetadata, ProjectCardProps

## Knowledge Gaps
- **58 isolated node(s):** `HeaderProps`, `PageProps`, `CompositeTypes`, `DatabaseWithoutInternals`, `DefaultSchema` (+53 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 74 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **7 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `components.ts` to `Animations.tsx`, `components/types.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `getGeneralData()` connect `generaldata.service.ts` to `Animations.tsx`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `HeaderProps`, `PageProps`, `CompositeTypes` to the rest of the system?**
  _58 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07272727272727272 - nodes in this community are weakly interconnected._
- **Should `Animations.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.10101010101010101 - nodes in this community are weakly interconnected._
- **Should `generaldata.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07357357357357357 - nodes in this community are weakly interconnected._
- **Should `components/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09666666666666666 - nodes in this community are weakly interconnected._