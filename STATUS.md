# AtlasED — Project Status
**Last Updated:** 2026-02-11

---

## ✅ Completed This Session

### 1. VideoPlayer — 4-Tab Sidebar
- **Expanded from 2 tabs → 4 tabs**: Field Guide, Notes, Chart, Compass AI
- Tab bar uses compact icon + tiny label layout with gold active accent
- Files changed: `src/pages/VideoPlayer.tsx`

### 2. Notes Tab (NEW)
- Personal notes per waypoint with full-height textarea
- **Auto-saves** with 1s debounce — status indicator shows "Saving..." → "✓ Saved"
- Persisted in new `notes` SQLite table
- Resets cleanly when navigating between waypoints via Prev/Next
- Backend: `notes` table in `init.js`, `getNote`/`upsertNote` in `queries.js`, IPC handlers in `main.js`
- Preload: `window.atlased.notes.get()` / `.upsert()`
- Types: `DbNote` interface in `electron.ts`

### 3. Chart Tab (NEW)
- Shows all waypoints in the current expedition as a navigable list
- Status indicators: ✓ Charted (green), ◉ In Progress (gold), ○ Not Started (gray)
- Progress bar at top showing charted/total count
- Current waypoint highlighted with gold accent + "NOW" badge
- Click any waypoint to navigate directly (triggers clean state reset)
- Title numbering logic matches ExpeditionView

### 4. Knowledge Graph — Wired to Real Data (PARTIAL)
- Removed mock data dependency (`knowledgeGraphData` from mockData.ts no longer used)
- Nodes = waypoints that have generated Field Guides
- Links = waypoints sharing tags (dashed for 1 tag, solid for 2+)
- Category auto-inferred from key_takeaways content
- Loading state and empty state ("No Knowledge Yet") implemented
- Backend: `getKnowledgeGraphData()` query in `queries.js`, IPC handler, preload bridge
- Types: `KnowledgeGraphData` interface in `electron.ts`

### 5. Global Navigation — "The Atlas" Button
- Added to `AppHeader.tsx` (top-right, next to Settings)
- Network icon, navigates to `/atlas`, highlights gold when active

---

## ✅ Knowledge Graph — Fixed (2026-02-12/13)

- **Zoom reset on filter toggle** — Fixed: preserves zoom/pan transform across filter changes
- **Tags not populated (0 connections)** — Fixed: tags from `key_concepts` now saved during field guide generation + backfill for existing field guides
- Node interactions, sidebar details, empty state, JSON parsing — all working

## ✅ Memory Checkpoints — Wired to Real Data (2026-02-13)

- **SRS algorithm implemented** — SM-2 style with interval ladder (1d → 3d → 7d → 14d → 30d → 60d → 120d)
- **Backend:** `getMemoryCheckpoints()` in `queries.js` — fetches quiz history, computes intervals, retention decay, difficulty
- **IPC + Preload:** `db:getMemoryCheckpoints` handler → `window.atlased.memoryCheckpoints.getAll()`
- **Frontend:** Complete rewrite of `MemoryCheckpoints.tsx` — loading/empty states, filter/sort, retention bars, accuracy stats
- **Navigation:** Added "Memory" button to AppHeader (between Atlas and Settings)
- **Types:** Added `SrsCheckpoint` interface to `electron.ts`

## ✅ Documentation — Updated (2026-02-13)

- **AGENTS.md** fully rewritten to reflect current stack: TypeScript, Tailwind, all 7 DB tables, SRS algorithm docs, full API surface, testing setup, updated project structure

## ✅ Testing — Vitest Setup (2026-02-13)

- **Vitest + React Testing Library** installed and configured
- **50 tests** across 4 test files, all passing:
  - `srs-algorithm.test.ts` — 24 tests (interval advancement, retention decay, difficulty, due dates)
  - `knowledge-graph.test.ts` — 13 tests (category inference, link building, shared tags)
  - `tag-persistence.test.ts` — 12 tests (tag extraction, dedup, backfill parsing)
  - `example.test.ts` — 1 baseline test
- **Commands:** `npm test`, `npm run test:watch`, `npm run test:coverage`

---

## 📋 Remaining Work

### 🗺️ Knowledge Graph — Expedition-Level Grouping (Future)
- Visual grouping/clustering of nodes by expedition (e.g., convex hulls, colored regions, or subtle boundaries)
- Expedition labels on clusters
- Helps distinguish which waypoints belong to which learning path

---

## Architecture Reference

### Database Tables
| Table | Purpose |
|-------|---------|
| `expeditions` | Playlists/Courses |
| `waypoints` | Individual videos |
| `field_guides` | AI-generated study guides per waypoint |
| `tags` | Concept tags |
| `waypoint_tags` | Many-to-many waypoint↔tag |
| `quiz_attempts` | Quiz results for SRS |
| `notes` | User notes per waypoint |

### Key API Surface (window.atlased)
```
notes.get(waypointId)            → DbNote | null
notes.upsert(waypointId, text)   → DbNote
knowledgeGraph.getData()         → { waypoints, waypointTags }
memoryCheckpoints.getAll()       → SrsCheckpoint[]
quizAttempts.create(data)        → { id, waypoint_id, ... }
```
