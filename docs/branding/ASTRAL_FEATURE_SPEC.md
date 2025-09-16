# Astral Notes — Feature Audit, Astral Naming, and Specifications

| Feature (Existing/Planned) | Proposed Astral Names | Rationale | Status (Complete/Upgrade/Not Implemented) |
| --- | --- | --- | --- |
| Advanced Manuscript Editor (Existing) | Stellar Scribe (existing alt), Astral Atelier, Nebula Quill | Celestial writing studio; poetic cosmic quill | Upgrade |
| Focus Mode (Existing) | Nebula Focus, Event Horizon, Silent Orbit | Deep focus metaphors with cosmic calm | Upgrade |
| Voice-to-Text (Existing) | Astral Voice (existing), Comet Dictation, Orion Speak | Fast capture; constellation-themed | Upgrade |
| AI Writing Assistant (Existing) | Cosmic Insights (existing), Nebula Muse, Quasar Mentor | Guidance and inspiration imagery | Upgrade |
| Style Analysis Panel (Existing) | Prism Analyzer, Spectral Stylist, Lumen Gauge | Prism/spectrum metaphors | Upgrade |
| Writing Stats & Sessions (Existing) | Orbit Tracker, Stellar Pulse, ChronoScribe Metrics | Cycles and rhythm of writing | Upgrade |
| Manuscript Outliner (Existing) | Constellation Outliner, Celestial Spine, Starpath Navigator | Structure as constellations | Upgrade |
| Scene Navigation & Status (Existing) | Stellar Waypoints, Scene Orbits, Lumina Status | Navigational markers and orbits | Upgrade |
| Templates System (Existing) | Astral Templates, Nebula Blueprints, Stellar Schematics | Creative plans and patterns | Upgrade |
| Plotboard (Existing) | Constellation Map (existing), Starweave Board, Galaxy Grid | Plot as star clusters | Complete |
| Timelines (Existing/Partial UI) | Temporal Nexus (existing), ChronoSpiral, Orbital Chronology | Diverse time visualizations | Upgrade |
| Character Arc Visualization (Existing) | Arc Orbits, Persona Trajectories, Stellar Arc Map | Arcs as orbital paths | Upgrade |
| Wiki-Style Links [[...]] (Partial) | Quantum Links, Starlinks, Gravitas Links | Instant jumps; cosmic links | Upgrade |
| Backlinks Panel (Existing) | Echo Constellations, Backtrail Stars, Return Vector | Reverse references as echoes | Upgrade |
| Link Preview on Hover (Existing) | Starlight Glimpse, Nebula Peek, Astral Snapshot | Quick luminous preview | Complete |
| Dead Link Detection (Planned) | Void Detector, Dark Matter Scan, Broken Orbit Finder | Missing targets as voids | Not Implemented |
| Link Graph Visualization (Planned) | Starfield Graph, Celestial Web, AsterNet | Interconnected cosmic web | Not Implemented |
| Characters (Existing) | Stellar Beings (existing), Astral Personas, Starborn Profiles | Mythic character framing | Complete |
| Locations (Existing) | Cosmic Realms (existing), Celestial Realms, Orbital Locales | Place/world theming | Complete |
| Relationship Mapping (Existing) | Gravity Map, Nexus Web, Orbit Matrix | Forces and mapped relations | Upgrade |
| Worldbuilding Hub (Existing) | Astral Forge, Cosmosmith, Nebula Foundry | World creation workshop | Upgrade |
| Geography Module (Existing) | Starcartography | Stellar mapping | Upgrade |
| Cultures Module (Existing) | EthnoConstellations | Cultural constellations | Upgrade |
| Technology Module (Existing) | TechnoCosmos | Tech in cosmic framing | Upgrade |
| Religions Module (Existing) | Celestial Pantheons | Belief systems | Upgrade |
| Political Systems Module (Existing) | Orbital Polities | Orbital governance | Upgrade |
| Magic Systems Module (Existing) | Arcanum Nebula | Mystical nebula | Upgrade |
| Research Hub & Notepad (Existing) | Lore Observatory, Celestial Archive, Starlog Lab | Repository of insights | Upgrade |
| Knowledge Graph (Existing) | Astral Knowledge Graph, Lumen Graph, Constellation Knowledge | Illuminated knowledge | Upgrade |
| Inspiration Board (Existing) | Aurora Board, Muse Constellation, Spark Nebula | Ideation visuals | Upgrade |
| Fact Checker (Existing) | Polaris Check, Veracity Comet, Stellar Proof | Truth and guidance | Upgrade |
| Analytics Dashboard (Existing) | Prism Analytics (existing), Spectral Metrics, Luma Analytics | Clarity and spectrum | Complete |
| Writing Goals & Streaks (Existing) | Trajectory Goals, Star Streaks, Orbit Goals | Course toward targets | Upgrade |
| Pacing & Readability (Existing/Partial) | Tension Curve, Velocity Gauge, Luminosity Readability | Narrative speed/clarity | Upgrade |
| Real-time Collaboration (Existing) | Stellar Room, Astral Council, Constellation Studio | Co-creation framed cosmically | Upgrade |
| Comments & Suggestions (Existing) | Starlit Comments, Nebula Notes, Aurora Suggestions | Themed review | Upgrade |
| Version History (Existing) | Time Capsule, Chronicle Vault, Temporal Ledger | Preserved change states | Upgrade |
| Comparison View (Existing) | Parallel Dimensions (existing), Mirror Nebula, Dual Orbits | Side-by-side metaphors | Complete |
| Export/Publishing Hub (Existing) | Launch Sequence (existing), Stellar Press, Comet Courier | Publishing/launch metaphors | Complete |
| Export Engine (Existing) | Astral Exporter, Nebula Formatter, Quasar Converter | Transform/format | Complete |
| Backup & Restore (Existing) | Cosmic Archive (existing), Stasis Vault, Starvault | Safe storage | Complete |
| Sync (Existing) | Quantum Sync (existing), Stellar Sync, Orbit Sync | Fast synchronization | Complete |
| Authentication (Existing) | Starlight Gate, Cosmic Keyring, Nebula Pass | Access metaphors | Upgrade |
| Dashboard (Existing) | Cosmic Dashboard (existing), Astral Console, Stellar Bridge | Control center | Complete |
| Navigation Sidebar (Existing) | Starboard, Celestial Rail, Orbit Bar | Themed navigation | Complete |
| Typography Controller (Existing) | Lumen Typeforge, Astral Glyphs, Cosmos Typeflow | Type and light | Upgrade |
| Layout Engine (Existing) | Starframe Layout, Celestial Grid, Nebula Flow | Page composition | Upgrade |
| Template Designer (Existing) | Constellation Designer, Stellar Mold, Astral Patterning | Design templates | Upgrade |
| Research Timeline (Existing) | Loreline, Insight Orbit, ChronoLab | Time-bound research | Upgrade |
| Character Timeline (Existing) | Persona Timeline, Orbitline, Stellar Lifeline | Character arcs over time | Upgrade |
| Link Auto-Complete (Existing) | Starhint, AsterSuggest, Nebula Prompt | Smart link suggestions | Upgrade |
| Error Handling & Toasts (Existing) | Cosmic Toasts, Starlight Notices, Solar Flares | Feedback metaphors | Upgrade |
| Keyboard Shortcuts (Existing) | Warp Keys, Stellar Hotkeys, Comet Keys | Speedy actions | Upgrade |

---

## Feature Design & Specification (Selected Highlights)

Each entry includes purpose, UX integration, branding microcopy, and data/API considerations.

### Stellar Scribe (Advanced Manuscript Editor)
- Purpose: Professional writing interface with rich editing, stats, and AI support.
- UX Integration:
  - Sidebar: under project context, labeled “Stellar Notes” for notes, and editor surfaces inside Scenes and Stories.
  - Icons: `StellarQuill` primary; `NebulaEye` for Nebula Focus; `AstralVoice` for voice input; `CosmicSparkles` for AI.
  - Onboarding: “Welcome to Stellar Scribe — weave your narrative among the stars.”
  - Tooltips: “Toggle Nebula Focus,” “Invoke Cosmic Insights,” “Start Astral Voice dictation.”
- Data/API:
  - Uses existing `stories`, `scenes`, and version endpoints; no rename needed.
  - Add `astralBranding` copy via `client/src/astral/astralBranding.ts` (central labels).
- Code Updates:
  - Ensure editor headers reference “Stellar Scribe”.
  - Keep `AdvancedManuscriptEditor` filename; brand in UI strings only (no breaking changes).

### Constellation Map (Plotboard)
- Purpose: Visual story planning with nodes, groups, and connections.
- UX Integration:
  - Sidebar: “Constellation Map” within project.
  - Icons: `ConstellationStar` (nodes), `StellarNetwork` (connections), `CosmicLayers` (groups).
  - Microcopy: “Create a new star to mark a major plot point.”
- Data/API:
  - Uses existing plotboard endpoints; keep schema; consider optional `type: 'star'|'planet'|...` metadata.
- Code Updates:
  - Confirm page title and buttons reflect “Constellation Map.”

### Temporal Nexus (Timelines)
- Purpose: Provide linear/spiral/orbital views to explore chronology vs narrative order.
- UX Integration:
  - Sidebar: “Temporal Nexus.”
  - Icons: `TemporalClock`, `ChronosTimer`, `TimeVortex`.
  - Microcopy: “Navigate temporal threads to resolve conflicts in order.”
- Data/API:
  - Backed by `timelines` and `timeline entries` routes.
  - View mode state in client only; store as UI preference.
- Code Updates:
  - Add a `viewMode` control reflecting ‘linear | spiral | orbital’ in the Timelines page.

### Quantum Links (Wiki-Style Linking)
- Purpose: Link any entity using [[Title]] with autocomplete, backlinking, preview, dead-link creation.
- UX Integration:
  - Editor: `WikiLinkExtension` with Starhint autocomplete UI.
  - Backlinks panel: “Echo Constellations.”
  - Hover preview: “Starlight Glimpse.”
- Data/API:
  - Existing `links` model and routes; enhance link service for fuzzy matches and dead-link creation (draft entity).
- Code Updates:
  - Ensure `LinkPreview`, `BacklinkPanel`, `LinkAutoComplete` use Astral copy from constants.

### Prism Analytics (Analytics Dashboard)
- Purpose: Provide macro and micro analytics for manuscripts.
- UX Integration:
  - Sidebar: “Prism Analytics.”
  - Icons: `GalaxyChart`.
  - Microcopy: “Refract your story into insights.”
- Data/API:
  - Uses `/api/analytics/*` endpoints as-is.

### Launch Sequence (Publishing)
- Purpose: Prepare, format, and distribute manuscripts.
- UX Integration:
  - Sidebar: “Launch Sequence.”
  - Icons: `LaunchRocket`.
  - Microcopy: “Initiate preflight checks and launch to your destination.”
- Data/API:
  - Uses existing export endpoints; consider `formatProfileId` for named export presets.

### Cosmic Archive (Backup)
- Purpose: Backup/restore and manage snapshots.
- UX Integration: Sidebar: “Cosmic Archive.”
- Data/API: Uses backup routes; no rename.

### Stellar Beings (Characters) / Cosmic Realms (Locations)
- Purpose: Manage people and places with timelines and relationships.
- UX Integration: Sidebar labels already Astral.
- Data/API: Existing routes; consider adding `displayColor` or `sigil` for themed UI.

---

## Modular Code Architecture

- Folder Structure (existing + recommended):
  - `client/src/components/stellar-scribe/` — editor wrappers (brand-facing), export editor shell.
  - `client/src/components/constellation-map/` — plotboard visuals.
  - `client/src/components/temporal-nexus/` — timeline visuals.
  - `client/src/astral/` — branding constants and helpers (ADDED: `astralBranding.ts`).
  - `client/src/components/ui/` — icons, buttons; keep brand variants.
  - `client/src/components/links/` — link preview, backlink panel; ensure Astral copy usage.

- Exports & Symbols:
  - `astralBranding.ts`: `ASTRAL_LABELS`, `NAV_PRESETS`, `astralLabel`.
  - Add barrel exports in each module directory (`index.ts`) referencing Astral names in docs, not filenames.

- Interfaces/Hooks/Context:
  - `useAstralLabels()` hook (future): simple wrapper over constants to enable i18n later.
  - `AstralThemeContext` (existing ThemeContext OK): ensure cosmic variants available in tokens.

---

## Upgrade, Refactor, or Implement

Completed in this pass:
- Added `client/src/astral/astralBranding.ts` central labels and nav presets.
- Updated `NavigationSidebar` to source labels/icons from `NAV_PRESETS` (no UI change; prevents duplication).
- Created this specification and the feature audit table.

Recommended next changes (non-breaking; small PRs):
- Update headings/microcopy in pages to reference Astral names (e.g., editor header “Stellar Scribe”).
- Timelines: add `viewMode` control with ‘linear | spiral | orbital’ labels.
- Link system: ensure autocomplete UI copy uses “Starhint” and hover card title “Starlight Glimpse”.
- Worldbuilding: section headers use Astral module names (e.g., “Arcanum Nebula”).

Testing (stubs added):
- `client/src/__tests__/astral/astral-branding.spec.ts` asserts nav uses `ASTRAL_LABELS`.

---

## Review, Docs & Developer Experience

- Modules & UX surfaces:
  - Constellation Map — Pages: `plotboard/PlotboardPage.tsx`; Components: `constellation-map/*`; Nav label centralized.
  - Temporal Nexus — Pages: `timelines/TimelinesPage.tsx`; Components: `timeline/*` and `temporal-nexus/*`.
  - Stellar Scribe — Components: `editor/*`; integrate branding via headers/tooltips.
  - Prism Analytics — Page: `analysis/AnalysisPage.tsx`.
  - Launch Sequence — Page: `publishing/PublishingPage.tsx`.
  - Cosmic Archive — Page: `backup/BackupPage.tsx`.
  - Parallel Dimensions — Page: `comparison/ComparisonPage.tsx`.

- Documentation locations:
  - Branding audit: `docs/branding/FEATURE_AUDIT_AND_NAMING.md`
  - This spec: `docs/branding/ASTRAL_FEATURE_SPEC.md`
  - Changelog: `docs/branding/ASTRAL_CHANGELOG.md`

- Onboarding snippets/tooltips:
  - “Create your first star in the Constellation Map.”
  - “Switch view in the Temporal Nexus: linear, spiral, or orbital.”
  - “Use [[ to open Starhint and link anything with Quantum Links.”
  - “Open Prism Analytics to refract your story into insights.”

