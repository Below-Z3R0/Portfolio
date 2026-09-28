# Graph Report - graph  (2026-09-06)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 261 nodes · 475 edges · 16 communities (11 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.83)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `12f18660`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- components/types.ts
- page.tsx
- components.ts
- icon-registry.ts
- loading.tsx
- Formulary.tsx
- layout.tsx
- React Icon Symbol
- IconRender.tsx
- Button.tsx
- ErrorPage.tsx
- Day/Night Toggle Icon Symbol
- Docker Icon Symbol
- LinkedIn Icon Symbol
- PostgreSQL Icon Symbol

## God Nodes (most connected - your core abstractions)
1. `Button()` - 10 edges
2. `Paragraph()` - 7 edges
3. `Title4()` - 7 edges
4. `getGeneralData()` - 6 edges
5. `Title3()` - 5 edges
6. `useTheme()` - 5 edges
7. `SkeletonPulse()` - 5 edges
8. `LinkButton()` - 5 edges
9. `NavBarProps` - 4 edges
10. `ProjectCardProps` - 4 edges

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
- **Portfolio Tech Stack Skill Icons** — services_assets_sprite_next_symbol, services_assets_sprite_react_symbol, services_assets_sprite_typescript_symbol, services_assets_sprite_tailwind_symbol, services_assets_sprite_node_symbol, services_assets_sprite_docker_symbol, services_assets_sprite_supabase_symbol, services_assets_sprite_postgressql_symbol, services_assets_sprite_git_symbol, services_assets_sprite_github_symbol, services_assets_sprite_html5_symbol, services_assets_sprite_figma_symbol [EXTRACTED 1.00]
- **UI Navigation and Theming Icons** — services_assets_sprite_daynight_symbol, services_assets_sprite_hamburnav_symbol, services_assets_sprite_language_symbol [EXTRACTED 1.00]
- **Contact Channel UI Icons** — services_assets_sprite_mail_symbol, services_assets_sprite_linkedin_symbol [INFERRED 0.85]

## Communities (16 total, 4 thin omitted)

### Community 0 - "components/types.ts"
Cohesion: 0.05
Nodes (57): AboutMeContent, AboutMeContentSchema, AboutMeMetadata, AboutMeMetadataSchema, AboutMeSection, Contact, ContactContent, ContactContentSchema (+49 more)

### Community 1 - "page.tsx"
Cohesion: 0.06
Nodes (33): Home(), PageProps, FadeUp(), Footer(), HeroSection(), SkillsSection(), ContactItemSchema, CONTENT_SCHEMAS (+25 more)

### Community 2 - "components.ts"
Cohesion: 0.09
Nodes (27): ease, easeOut, ExpandLine(), loadingDot, MiniTitleAnimation(), PopIn(), Pulse(), SlideInLeft() (+19 more)

### Community 3 - "icon-registry.ts"
Cohesion: 0.09
Nodes (31): LanguageToggle(), ThemeOption, ThemeSwitcher(), ThemeSwitcherProps, ThemeToggle(), Theme, ThemeData, useTheme() (+23 more)

### Community 4 - "loading.tsx"
Cohesion: 0.24
Nodes (5): FormularySkeleton(), NavBarSkeleton(), ProjectCardSkeleton(), SkeletonPulse(), TecnologiesCardSkeleton()

### Community 5 - "Formulary.tsx"
Cohesion: 0.20
Nodes (7): LoadingDots(), Button(), ErrorMessage(), SuccessMessage(), ErrorMessageProps, FormStatus, SuccessMessageProps

### Community 6 - "layout.tsx"
Cohesion: 0.28
Nodes (5): geistMono, geistSans, metadata, BackgroundFX(), ThemeProvider()

### Community 7 - "React Icon Symbol"
Cohesion: 0.25
Nodes (8): Figma Icon Symbol, Git Icon Symbol, GitHub Icon Symbol, HTML5 Icon Symbol, Next.js Icon Symbol, React Icon Symbol, Tailwind CSS Icon Symbol, TypeScript Icon Symbol

### Community 8 - "IconRender.tsx"
Cohesion: 0.33
Nodes (5): IconRender(), TecnologiesCard(), IconRendererProps, TecnologiesConfig, ICON_REGISTRY

### Community 9 - "Button.tsx"
Cohesion: 0.40
Nodes (4): LinkButton(), Span(), ButtonProps, LinkButtonProps

### Community 11 - "Day/Night Toggle Icon Symbol"
Cohesion: 0.67
Nodes (3): Day/Night Toggle Icon Symbol, Hamburger Nav Icon Symbol, Language Selector Icon Symbol

## Knowledge Gaps
- **65 isolated node(s):** `ContactList`, `ContactSectionMetadata`, `ProjectBlock`, `SectionBlock`, `FieldConfig` (+60 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 78 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BackgroundFX()` connect `layout.tsx` to `page.tsx`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **Why does `Button()` connect `Formulary.tsx` to `Button.tsx`, `components.ts`, `icon-registry.ts`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `ContactList`, `ContactSectionMetadata`, `ProjectBlock` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `components/types.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.053005464480874315 - nodes in this community are weakly interconnected._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06312292358803986 - nodes in this community are weakly interconnected._
- **Should `components.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.08637873754152824 - nodes in this community are weakly interconnected._
- **Should `icon-registry.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.09041835357624832 - nodes in this community are weakly interconnected._