# AGENTS.md - AtlasED Coding Guidelines

> Guidelines for AI agents working in this Electron + React codebase.

## Project Overview

AtlasED is a desktop app that transforms YouTube playlists into interactive learning courses.
- **Frontend:** React 18 + TypeScript + Vite 5 (in `src/`)
- **Backend:** Electron 39 with SQLite via better-sqlite3 (in `electron/`)
- **Styling:** Tailwind CSS + Vanilla CSS design tokens (in `index.css`)
- **Icons:** Lucide React
- **Testing:** Vitest + React Testing Library

## Build & Development Commands

```bash
# Install dependencies
npm install

# Development mode (Vite + Electron together)
npm run electron:dev

# Run Vite dev server only (for UI work)
npm run dev

# Run Electron only (requires built frontend)
npm run electron

# Run tests
npm test            # Single run
npm run test:watch  # Watch mode
npm run test:coverage # With coverage

# Type checking
npx tsc --noEmit

# Lint the codebase
npm run lint

# Production build
npm run build

# Package for Windows
npm run package
```

## Project Structure

```
AtlasED/
├── electron/                # Electron main process (Node.js, ES Modules)
│   ├── main.js              # Entry point, IPC handlers, window creation
│   ├── preload.cjs           # Context bridge (CommonJS required by Electron)
│   ├── database/
│   │   ├── init.js           # Schema creation (SQLite tables + indexes)
│   │   └── queries.js        # All DB query functions (CRUD, SRS, Knowledge Graph)
│   └── services/
│       ├── gemini.js          # Gemini AI: field guides, quizzes, chat, validation
│       └── transcript.js     # YouTube transcript fetching with fallbacks
├── src/                      # React frontend (TypeScript)
│   ├── App.tsx               # Root component with React Router
│   ├── main.tsx              # Entry point
│   ├── index.css             # Design system (CSS variables, tokens, utilities)
│   ├── components/
│   │   ├── layout/           # AppLayout, AppHeader
│   │   ├── modals/           # NewExpeditionModal, QuizModal
│   │   └── ui/               # Radix-based shadcn/ui primitives
│   ├── pages/
│   │   ├── Dashboard.tsx      # Home page with expedition cards
│   │   ├── ExpeditionView.tsx # Expedition detail with waypoint list
│   │   ├── VideoPlayer.tsx    # 4-tab sidebar: Field Guide, Notes, Chart, Compass AI
│   │   ├── KnowledgeGraph.tsx # D3 force-directed graph of connected waypoints
│   │   ├── MemoryCheckpoints.tsx # SRS review scheduling page
│   │   └── Settings.tsx       # API keys and preferences
│   ├── types/
│   │   ├── electron.ts        # AtlasedAPI interface, all DB entity types
│   │   └── expedition.ts      # Frontend-only types (Expedition, Waypoint, etc.)
│   ├── test/
│   │   ├── setup.ts           # Test setup (jest-dom, matchMedia mock)
│   │   └── *.test.ts          # Test files
│   └── data/
│       └── mockData.ts        # Legacy mock data (being phased out)
└── dist/                      # Built frontend (generated)
```

## Code Style Guidelines

### TypeScript/TSX

- **ES Modules:** Use `import`/`export` everywhere except `preload.cjs`
- **TypeScript:** Frontend uses `.tsx`/`.ts` with strict types
- **Backend:** `electron/` uses plain JavaScript (`.js`) with ES Modules
- **Semicolons:** Use semicolons consistently
- **Quotes:** Double quotes in TSX files, single quotes in backend JS

### React Components

```tsx
// Function components with export default
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export default function ComponentName() {
    // State declarations first
    const [state, setState] = useState(initialValue);
    
    // Hooks next
    const navigate = useNavigate();
    
    // Effects
    useEffect(() => {
        loadData();
    }, []);
    
    // Handler functions
    const handleAction = async () => {
        try {
            // Always wrap async operations in try-catch
        } catch (error) {
            console.error('Error description:', error);
        }
    };
    
    // Render
    return (
        <div className="component-name">
            {/* JSX content */}
        </div>
    );
}
```

### Import Order

```tsx
// 1. React and hooks
import { useState, useEffect } from "react";
// 2. Third-party libraries
import { useNavigate } from "react-router-dom";
// 3. Icons
import { Brain, Settings, Play } from "lucide-react";
// 4. Local components
import { AppLayout } from "@/components/layout/AppLayout";
// 5. Local utilities
import { cn } from "@/lib/utils";
// 6. Types
import type { SrsCheckpoint } from "@/types/electron";
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `VideoPlayer`, `QuizModal` |
| Functions | camelCase | `handleSubmit`, `loadExpeditions` |
| Constants | UPPER_SNAKE_CASE | `INTERVALS` |
| CSS Classes | Tailwind utilities + BEM | `bg-atlas-gold`, `checkpoint-card` |
| Database columns | snake_case | `expedition_id`, `is_charted` |
| IPC channels | namespace:action | `db:getExpedition`, `ai:chat` |
| Types/Interfaces | PascalCase, Db prefix for entities | `DbWaypoint`, `SrsCheckpoint` |

### CSS & Styling

The design system uses CSS custom properties (variables) with a `--atlas-` prefix:

```css
/* Core palette defined in index.css */
--atlas-bg-primary      /* Main background */
--atlas-bg-secondary    /* Card backgrounds */
--atlas-bg-tertiary     /* Input backgrounds */
--atlas-gold            /* Primary accent (gold) */
--atlas-text-primary    /* Main text */
--atlas-text-secondary  /* Subdued text */
--atlas-text-muted      /* Faint text */
--atlas-border          /* Border color */
--atlas-success         /* Green */
--atlas-warning         /* Yellow */
--atlas-error           /* Red */
```

Use Tailwind with these tokens: `bg-atlas-gold`, `text-atlas-text-primary`, `border-atlas-border`, etc.

## Electron IPC Patterns

### Main Process (electron/main.js)

```javascript
// Handlers use 'namespace:action' naming
ipcMain.handle('db:getExpedition', (_, id) => queries.getExpedition(id));
ipcMain.handle('ai:generateFieldGuide', async (_, transcript, title) => {
    try {
        const apiKey = store.get('gemini_api_key');
        return await generateFieldGuide(apiKey, transcript, title);
    } catch (error) {
        console.error('Error description:', error);
        return { success: false, error: error.message };
    }
});
```

### Preload Script (electron/preload.cjs)

```javascript
// Must be CommonJS (.cjs extension)
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('atlased', {
    expeditions: {
        get: (id) => ipcRenderer.invoke('db:getExpedition', id),
    },
});
```

### Renderer Usage

```typescript
// Access via window.atlased (typed in src/types/electron.ts)
const expedition = await window.atlased.expeditions.get(id);

// Always check if atlased exists (for testing/browser preview)
if (window.atlased) {
    const data = await window.atlased.expeditions.getAll();
}
```

## Database Architecture (better-sqlite3)

### Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `expeditions` | Playlists/Courses | `id`, `title`, `playlist_url`, `thumbnail_url` |
| `waypoints` | Individual videos | `id`, `expedition_id`, `youtube_id`, `is_charted` |
| `field_guides` | AI study guides | `waypoint_id`, `executive_summary`, `key_takeaways` (JSON), `quiz_data_json` |
| `tags` | Concept tags | `id`, `name` (UNIQUE) |
| `waypoint_tags` | Many-to-many | `waypoint_id`, `tag_id` (composite PK) |
| `quiz_attempts` | Quiz results for SRS | `waypoint_id`, `question_index`, `is_correct` |
| `notes` | User notes per waypoint | `waypoint_id`, `content` |

### Query Patterns

```javascript
// Synchronous API - no async/await needed
const db = getDatabase();

// Use prepared statements
const waypoint = db.prepare('SELECT * FROM waypoints WHERE id = ?').get(id);
const waypoints = db.prepare('SELECT * FROM waypoints').all();

// Handle UNIQUE constraint gracefully
try {
    db.prepare('INSERT INTO tags (id, name) VALUES (?, ?)').run(id, name);
} catch (error) {
    if (error.message?.includes('UNIQUE constraint failed')) {
        return db.prepare('SELECT * FROM tags WHERE name = ?').get(name);
    }
    throw error;
}
```

## Key APIs (window.atlased)

```typescript
// Window controls
window.atlased.window.minimize() / .maximize() / .close()

// Settings (encrypted electron-store)
window.atlased.settings.get(key) / .set(key, value) / .getAll()

// Database CRUD
window.atlased.expeditions.create(data) / .getAll() / .get(id) / .delete(id)
window.atlased.waypoints.create(data) / .getAll(expeditionId) / .markCharted(id)
window.atlased.fieldGuides.create(data) / .get(waypointId) / .update(waypointId, data)
window.atlased.tags.create(name) / .addToWaypoint(waypointId, tagId)
window.atlased.quizAttempts.create(data) / .getAll(waypointId)
window.atlased.notes.get(waypointId) / .upsert(waypointId, content)

// Computed data
window.atlased.knowledgeGraph.getData()       // → { waypoints, waypointTags }
window.atlased.memoryCheckpoints.getAll()     // → SrsCheckpoint[]

// AI Services (require Gemini API key)
window.atlased.ai.fetchTranscript(videoId)
window.atlased.ai.generateFieldGuide(transcript, title)
window.atlased.ai.generateQuizzes(transcript, title)
window.atlased.ai.chat(message, transcript, title, history)
window.atlased.ai.validateApiKey(apiKey)
window.atlased.ai.fetchPlaylist(url)
```

## SRS (Spaced Repetition System)

The SRS engine lives in `electron/database/queries.js` → `getMemoryCheckpoints()`.

**Algorithm:** Simplified SM-2 with interval ladder:
- **Intervals:** 1d → 3d → 7d → 14d → 30d → 60d → 120d
- **≥80% accuracy** → advance interval
- **<50% accuracy** → reset to 1d
- **50-80%** → hold current interval
- **Retention decay:** Exponential (half-life = `currentInterval × 2` days)

## Testing

Uses **Vitest** with **React Testing Library**:

```bash
npm test           # Run all tests
npm run test:watch # Watch mode
```

```typescript
import { describe, it, expect } from "vitest";

describe("feature", () => {
    it("should do something", () => {
        expect(result).toBe(expected);
    });
});
```

## Do's and Don'ts

### Do
- Use TypeScript in frontend (`src/`), plain JS in backend (`electron/`)
- Wrap IPC calls in `if (window.atlased)` checks
- Use `@/` path alias for imports from `src/`
- Use CSS variables from the design system (`bg-atlas-gold`, etc.)
- Return `{ success, data/error }` from async IPC handlers
- Handle UNIQUE constraint errors gracefully in DB operations
- Add tags to `waypoint_tags` when generating field guides

### Don't
- Don't use class components
- Don't use `require()` in frontend code (ES modules only)
- Don't forget `.cjs` extension for preload script
- Don't call DB queries with `await` — better-sqlite3 is synchronous
- Don't hardcode the database path — use `app.getPath('userData')`
- Don't skip error handling on AI service calls (they can fail)
