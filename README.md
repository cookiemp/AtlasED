<p align="center">
  <img src="atlased.png" alt="AtlasED Logo" width="160" />
</p>

<h1 align="center">AtlasED</h1>

<p align="center">
  <strong>Transform YouTube playlists into interactive learning journeys.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Electron-39.x-47848F?style=flat-square&logo=electron&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18.x-61DAFB?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-5.x-646CFF?style=flat-square&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-3.x-003B57?style=flat-square&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_AI-Powered-4285F4?style=flat-square&logo=google&logoColor=white" />
</p>

---

## The Problem

YouTube is designed for **engagement** — keeping you watching. But learners need **retention** — actually remembering what they studied. AtlasED bridges this gap by stripping away distractions and using AI to turn any YouTube playlist into a structured, interactive course complete with notes, quizzes, and knowledge connections.

---

## Features

### Expedition System
Paste a YouTube playlist URL and AtlasED automatically imports every video as a structured **Expedition** — your personal learning course. Track progress across all your expeditions from a sleek dashboard.

### AI Field Guides
For each video, Gemini AI analyzes the transcript and generates comprehensive study notes including an **executive summary**, **key concepts** with tags, **code examples** with syntax highlighting, and **key takeaways**. All rendered as beautiful Markdown.

### Mid-Stream Quizzes
AI identifies natural break points in each video and generates multiple-choice comprehension questions. The video **pauses automatically** at these moments, enforcing active recall — the most effective learning technique.

### Compass AI Chat
A context-aware AI chat sidebar that understands the video you're watching. Ask questions like *"What's the difference between props and state?"* and get an answer grounded in the video's actual transcript.

### The Atlas (Knowledge Graph)
A D3-powered **force-directed graph** that visualizes how topics connect across your videos. Concepts like "Recursion" and "Big O" are linked, revealing the hidden structure of your learning material.

### Memory Checkpoints (Spaced Repetition)
Built-in SM-2 spaced repetition algorithm schedules review quizzes at optimal intervals (1 → 3 → 7 → 14 → 30 → 60 → 120 days), ensuring long-term retention instead of cramming and forgetting.

### Timestamp Bookmarks
Save important moments in any video with a single click. Jump back to them instantly from the navigation sidebar.

### Global Search (Ctrl+K)
Command palette-style search across all your Field Guides, notes, and expedition titles. Find anything, instantly.

### Personal Notes
Per-video notes with 1-second debounce auto-save. Keep your own thoughts alongside the AI-generated material.

---

## The Atlas Dictionary

AtlasED uses explorer-themed terminology throughout for a cohesive experience:

| Standard Term | AtlasED Term | Meaning |
|:---|:---|:---|
| Playlist / Course | **Expedition** | A collection of videos on a subject |
| Video | **Waypoint** | A single stop on the learning journey |
| AI Notes | **Field Guide** | Generated summaries, concepts & quizzes |
| Knowledge Graph | **The Atlas** | Visual map of topic connections |
| Completion | **Charted** | Marking a waypoint as complete |
| Spaced Repetition | **Memory Checkpoint** | Scheduled review for retention |

---

## Getting Started

### Prerequisites

| Requirement | Version | Notes |
|:---|:---|:---|
| **Node.js** | 18+ | [Download](https://nodejs.org/) |
| **Python** | 3.8+ | Required for transcript fetching |
| **pip** | Latest | Python package manager |
| **Gemini API Key** | Free tier | [Get yours here](https://aistudio.google.com/apikey) |

### Installation

```bash
# Clone the repository
git clone https://github.com/cookiemp/AtlasED.git
cd AtlasED

# Install all dependencies (Node + Python)
npm run setup

# Or install separately:
npm install
pip install youtube-transcript-api
```

### Development

```bash
# Start Vite dev server only (for UI development)
npm run dev

# Start full Electron app in development mode
npm run electron:dev
```

### Building for Production

```bash
# Build the Vite frontend
npm run build

# Package the Electron app for Windows
npm run package
```

The packaged installer will be output to the `release/` directory.

### Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

---

## Architecture

AtlasED is a **local-first** desktop app using the **BYOK (Bring Your Own Key)** model — your data and API keys never leave your machine.

```
┌─────────────────────────────────────────────────────────────────┐
│                     Electron Shell (Main Process)               │
│  ┌────────────────────┐  ┌──────────────────┐   ┌─────────────┐ │
│  │   IPC Handlers     │  │  SQLite (better- │   │  Electron   │ │
│  │   (CRUD Ops)       │  │  sqlite3)        │   │  Store      │ │
│  └────────┬───────────┘  └────────┬─────────┘   │  (Encrypted)│ │
│           │                       │             └──────┬──────┘ │
│  ┌────────┴───────────────────────┴────────────────────┴──────┐ │
│  │                      Preload Bridge (IPC)                   ││
│  └─────────────────────────┬───────────────────────────────────┘│
├─────────────────────────────┼───────────────────────────────────┤
│                     Renderer Process                             │
│  ┌──────────────────────────┴──────────────────────────────────┐ │
│  │                   React + Vite (SWC)                        │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐   │ │
│  │  │Dashboard │  │Expedition│  │ Video    │  │ Knowledge  │   │ │ 
│  │  │          │  │  View    │  │ Player   │  │  Graph     │   │ │
│  │  └──────────┘  └──────────┘  └──────────┘  └────────────┘   │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌───────────────────────────────────────────────────────────────┐│
│  │                     External Services                         ││
│  │  ┌──────────────┐  ┌───────────────┐  ┌────────────────────┐  ││
│  │  │YouTube IFrame│  │Gemini API     │  │youtube-transcript  │  ││
│  │  │Player API    │  │(User's Key)   │  │(Python)            │  ││
│  │  └──────────────┘  └───────────────┘  └────────────────────┘  ││
│  └───────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|:---|:---|:---|
| **Shell** | Electron 39 | Native desktop window, system tray, IPC |
| **Frontend** | React 18 + TypeScript | Component-based UI with type safety |
| **Bundler** | Vite 5 (SWC) | Lightning-fast HMR & builds |
| **Styling** | Tailwind CSS 3 | Utility-first CSS with custom dark theme |
| **UI Components** | Radix UI + shadcn/ui | Accessible, composable primitives |
| **Database** | better-sqlite3 | Fast synchronous SQLite for local storage |
| **AI** | Google Gemini API | Field guide generation, quizzes, chat |
| **Transcripts** | youtube-transcript-api (Python) | Fetch video captions without API quota |
| **Visualization** | D3.js | Force-directed knowledge graph |
| **Charts** | Recharts | Analytics & progress visualization |
| **Testing** | Vitest + Testing Library | Unit & component tests |
| **Settings** | electron-store | Encrypted JSON storage (AES-256) |

### Database Schema

AtlasED stores all data locally in SQLite with 7 tables:

```sql
Expeditions         -- Imported playlists
Waypoints           -- Individual videos within expeditions
FieldGuides         -- AI-generated study notes (Markdown + quiz JSON)
Tags                -- Topic tags extracted from field guides
WaypointTags        -- Many-to-many: waypoints ↔ tags
QuizAttempts        -- Quiz answer history for SRS
Notes               -- Personal user notes per waypoint
```

---

## Project Structure

```
AtlasED/
├── electron/                   # Electron main process
│   ├── main.js                 # App entry, window management, IPC handlers
│   ├── preload.cjs             # Context bridge (renderer ↔ main)
│   ├── database/
│   │   ├── init.js             # SQLite schema & migrations
│   │   └── queries.js          # All database CRUD operations
│   └── services/
│       └── ...                 # Transcript fetching, AI services
│
├── src/                        # React renderer process
│   ├── App.tsx                 # Root component & routing
│   ├── main.tsx                # React entry point
│   ├── index.css               # Global styles & design tokens
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx       # Expedition grid & overview
│   │   ├── ExpeditionView.tsx  # Waypoint list for an expedition
│   │   ├── VideoPlayer.tsx     # 3-column Cockpit learning interface
│   │   ├── KnowledgeGraph.tsx  # D3 force-directed atlas
│   │   ├── MemoryCheckpoints.tsx # SRS review dashboard
│   │   └── Settings.tsx        # API keys & preferences
│   │
│   ├── components/
│   │   ├── layout/             # AppHeader, TitleBar, AppSidebar
│   │   ├── dashboard/          # ExpeditionCard, EmptyState, etc.
│   │   ├── video-player/       # FieldGuideTab, NotesTab, ChartTab, etc.
│   │   ├── modals/             # NewExpeditionModal, ApiKeyModal
│   │   ├── CommandPalette.tsx  # Global search (Ctrl+K)
│   │   ├── ErrorBoundary.tsx   # Per-route error boundaries
│   │   └── ui/                 # shadcn/ui primitives (50+ components)
│   │
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility functions
│   ├── types/                  # TypeScript type definitions
│   └── test/                   # Test files
│       ├── srs-algorithm.test.ts
│       ├── knowledge-graph.test.ts
│       └── tag-persistence.test.ts
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── eslint.config.js
```

---

## How It Works

### 1. Create an Expedition
Paste a YouTube playlist URL → AtlasED fetches all video metadata (titles, thumbnails, durations) and stores them locally as an **Expedition** with individual **Waypoints**.

### 2. Watch & Learn
Open any Waypoint to enter the **Cockpit** — a 3-column layout with:
- **Module Map** (left) — Navigate between waypoints
- **Viewport** (center) — YouTube player + Field Guide tabs
- **Compass AI** (right) — Ask questions about the video

### 3. Generate Study Materials
Click "Generate Field Guide" and Gemini AI analyzes the transcript to produce structured notes, key concepts, code examples, and comprehension quizzes.

### 4. Active Recall
Mid-stream quizzes pause the video at AI-determined break points. Answer multiple-choice questions to test your understanding — studies show active recall improves retention by up to 50%.

### 5. Build Connections
The **Atlas** knowledge graph visualizes how topics connect across videos. Shared concepts create edges between waypoints, revealing the deeper structure of your learning material.

### 6. Retain Long-Term
**Memory Checkpoints** use the SM-2 spaced repetition algorithm to schedule reviews at scientifically optimal intervals, combating the forgetting curve.

---

## Configuration

### API Keys

AtlasED uses the **BYOK (Bring Your Own Key)** model. You'll need:

1. **Gemini API Key** (required) — [Get a free key](https://aistudio.google.com/apikey)
   - Free tier: 15 requests/minute, 1M tokens/minute
   - Supports `gemini-3-flash` and `gemini-2.5-flash` as a fallback
   - 1M token context window for analyzing full playlists

2. **YouTube Data API Key** (optional) — For enhanced playlist metadata
   - Not required for basic functionality
   - Transcript fetching uses `youtube-transcript-api` (no quota)

All API keys are encrypted with AES-256 and stored locally via `electron-store`.

### Settings

| Setting | Default | Description |
|:---|:---|:---|
| `theme` | `dark` | Dark or light theme |
| `auto_quiz` | `true` | Enable mid-stream quiz auto-pause |
| `playback_speed` | `1.0` | Default video playback speed |
| `srs_enabled` | `true` | Enable Memory Checkpoints |
| `srs_intervals` | `[1, 3, 7, 14]` | Review intervals in days |

---

## Roadmap

### Completed
- [x] Electron + React + Vite foundation
- [x] YouTube playlist ingestion & Expedition system
- [x] AI Field Guide generation with Gemini
- [x] Mid-stream quiz auto-pause system
- [x] Compass AI context-aware chat
- [x] D3 Knowledge Graph with tag-based connections
- [x] SM-2 Spaced Repetition (Memory Checkpoints)
- [x] Timestamp bookmarks
- [x] Global search (Ctrl+K command palette)
- [x] Personal notes with auto-save
- [x] Encrypted settings storage
- [x] Custom frameless window with title bar
- [x] 50+ unit tests (SRS algorithm, knowledge graph, tag persistence)

### Coming Soon
- [ ] Learning analytics dashboard (study streaks, time tracking, retention curves)
- [ ] PDF / Markdown export for Field Guides
- [ ] Flashcard mode (repurpose quiz data for quick review)
- [ ] Focus mode / Pomodoro timer integration
- [ ] Onboarding flow for first-time users
- [ ] Drag-and-drop waypoint reordering
- [ ] Dark / Light theme toggle
- [ ] Bulk Field Guide generation ("Generate All")
- [ ] Offline mode with network state detection

---

## Development

### Scripts

| Command | Description |
|:---|:---|
| `npm run dev` | Start Vite dev server (port 5173) |
| `npm run electron:dev` | Start full Electron app in dev mode |
| `npm run build` | Build frontend for production |
| `npm run package` | Build + package Windows installer |
| `npm test` | Run Vitest test suite |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run lint` | Run ESLint |

### Environment

- **Renderer**: http://localhost:5173 in dev mode
- **Database**: SQLite file in Electron user data directory
- **Settings**: `%APPDATA%/atlased/config.json` (encrypted)

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code patterns and TypeScript conventions
- Add tests for new features (Vitest + Testing Library)
- Keep components focused and under 500 lines
- Use the existing shadcn/ui primitives before creating custom components
- Ensure all interactive elements have hover/active states

---

## License

This project is private. All rights reserved.
