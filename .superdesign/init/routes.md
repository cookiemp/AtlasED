# AtlasED Routes

## Router Configuration

**File:** `src/App.jsx`

Using React Router (BrowserRouter) with the following routes:

```jsx
<BrowserRouter>
  <div className="app">
    <TitleBar />
    <main className="app__content">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/expedition/:id" element={<ExpeditionView />} />
        <Route path="/watch/:expeditionId/:waypointId" element={<VideoPlayer />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </main>
  </div>
</BrowserRouter>
```

## Route Details

### `/` - Dashboard
- **Component:** `Dashboard.jsx`
- **Purpose:** Main landing page showing all expeditions
- **Features:**
  - Expedition grid with progress bars
  - "New Expedition" button
  - Empty state for first-time users
  - Delete expedition functionality

### `/expedition/:id` - Expedition View
- **Component:** `ExpeditionView.jsx`
- **Purpose:** Detail view of a single expedition
- **Features:**
  - Back navigation to dashboard
  - Overall progress bar
  - List of waypoints (videos)
  - Completion status per waypoint
  - Click to enter video player

### `/watch/:expeditionId/:waypointId` - Video Player (Cockpit)
- **Component:** `VideoPlayer.jsx`
- **Purpose:** Video viewing with AI-generated notes and chat
- **Features:**
  - YouTube video player (sticky header)
  - Field Guide (AI-generated notes)
  - Compass AI chat sidebar
  - Quiz integration
  - Progress tracking
  - Waypoint navigation

### `/settings` - Settings
- **Component:** `Settings.jsx`
- **Purpose:** App configuration
- **Features:**
  - API key management (Gemini, YouTube)
  - Playback settings (speed, auto-quiz)
  - Memory checkpoint settings (SRS)

## Navigation Flow

```
Dashboard ──► ExpeditionView ──► VideoPlayer
    │                               │
    └──► Settings ◄─────────────────┘
```

## URL Parameters

- `:id` - Expedition UUID
- `:expeditionId` - Expedition UUID (in watch route)
- `:waypointId` - Waypoint UUID (video ID)

