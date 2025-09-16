# Astral Branding QA Checklist

Use this checklist to verify Astral branding consistency across the app. All strings are UI-only; no API/schema renames.

- Global Navigation
  - Sidebar labels use centralized constants: Cosmic Dashboard, Stellar Projects, Stellar Notes, Temporal Nexus, Constellation Map, Prism Analytics, Launch Sequence, Cosmic Archive, Parallel Dimensions, Quantum Sync.

- Editor (Stellar Scribe)
  - Toolbar tooltips: Nebula Focus, Astral Voice, Stellar Pulse, Prism Analyzer, Cosmic Insights, Constellation Outliner.
  - Status bar and headers do not refer to generic names.

- Plotboard (Constellation Map)
  - Header shows Constellation Map and cosmic subheading.
  - Empty state uses “Create your first star…”
  - Links toggle reads “Show/Hide Echoes”.

- Timelines (Temporal Nexus)
  - Header shows Temporal Nexus; description references temporal threads.
  - Analyze button says “Run Temporal Analysis”.

- Analytics (Prism Analytics)
  - Page header and microcopy present.

- Publishing (Launch Sequence)
  - Page header and microcopy present.

- Backup (Cosmic Archive)
  - Page header and component header updated; main action reads “Create Snapshot”.

- Comparison (Parallel Dimensions)
  - Page header and component header updated; main action reads “Compare Drafts”.

- Notes (Stellar Notes)
  - Page header reflects Stellar Notes (contextual to project/story where applicable).

- Characters & Locations
  - Characters header: Stellar Beings; Locations header: Cosmic Realms.
  - Empty states use Astral phrasing.

- Goals (Orbital Objectives)
  - Section header with icon appears above hub.

- Worldbuilding Hub
  - Module names: EthnoConstellations, Celestial Pantheons, Arcanum Nebula, Orbital Polities, Starcartography, TechnoCosmos, Conlang Workshop, World Timeline, Cosmic Consistency.

- Links System
  - Hover preview uses “Starlight Glimpse”.
  - Backlinks panel title “Echo Constellations”; tabs “Incoming/Outgoing”; refresh tooltip “Refresh echoes”.
  - Autocomplete branded “Starhint” with loading/empty microcopy.

- Docs & Changelog
  - Audit table present (FEATURE_AUDIT_AND_NAMING.md).
  - Feature spec present (ASTRAL_FEATURE_SPEC.md).
  - Legacy-to-Astral mapping present (ASTRAL_CHANGELOG.md).

Notes:
- Central labels live at `client/src/astral/astralBranding.ts`.
- Avoid renaming API routes or DB fields; scope changes to UI copy.
