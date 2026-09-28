# Graph Report - graph  (2026-09-09)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 261 nodes · 478 edges · 9 communities
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 20 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12f18660`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/types.ts
- components.ts
- newideas(testing..)/icon-registry.ts
- generaldata.service.ts
- Animations.tsx
- Icon Sprite (Portfolio-v2)
- loading.tsx
- layout.tsx

## God Nodes (most connected - your core abstractions)
1. `Icon Sprite (Portfolio-v2)` - 18 edges
2. `Button()` - 11 edges
3. `Paragraph()` - 9 edges
4. `Title4()` - 7 edges
5. `LinkButton()` - 6 edges
6. `getGeneralData()` - 6 edges
7. `Title3()` - 5 edges
8. `useTheme()` - 5 edges
9. `SkeletonPulse()` - 5 edges
10. `NavBarProps` - 4 edges

## Surprising Connections (you probably didn't know these)
- `Home()` --calls--> `getGeneralData()`  [EXTRACTED]
  app/page.tsx → services/generaldata.service.ts
- `ThemeToggle()` --calls--> `useTheme()`  [EXTRACTED]
  components/atoms/ThemeToggle.tsx → components/hooks/useTheme.tsx
- `AboutMeSectionProps` --references--> `AboutMeSection`  [EXTRACTED]
  components/types.ts → components/schemas.ts
- `ContactSectionProps` --references--> `ContactSection`  [EXTRACTED]
  components/types.ts → components/schemas.ts
- `FooterProps` --references--> `FooterSection`  [EXTRACTED]
  components/types.ts → components/schemas.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Portfolio-v2 Tech Icons (own colors, viewBox 0 0 128 128)** — services_assets_newideas_testing__sprite_next, services_assets_newideas_testing__sprite_git, services_assets_newideas_testing__sprite_docker, services_assets_newideas_testing__sprite_github, services_assets_newideas_testing__sprite_html5, services_assets_newideas_testing__sprite_figma, services_assets_newideas_testing__sprite_node, services_assets_newideas_testing__sprite_react, services_assets_newideas_testing__sprite_supabase, services_assets_newideas_testing__sprite_tailwind, services_assets_newideas_testing__sprite_typescript, services_assets_newideas_testing__sprite_postgressql [EXTRACTED 1.00]
- **Portfolio-v2 UI Icons (currentColor, viewBox 0 0 24 24 by convention)** — services_assets_newideas_testing__sprite_daynight, services_assets_newideas_testing__sprite_mail, services_assets_newideas_testing__sprite_linkedin, services_assets_newideas_testing__sprite_language, services_assets_newideas_testing__sprite_hamburnav [EXTRACTED 1.00]

## Communities (9 total, 0 thin omitted)

### Community 0 - "components/types.ts"
Cohesion: 0.05
Nodes (60): AboutMeContent, AboutMeContentSchema, AboutMeMetadata, AboutMeMetadataSchema, AboutMeSection, Contact, ContactContent, ContactContentSchema (+52 more)

### Community 1 - "components.ts"
Cohesion: 0.07
Nodes (27): EyebrowReveal(), LoadingDots(), SlideReveal(), Button(), LinkButton(), Paragraph(), Span(), Title2() (+19 more)

### Community 2 - "newideas(testing..)/icon-registry.ts"
Cohesion: 0.08
Nodes (33): LanguageToggle(), ThemeOption, ThemeSwitcher(), ThemeSwitcherProps, ThemeToggle(), Theme, ThemeData, useTheme() (+25 more)

### Community 3 - "generaldata.service.ts"
Cohesion: 0.07
Nodes (30): Home(), PageProps, ContactSectionMetadata, CONTENT_SCHEMAS, GeneralContactsSchema, GeneralData, METADATA_SCHEMAS, PROJECT_ITEM_SCHEMA (+22 more)

### Community 4 - "Animations.tsx"
Cohesion: 0.13
Nodes (13): easeOut, PopReveal(), SectionReveal(), sectionVariants, spring, staggerContainerVariants, StaggerGroup(), StaggerItem() (+5 more)

### Community 5 - "Icon Sprite (Portfolio-v2)"
Cohesion: 0.12
Nodes (19): Portfolio-v2, Icon Sprite (Portfolio-v2), Day/Night Theme Icon, Docker Icon, Figma Icon, Git Icon, GitHub Icon, Hamburger Nav Icon (truncated) (+11 more)

### Community 6 - "loading.tsx"
Cohesion: 0.24
Nodes (5): FormularySkeleton(), NavBarSkeleton(), ProjectCardSkeleton(), SkeletonPulse(), TecnologiesCardSkeleton()

### Community 7 - "layout.tsx"
Cohesion: 0.28
Nodes (5): geistMono, geistSans, metadata, BackgroundFX(), ThemeProvider()

## Knowledge Gaps
- **70 isolated node(s):** `ContactList`, `GeneralContacts`, `GeneralThemes`, `ProjectBlock`, `FieldConfig` (+65 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 84 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `components.ts` to `newideas(testing..)/icon-registry.ts`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **Why does `BackgroundFX()` connect `layout.tsx` to `generaldata.service.ts`?**
  _High betweenness centrality (0.006) - this node is a cross-community bridge._
- **What connects `ContactList`, `GeneralContacts`, `GeneralThemes` to the rest of the system?**
  _70 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.05129561078794289 - nodes in this community are weakly interconnected._
- **Should `components.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.06857142857142857 - nodes in this community are weakly interconnected._
- **Should `newideas(testing..)/icon-registry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07973421926910298 - nodes in this community are weakly interconnected._
- **Should `generaldata.service.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07152496626180836 - nodes in this community are weakly interconnected._