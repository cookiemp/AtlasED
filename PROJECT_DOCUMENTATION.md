# AtlasED — Product Requirements Document (PRD)

**Version:** 1.0  
**Last Updated:** February 2026  
**Document Type:** Product Requirements Document  

---

## 1. Executive Summary

### 1.1 Product Vision

AtlasED is a desktop application that transforms YouTube playlists into structured, interactive learning courses. The application addresses a fundamental mismatch between YouTube's design goals and educational outcomes: YouTube optimizes for engagement (watch time), while learners need retention (actual learning). AtlasED bridges this gap by wrapping YouTube content in an educational framework powered by artificial intelligence.

### 1.2 Problem Statement

When learners attempt to study from YouTube playlists (programming tutorials, academic lectures, skill courses), they face several obstacles:

1. **Passive Consumption** — Watching videos creates an illusion of learning without actual knowledge retention
2. **No Active Recall** — YouTube provides no mechanism to test understanding during or after viewing
3. **Fragmented Notes** — Learners must manually take notes, often missing key points
4. **No Spaced Repetition** — Without scheduled reviews, learned material is quickly forgotten
5. **Distraction-Rich Environment** — Recommendations, comments, and related videos pull attention away
6. **Disconnected Content** — No visualization of how topics across videos relate to each other

### 1.3 Solution Overview

AtlasED solves these problems by:

1. **Ingesting YouTube playlists** and storing them as structured "Expeditions" with individual "Waypoints" (videos)
2. **Generating AI-powered Field Guides** — comprehensive notes, key concepts, and code examples extracted from video transcripts
3. **Creating comprehension quizzes** that pause the video at strategic points to enforce active recall
4. **Building a Knowledge Graph (The Atlas)** that visualizes conceptual connections across videos
5. **Implementing Spaced Repetition** through Memory Checkpoints that schedule reviews at optimal intervals
6. **Providing an AI Chat assistant** that answers questions about video content in real-time

### 1.4 Target Users

- **Self-taught programmers** learning from YouTube coding tutorials
- **Students** supplementing coursework with online video content
- **Professionals** upskilling through educational playlists
- **Lifelong learners** studying any topic available on YouTube

### 1.5 Product Terminology

Throughout this application, explorer/adventure-themed terminology creates a cohesive experience:

| Standard Term | AtlasED Term | Definition |
|:---|:---|:---|
| Playlist or Course | **Expedition** | A complete YouTube playlist imported into the system, representing a learning journey on a specific topic (e.g., "Python for Beginners") |
| Video | **Waypoint** | A single video within an Expedition, representing one stop on the learning journey (e.g., "Lesson 4: Variables and Data Types") |
| AI-Generated Notes | **Field Guide** | The comprehensive study material generated for each Waypoint, including summary, key concepts, code examples, and takeaways |
| Knowledge Graph | **The Atlas** | A visual network diagram showing how concepts and topics connect across different Waypoints within an Expedition |
| Completion Status | **Charted** | A Waypoint is "charted" when the user marks it as complete after watching and optionally completing quizzes |
| Spaced Repetition Review | **Memory Checkpoint** | A scheduled review session that brings back previously completed Waypoints for quiz-based reinforcement |

---

## 2. User Stories and Journeys

### 2.1 First-Time User Journey

**Persona:** Alex, a junior developer learning React from a YouTube playlist

**Journey Steps:**

1. **Launch Application**
   - Alex downloads and opens AtlasED for the first time
   - The app detects no Gemini API key is configured
   - A modal appears requesting the API key with instructions and a link to obtain one
   - Alex enters their API key, the app validates it, and saves it encrypted locally

2. **Dashboard (Empty State)**
   - Alex sees an empty dashboard with an illustration/icon of a map
   - Prominent call-to-action: "Start New Expedition" button
   - Explanatory text describes what the app does

3. **Create First Expedition**
   - Alex clicks "Start New Expedition"
   - Modal appears with a text input for YouTube playlist URL
   - Alex pastes: `https://youtube.com/playlist?list=PLreactTutorial`
   - App fetches playlist metadata (video titles, thumbnails, durations)
   - Preview shows all videos that will be imported
   - Alex confirms, and the Expedition is created

4. **View Expedition**
   - Alex is navigated to the Expedition detail view
   - Sees a vertical list of all Waypoints (videos) in order
   - Each Waypoint shows: thumbnail, title, duration, completion status
   - Overall progress bar shows 0% complete

5. **Begin Learning**
   - Alex clicks the first Waypoint
   - Opens the "Cockpit" — the main learning interface
   - Video begins playing in the center viewport

6. **Generate Study Materials**
   - Below the video, Alex sees a "Generate Field Guide" button
   - Clicks it; loading indicator appears
   - After a few seconds, the Field Guide populates with:
     - Executive Summary
     - Key Concepts (with tags)
     - Code Examples
     - Key Takeaways
     - Quiz Section

7. **Take Quiz**
   - Alex scrolls to the Quiz Section
   - Multiple choice question appears
   - Selects an answer, clicks "Check Answer"
   - Sees if correct/incorrect with explanation
   - Proceeds through 2-3 questions

8. **Ask AI for Help**
   - Alex has a question about a concept in the video
   - Types in the Compass AI sidebar: "What's the difference between props and state?"
   - AI responds with a context-aware answer based on the video transcript

9. **Mark as Complete**
   - Alex clicks "Mark as Charted" to complete the Waypoint
   - Returns to Expedition view to see progress updated

### 2.2 Returning User Journey

**Persona:** Alex, one week later

1. **Dashboard (Populated)**
   - Opens app, sees Expedition cards with progress indicators
   - Notices "Memory Checkpoint Due" badge on a card
   - Dashboard may show "3 Waypoints due for review today"

2. **Resume Learning**
   - Clicks Expedition card
   - Sees which Waypoints are charted vs. in-progress
   - Clicks next uncharted Waypoint
   - Video resumes from last watched position automatically

3. **Complete Memory Checkpoint**
   - Returns to dashboard
   - Clicks on Memory Checkpoint notification
   - Presented with review quizzes from previously completed Waypoints
   - Performance updates the next review date

### 2.3 Keyboard Power User Journey

**Persona:** Sam, an experienced user who prefers keyboard navigation

- `Space` — Play/Pause video
- `Q` — Toggle quiz panel
- `F` — Open Field Guide tab
- `←` / `→` — Navigate between Waypoints
- `Esc` — Return to Expedition view
- `Cmd/Ctrl + K` — Open global search

---

## 3. Information Architecture

### 3.1 Application Structure

```
AtlasED
├── [Title Bar]                    # Custom window controls
│   ├── App Logo + Title
│   ├── Navigation (Back, Dashboard, Settings)
│   └── Window Controls (Minimize, Maximize, Close)
│
├── [Dashboard] (Route: /)
│   ├── Header ("Your Expeditions")
│   ├── Action Bar (New Expedition button)
│   ├── Expedition Grid
│   │   └── Expedition Card (repeating)
│   │       ├── Thumbnail
│   │       ├── Title
│   │       ├── Waypoint Count
│   │       ├── Progress Percentage
│   │       └── Delete Button
│   └── Empty State (if no Expeditions)
│
├── [Expedition View] (Route: /expedition/:id)
│   ├── Header (Expedition title, back button)
│   ├── Progress Summary
│   └── Waypoint List
│       └── Waypoint Item (repeating)
│           ├── Thumbnail
│           ├── Title
│           ├── Duration
│           ├── Completion Status
│           └── Watch Position (if in-progress)
│
├── [Video Player / Cockpit] (Route: /watch/:expeditionId/:waypointId)
│   ├── [Left Sidebar: Module Map]
│   │   ├── Section Header ("Module Map")
│   │   └── Waypoint List (navigation)
│   │
│   ├── [Center: Viewport]
│   │   ├── Tabs: Video | Field Guide
│   │   ├── Video Player (YouTube IFrame)
│   │   ├── Field Guide Content
│   │   │   ├── Executive Summary
│   │   │   ├── Key Concepts
│   │   │   ├── Code Examples
│   │   │   ├── Key Takeaways
│   │   │   └── Quiz Section
│   │   └── Actions (Generate Field Guide, Mark as Charted)
│   │
│   └── [Right Sidebar: Compass AI]
│       ├── Section Header ("Compass AI")
│       ├── Chat Message History
│       └── Message Input
│
├── [Settings] (Route: /settings)
│   ├── API Keys Section
│   │   ├── Gemini API Key (encrypted)
│   │   └── YouTube API Key (optional, encrypted)
│   ├── Learning Preferences
│   │   ├── Auto-Quiz Toggle
│   │   ├── Default Playback Speed
│   │   └── SRS Intervals
│   └── Appearance
│       └── Theme Selection
│
└── [Modals]
    ├── API Key Modal (first-run)
    └── New Expedition Modal
```

### 3.2 Navigation Flow

```
┌──────────────┐
│   Launch     │
└──────┬───────┘
       ▼
┌──────────────┐     No API Key     ┌──────────────┐
│   App Init   │ ─────────────────► │ API Key Modal│
└──────┬───────┘                    └──────┬───────┘
       │                                   │
       │◄──────────────────────────────────┘
       ▼
┌──────────────┐
│   Dashboard  │◄───────────────────────────────────┐
└──────┬───────┘                                    │
       │                                            │
       ├─── [Settings] ──► Settings Page ───────────┤
       │                                            │
       ├─── [New Expedition] ──► Modal ─────────────┤
       │                                            │
       ▼                                            │
┌──────────────┐                                    │
│ Expedition   │                                    │
│    View      │────────────────────────────────────┤
└──────┬───────┘                                    │
       │                                            │
       ▼                                            │
┌──────────────┐                                    │
│ Video Player │                                    │
│  (Cockpit)   │────────────────────────────────────┘
└──────────────┘
```

---

## 4. Functional Requirements

### 4.1 FR-001: Application Shell

**Description:** The application runs as a native desktop application using Electron with a custom frameless window design.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-001.1 | Application shall display a custom title bar that is draggable to move the window | Must Have |
| FR-001.2 | Title bar shall include minimize, maximize/restore, and close buttons | Must Have |
| FR-001.3 | Title bar shall display the application name and logo | Must Have |
| FR-001.4 | Title bar shall include navigation elements (back button, dashboard link, settings link) | Must Have |
| FR-001.5 | Window shall remember its size and position between sessions | Should Have |
| FR-001.6 | Application shall have a minimum window size of 1024x768 pixels | Must Have |

**Acceptance Criteria:**
- Clicking and dragging the title bar moves the window
- Window controls function correctly (minimize sends to taskbar, maximize fills screen, close exits app)
- Navigation links route to correct pages

---

### 4.2 FR-002: Settings Management

**Description:** Users can configure API keys and application preferences that persist between sessions.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-002.1 | System shall store settings in an encrypted configuration file in the user's app data directory | Must Have |
| FR-002.2 | Gemini API key shall be stored with AES-256 encryption | Must Have |
| FR-002.3 | Settings page shall allow updating Gemini API key with show/hide toggle | Must Have |
| FR-002.4 | Settings page shall allow configuring optional YouTube Data API key | Should Have |
| FR-002.5 | Settings shall include toggles for: auto_quiz, srs_enabled | Should Have |
| FR-002.6 | Settings shall include playback_speed preference (0.5x to 2.0x) | Should Have |
| FR-002.7 | Settings shall include customizable SRS intervals array | Nice to Have |

**Settings Schema:**

```javascript
{
  gemini_api_key: String,      // Encrypted, required
  youtube_api_key: String,     // Encrypted, optional
  theme: "dark" | "light",     // Default: "dark"
  auto_quiz: Boolean,          // Default: true
  playback_speed: Number,      // Default: 1.0, range: 0.5-2.0
  srs_enabled: Boolean,        // Default: true
  srs_intervals: Number[]      // Default: [1, 3, 7, 14] (days)
}
```

**Storage Location:**
- Windows: `%APPDATA%/atlased/config.json`
- macOS: `~/Library/Application Support/atlased/config.json`
- Linux: `~/.config/atlased/config.json`

---

### 4.3 FR-003: First-Run API Key Setup

**Description:** On first launch, the application must collect the user's Gemini API key before allowing use of AI features.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-003.1 | On application launch, system shall check if gemini_api_key exists | Must Have |
| FR-003.2 | If no key exists, display a modal overlay that cannot be dismissed without entering a key | Must Have |
| FR-003.3 | Modal shall explain what the API key is for and provide a link to obtain one | Must Have |
| FR-003.4 | Modal shall include an input field for the API key | Must Have |
| FR-003.5 | Before saving, system shall validate the API key by making a test request to Gemini | Must Have |
| FR-003.6 | If validation fails, display error message and allow retry | Must Have |
| FR-003.7 | If validation succeeds, save the key and close the modal | Must Have |

**UI Copy:**
- Title: "Welcome to AtlasED"
- Subtitle: "To generate AI-powered study materials, you'll need a Gemini API key."
- Link Text: "Get your free API key from Google AI Studio"
- Link URL: `https://aistudio.google.com/apikey`
- Button: "Verify & Save Key"

**Validation Logic:**
```javascript
async function validateApiKey(apiKey) {
  // Make a minimal request to Gemini API
  const response = await fetch(GEMINI_API_URL + '?key=' + apiKey, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Hello' }] }]
    })
  });
  
  if (response.ok) return { valid: true };
  if (response.status === 400) return { valid: false, error: 'Invalid API key' };
  if (response.status === 429) return { valid: true }; // Rate limited but valid
  return { valid: false, error: 'Unable to verify key' };
}
```

---

### 4.4 FR-004: Dashboard

**Description:** The dashboard is the home screen showing all user Expeditions with their progress.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-004.1 | Dashboard shall display a header with title "Your Expeditions" | Must Have |
| FR-004.2 | Dashboard shall include a "New Expedition" button | Must Have |
| FR-004.3 | Dashboard shall display all Expeditions in a responsive grid layout | Must Have |
| FR-004.4 | Each Expedition card shall show: thumbnail, title, waypoint count, progress percentage | Must Have |
| FR-004.5 | Each Expedition card shall have a delete button | Must Have |
| FR-004.6 | Clicking an Expedition card shall navigate to Expedition View | Must Have |
| FR-004.7 | Delete button shall prompt for confirmation before deleting | Must Have |
| FR-004.8 | If no Expeditions exist, display an empty state with illustration and CTA | Must Have |
| FR-004.9 | Dashboard shall show Memory Checkpoint indicators for Expeditions due for review | Should Have |

**Empty State Content:**
- Icon: Map/exploration themed
- Title: "No Expeditions Yet"
- Body: "Start your learning journey by adding a YouTube playlist. We'll transform it into an interactive course with AI-powered notes and quizzes."
- Button: "Start New Expedition"

**Expedition Card Layout:**
```
┌─────────────────────────────────┐
│ ┌─────────────────────────────┐ │
│ │       THUMBNAIL             │ │
│ │         IMAGE               │ │
│ │                             │ │
│ ├─────────────────────────────┤ │
│ │ ████████░░░░░░ 45%          │ │  ← Progress bar
│ └─────────────────────────────┘ │
│ Expedition Title                │
│ 12 waypoints  ·  45% complete 🗑️│
└─────────────────────────────────┘
```

---

### 4.5 FR-005: New Expedition Modal

**Description:** Modal dialog for creating a new Expedition from a YouTube playlist URL.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-005.1 | Modal shall have an input field for YouTube playlist URL | Must Have |
| FR-005.2 | System shall validate that the URL is a YouTube playlist format | Must Have |
| FR-005.3 | On valid URL submission, system shall fetch playlist metadata | Must Have |
| FR-005.4 | During fetch, display a loading indicator | Must Have |
| FR-005.5 | After fetch, display preview of videos to be imported (thumbnails, titles) | Must Have |
| FR-005.6 | User shall be able to customize the Expedition title | Should Have |
| FR-005.7 | User shall confirm creation with a "Create Expedition" button | Must Have |
| FR-005.8 | On creation, system shall save Expedition and all Waypoints to database | Must Have |
| FR-005.9 | On success, close modal and navigate to the new Expedition View | Must Have |
| FR-005.10 | On error, display appropriate error message and allow retry | Must Have |

**Valid YouTube Playlist URL Formats:**
- `https://www.youtube.com/playlist?list=PLxxxxx`
- `https://youtube.com/playlist?list=PLxxxxx`
- `https://www.youtube.com/watch?v=xxxxx&list=PLxxxxx`

**Data Fetched Per Video:**
- `youtube_id` — The 11-character video ID
- `title` — Video title
- `thumbnail_url` — URL to video thumbnail (medium quality)
- `duration_seconds` — Video length in seconds
- `order_index` — Position in playlist (0-indexed)

---

### 4.6 FR-006: Expedition View

**Description:** Displays all Waypoints in a single Expedition with their status.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-006.1 | Page shall display Expedition title in a header | Must Have |
| FR-006.2 | Header shall include a back button to return to Dashboard | Must Have |
| FR-006.3 | Page shall show overall Expedition progress (X/Y complete, percentage) | Must Have |
| FR-006.4 | Page shall list all Waypoints in order | Must Have |
| FR-006.5 | Each Waypoint row shall display: thumbnail, title, duration, status | Must Have |
| FR-006.6 | Status shall indicate: Complete (checkmark), In Progress (current position), Not Started | Must Have |
| FR-006.7 | Clicking a Waypoint shall navigate to the Video Player for that Waypoint | Must Have |
| FR-006.8 | In-progress Waypoints shall show last watched position (e.g., "12:34 / 25:00") | Should Have |

**Waypoint Status Icons:**
- ✓ (green checkmark) — Charted/Complete
- ▶ (play icon) — In Progress (has watch position > 0)
- ○ (empty circle) — Not Started

**Waypoint Row Layout:**
```
┌───────────────────────────────────────────────────────────────────┐
│ ┌─────┐                                                           │
│ │     │  1. Introduction to Variables        ✓  │   5:32         │
│ │ IMG │  Completed                               │                │
│ └─────┘                                                           │
├───────────────────────────────────────────────────────────────────┤
│ ┌─────┐                                                           │
│ │     │  2. Data Types in Python            ▶  │   12:45        │
│ │ IMG │  8:23 / 12:45                            │                │
│ └─────┘                                                           │
├───────────────────────────────────────────────────────────────────┤
│ ┌─────┐                                                           │
│ │     │  3. Control Flow - If/Else          ○  │   18:20        │
│ │ IMG │                                          │                │
│ └─────┘                                                           │
└───────────────────────────────────────────────────────────────────┘
```

---

### 4.7 FR-007: Video Player (Cockpit) — Layout

**Description:** The main learning interface is a 3-column layout called the "Cockpit" that provides video playback, study materials, and AI assistance.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-007.1 | Page shall use a 3-column layout: Module Map, Viewport, Compass AI | Must Have |
| FR-007.2 | Left sidebar (Module Map) shall be collapsible | Should Have |
| FR-007.3 | Right sidebar (Compass AI) shall be collapsible | Should Have |
| FR-007.4 | Center viewport shall use tabs: "Video" and "Field Guide" | Must Have |
| FR-007.5 | All columns shall be scrollable independently | Must Have |
| FR-007.6 | Page shall include a back button to return to Expedition View | Must Have |

**Column Dimensions:**
- Module Map: 280px fixed width (when expanded)
- Viewport: Flexible, fills remaining space (min: 600px)
- Compass AI: 320px fixed width (when expanded)

**Layout Diagram:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ← Back to Expedition          [Waypoint Title]          Mark as Charted ✓  │
├────────────┬───────────────────────────────────────────────────┬────────────┤
│            │                                                   │            │
│  MODULE    │                    VIEWPORT                       │  COMPASS   │
│    MAP     │  ┌─────────────────────────────────────────────┐  │    AI      │
│            │  │  [Video Tab]  [Field Guide Tab]             │  │            │
│ ┌────────┐ │  ├─────────────────────────────────────────────┤  │ ┌────────┐ │
│ │ WP 1 ✓│ │  │                                             │  │ │ Chat   │ │
│ │ WP 2 ▶│ │  │                                             │  │ │ msgs   │ │
│ │ WP 3  │ │  │            YouTube Player                   │  │ │ here   │ │
│ │ WP 4  │ │  │              or                             │  │ │        │ │
│ │ WP 5  │ │  │          Field Guide Content                │  │ │        │ │
│ │ ...   │ │  │                                             │  │ │        │ │
│ └────────┘ │  │                                             │  │ └────────┘ │
│            │  │                                             │  │            │
│            │  │                                             │  │ ┌────────┐ │
│            │  └─────────────────────────────────────────────┘  │ │ Input  │ │
│            │                                                   │ └────────┘ │
└────────────┴───────────────────────────────────────────────────┴────────────┘
```

---

### 4.8 FR-008: Video Player — Module Map Sidebar

**Description:** Left sidebar showing navigation through all Waypoints in the current Expedition.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-008.1 | Sidebar shall list all Waypoints in the current Expedition | Must Have |
| FR-008.2 | Current Waypoint shall be visually highlighted | Must Have |
| FR-008.3 | Each Waypoint shall show title and completion status | Must Have |
| FR-008.4 | Clicking a Waypoint shall navigate to that video | Must Have |
| FR-008.5 | Sidebar shall maintain scroll position when switching videos | Should Have |
| FR-008.6 | Sidebar header shall display "Module Map" title | Must Have |

---

### 4.9 FR-009: Video Player — Video Tab

**Description:** The video tab contains the embedded YouTube player.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-009.1 | Video shall be embedded using YouTube IFrame Player API | Must Have |
| FR-009.2 | Video shall start at the user's last watched position (if any) | Must Have |
| FR-009.3 | System shall save watch position to database every 5 seconds during playback | Must Have |
| FR-009.4 | System shall save watch position when user pauses or navigates away | Must Have |
| FR-009.5 | When video ends (watched to >95%), prompt user to mark as complete | Should Have |
| FR-009.6 | Player shall respect user's playback speed preference | Should Have |
| FR-009.7 | If auto_quiz is enabled, video shall pause at quiz timestamps | Nice to Have |

**YouTube Player Events to Handle:**
- `onReady` — Seek to saved position, start playback
- `onStateChange` — Detect play/pause/end states
- `onError` — Handle video unavailable errors

**Position Saving Logic:**
```javascript
// Save position every 5 seconds during PLAYING state
function startPositionTracking(player) {
  setInterval(() => {
    if (player.getPlayerState() === YT.PlayerState.PLAYING) {
      const position = Math.floor(player.getCurrentTime());
      saveWatchPosition(waypointId, position);
    }
  }, 5000);
}
```

---

### 4.10 FR-010: Video Player — Field Guide Tab

**Description:** The Field Guide tab displays AI-generated study materials for the current Waypoint.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-010.1 | If no Field Guide exists, display "Generate Field Guide" button | Must Have |
| FR-010.2 | Button shall trigger AI generation using the video's transcript | Must Have |
| FR-010.3 | During generation, display loading state with progress indication | Must Have |
| FR-010.4 | After generation, display Field Guide content in formatted Markdown | Must Have |
| FR-010.5 | Field Guide shall include: Executive Summary, Key Concepts, Code Examples, Key Takeaways | Must Have |
| FR-010.6 | Code examples shall have syntax highlighting and language labels | Must Have |
| FR-010.7 | Field Guide shall include Quiz Section at the bottom | Must Have |
| FR-010.8 | If transcript fetch fails, provide manual transcript input option | Must Have |
| FR-010.9 | Generated Field Guide shall be saved to database for offline access | Must Have |

**Field Guide Content Structure:**

```markdown
## Executive Summary
2-3 sentence overview of what this video covers.

## Key Concepts

### Concept 1: Variable Declaration
Explanation of the concept in 2-3 clear sentences.
**Related Topics:** variables, memory, naming conventions

### Concept 2: Data Types
Explanation of the concept in 2-3 clear sentences.
**Related Topics:** types, integers, strings, booleans

## Code Examples

```python
# Declaring variables in Python
name = "Alice"
age = 30
is_student = True
```

*This example demonstrates basic variable assignment with different data types.*

## Key Takeaways
- Variables store data in memory using names
- Python uses dynamic typing
- Choose meaningful variable names for readability
```

**Manual Transcript Fallback:**

When automatic transcript fetching fails (no captions, disabled, private video):
1. Display warning: "Automatic transcript unavailable for this video"
2. Show text area: "Paste transcript manually to generate Field Guide"
3. Provide "Generate from Manual Transcript" button
4. Store manual transcript in database for future use

---

### 4.11 FR-011: Video Player — Quiz Section

**Description:** Interactive quizzes embedded within the Field Guide to test comprehension.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-011.1 | Quiz section shall display 2-3 multiple choice questions | Must Have |
| FR-011.2 | Each question shall have 4 options (A, B, C, D) | Must Have |
| FR-011.3 | User shall select an option and click "Check Answer" | Must Have |
| FR-011.4 | After checking, reveal correct/incorrect status with color coding | Must Have |
| FR-011.5 | After checking, display explanation for the correct answer | Must Have |
| FR-011.6 | User clicks "Continue" to proceed to next question | Must Have |
| FR-011.7 | After all questions, display score summary (e.g., "2/3 correct - 67%") | Must Have |
| FR-011.8 | Provide "Try Again" button to reset and retake quiz | Must Have |
| FR-011.9 | Save quiz attempts to database with timestamp and correctness | Should Have |
| FR-011.10 | Filter out malformed quiz data (missing question, invalid correct_index) | Must Have |

**Quiz Question Data Structure:**
```javascript
{
  question: "What is the primary purpose of a variable?",
  options: [
    "To store data in memory",
    "To perform calculations",
    "To create loops",
    "To define functions"
  ],
  correct_index: 0,  // Index of correct option (0-3)
  explanation: "Variables are containers that store data values in memory, allowing programs to remember and manipulate information."
}
```

**Visual States:**
- **Default:** Options have neutral styling
- **Selected:** Selected option has primary color border
- **Correct:** Green background with checkmark icon
- **Incorrect:** Red background with X icon (also show correct answer in green)

---

### 4.12 FR-012: Video Player — Compass AI Sidebar

**Description:** Right sidebar with AI chat for asking questions about video content.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-012.1 | Sidebar shall display chat message history | Must Have |
| FR-012.2 | Sidebar shall have text input field at bottom | Must Have |
| FR-012.3 | User can send message by pressing Enter or clicking send button | Must Have |
| FR-012.4 | System shall send user message to Gemini with video context | Must Have |
| FR-012.5 | AI response shall be rendered as Markdown (supporting code blocks) | Must Have |
| FR-012.6 | Display loading indicator while AI is generating response | Must Have |
| FR-012.7 | Chat history shall be maintained within session (not persisted) | Must Have |
| FR-012.8 | Chat shall use video transcript as context for relevance | Must Have |
| FR-012.9 | If no transcript, display message that chat requires transcript | Must Have |

**Message Bubble Styling:**
- User messages: Right-aligned, primary color background
- AI messages: Left-aligned, secondary/muted background
- AI messages support: code blocks, lists, bold, italic

**AI Context Construction:**
```javascript
const systemPrompt = `You are an expert tutor helping a student understand a video.

Video Title: ${videoTitle}

Video Transcript:
${transcript}

Answer the student's question based on the video content. Be concise and helpful.`;
```

---

### 4.13 FR-013: Mark as Charted (Complete)

**Description:** Users can mark Waypoints as complete after watching.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-013.1 | Video Player shall include "Mark as Charted" button | Must Have |
| FR-013.2 | Button shall be prominent in the header area | Must Have |
| FR-013.3 | Clicking shall update waypoint.is_charted to true | Must Have |
| FR-013.4 | Clicking shall increment expedition.completed_waypoints | Must Have |
| FR-013.5 | Visual feedback shall confirm completion (success animation or message) | Should Have |
| FR-013.6 | If already charted, button shows "Charted ✓" in different style | Must Have |
| FR-013.7 | Marking complete shall set next_review_at based on SRS schedule | Should Have |

---

### 4.14 FR-014: The Atlas (Knowledge Graph)

**Description:** Visual representation of topic connections across Waypoints.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-014.1 | Each Field Guide shall extract 3-5 topic tags | Must Have |
| FR-014.2 | Tags shall be stored in database linked to Waypoints | Must Have |
| FR-014.3 | The Atlas shall display as a force-directed graph | Nice to Have |
| FR-014.4 | Nodes represent Waypoints | Nice to Have |
| FR-014.5 | Edges connect Waypoints that share common tags | Nice to Have |
| FR-014.6 | Clicking a node navigates to that Waypoint | Nice to Have |
| FR-014.7 | Graph shall use react-force-graph library | Nice to Have |

**Tag Extraction Prompt Addition:**
```javascript
// In Field Guide generation prompt, add:
"Also extract 3-5 topic tags that represent the main concepts covered.
Return in format: tags: ['tag1', 'tag2', 'tag3']"
```

---

### 4.15 FR-015: Memory Checkpoints (Spaced Repetition)

**Description:** System for scheduling and conducting review sessions based on spaced repetition.

**Requirements:**

| ID | Requirement | Priority |
|:---|:---|:---|
| FR-015.1 | When Waypoint is charted, calculate next_review_at using SRS intervals | Should Have |
| FR-015.2 | Default intervals: 1 day, 3 days, 7 days, 14 days | Should Have |
| FR-015.3 | Dashboard shall show count of Waypoints due for review | Should Have |
| FR-015.4 | Expedition cards shall show Memory Checkpoint badge if due | Should Have |
| FR-015.5 | Memory Checkpoint review presents quizzes from due Waypoints | Nice to Have |
| FR-015.6 | Quiz performance adjusts next review date (correct = longer interval) | Nice to Have |
| FR-015.7 | User can snooze or skip reviews | Nice to Have |

**SRS Calculation:**
```javascript
function calculateNextReview(reviewLevel, srsIntervals) {
  // reviewLevel: 0, 1, 2, 3 (index into intervals)
  // srsIntervals: [1, 3, 7, 14] (days)
  
  const daysUntilNext = srsIntervals[reviewLevel] || srsIntervals[srsIntervals.length - 1];
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + daysUntilNext);
  return nextDate.toISOString();
}
```

---

## 5. Technical Specifications

### 5.1 Database Schema (SQLite)

**Database Location:** `{USER_DATA_DIR}/atlased.db`

#### Table: expeditions
Stores playlist/course metadata.

| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| title | TEXT | NOT NULL | Expedition display name |
| thumbnail_url | TEXT | | URL to playlist thumbnail |
| playlist_url | TEXT | | Original YouTube playlist URL |
| total_waypoints | INTEGER | DEFAULT 0 | Count of videos in playlist |
| completed_waypoints | INTEGER | DEFAULT 0 | Count of charted videos |
| created_at | TEXT | DEFAULT datetime('now') | ISO timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | ISO timestamp |

#### Table: waypoints
Stores individual video data.

| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| expedition_id | TEXT | NOT NULL, FK → expeditions(id) ON DELETE CASCADE | Parent expedition |
| youtube_id | TEXT | NOT NULL | YouTube video ID (11 chars) |
| title | TEXT | NOT NULL | Video title |
| thumbnail_url | TEXT | | URL to video thumbnail |
| duration_seconds | INTEGER | DEFAULT 0 | Video length |
| order_index | INTEGER | DEFAULT 0 | Position in playlist (0-indexed) |
| last_watched_pos | INTEGER | DEFAULT 0 | Last playback position in seconds |
| transcript_text | TEXT | | Cached transcript (may be null) |
| is_charted | INTEGER | DEFAULT 0 | 1 if complete, 0 otherwise |
| is_unavailable | INTEGER | DEFAULT 0 | 1 if video deleted/private |
| next_review_at | TEXT | | ISO timestamp for next SRS review |
| created_at | TEXT | DEFAULT datetime('now') | ISO timestamp |

#### Table: field_guides
Stores AI-generated study materials.

| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| waypoint_id | TEXT | UNIQUE, NOT NULL, FK → waypoints(id) ON DELETE CASCADE | Parent waypoint |
| markdown_content | TEXT | | Full rendered markdown |
| quiz_data_json | TEXT | | JSON array of quiz objects |
| executive_summary | TEXT | | Summary paragraph |
| key_takeaways | TEXT | | JSON array of takeaway strings |
| created_at | TEXT | DEFAULT datetime('now') | ISO timestamp |
| updated_at | TEXT | DEFAULT datetime('now') | ISO timestamp |

#### Table: tags
Stores unique topic tags for knowledge graph.

| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| name | TEXT | UNIQUE, NOT NULL | Tag name (lowercase) |
| created_at | TEXT | DEFAULT datetime('now') | ISO timestamp |

#### Table: waypoint_tags
Junction table linking waypoints to tags.

| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| waypoint_id | TEXT | NOT NULL, FK → waypoints(id) ON DELETE CASCADE | |
| tag_id | TEXT | NOT NULL, FK → tags(id) ON DELETE CASCADE | |
| | | PRIMARY KEY (waypoint_id, tag_id) | Composite key |

#### Table: quiz_attempts
Stores quiz performance for SRS tracking.

| Column | Type | Constraints | Description |
|:---|:---|:---|:---|
| id | TEXT | PRIMARY KEY | UUID v4 |
| waypoint_id | TEXT | NOT NULL, FK → waypoints(id) ON DELETE CASCADE | |
| question_index | INTEGER | NOT NULL | Index of question in quiz array |
| is_correct | INTEGER | NOT NULL | 1 if correct, 0 if wrong |
| attempted_at | TEXT | DEFAULT datetime('now') | ISO timestamp |

#### Indexes
```sql
CREATE INDEX idx_waypoints_expedition ON waypoints(expedition_id);
CREATE INDEX idx_waypoints_youtube ON waypoints(youtube_id);
CREATE INDEX idx_field_guides_waypoint ON field_guides(waypoint_id);
CREATE INDEX idx_waypoint_tags_waypoint ON waypoint_tags(waypoint_id);
CREATE INDEX idx_quiz_attempts_waypoint ON quiz_attempts(waypoint_id);
```

---

### 5.2 IPC (Inter-Process Communication) API

The Electron main process exposes these APIs to the renderer via `window.atlased`:

#### Expeditions API
```javascript
window.atlased.expeditions = {
  getAll(): Promise<Expedition[]>,
  getById(id: string): Promise<Expedition>,
  create(data: CreateExpeditionData): Promise<Expedition>,
  update(id: string, data: UpdateExpeditionData): Promise<void>,
  delete(id: string): Promise<void>
}
```

#### Waypoints API
```javascript
window.atlased.waypoints = {
  getByExpedition(expeditionId: string): Promise<Waypoint[]>,
  getById(id: string): Promise<Waypoint>,
  update(id: string, data: UpdateWaypointData): Promise<void>,
  updateWatchPosition(id: string, position: number): Promise<void>,
  markAsCharted(id: string): Promise<void>
}
```

#### Field Guides API
```javascript
window.atlased.fieldGuides = {
  getByWaypoint(waypointId: string): Promise<FieldGuide | null>,
  save(waypointId: string, data: FieldGuideData): Promise<void>
}
```

#### Settings API
```javascript
window.atlased.settings = {
  get(key: string): Promise<string | null>,
  set(key: string, value: string): Promise<void>,
  getAll(): Promise<Settings>
}
```

#### AI API
```javascript
window.atlased.ai = {
  generateFieldGuide(waypointId: string): Promise<GenerationResult>,
  generateQuizzes(waypointId: string): Promise<GenerationResult>,
  chat(waypointId: string, message: string, history: ChatMessage[]): Promise<ChatResult>
}
```

#### Transcript API
```javascript
window.atlased.transcript = {
  fetch(youtubeId: string): Promise<TranscriptResult>
}
```

#### Window API
```javascript
window.atlased.window = {
  minimize(): void,
  maximize(): void,
  close(): void,
  isMaximized(): Promise<boolean>
}
```

---

### 5.3 External API Integration

#### YouTube Transcript Fetching

**Method:** Server-side fetch using `youtube-transcript` npm package or direct API call

**Fallback Strategy:**
1. Try `youtube-transcript` package (no quota)
2. If fails, try YouTube Data API captions endpoint (uses quota)
3. If fails, prompt for manual transcript entry

**Transcript Response Format:**
```javascript
{
  success: true,
  transcript: "Full concatenated transcript text here...",
  segments: [
    { text: "Hello and welcome", start: 0, duration: 2.5 },
    { text: "to this tutorial", start: 2.5, duration: 1.8 },
    // ...
  ]
}
```

#### Gemini API

**Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`

**Authentication:** API key passed as query parameter `?key=API_KEY`

**Request Format:**
```javascript
{
  contents: [
    {
      parts: [
        { text: "System prompt + user content here" }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 4096
  }
}
```

**Response Parsing:**
```javascript
const responseText = response.candidates[0].content.parts[0].text;
// Parse JSON from code block if present
const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
const data = JSON.parse(jsonMatch[1]);
```

---

### 5.4 AI Prompt Templates

#### Prompt A: Field Guide Generation

```
You are an expert educational content creator. Analyze the following video transcript and create a comprehensive Field Guide for a student learning this material.

**Video Title:** {videoTitle}

**Transcript:**
{transcript}

**Instructions:**
Create study materials that help with active recall and long-term retention. Focus on clarity and actionable learning.

**Output Format (JSON):**
{
  "executive_summary": "2-3 sentence overview of the video content",
  "key_concepts": [
    {
      "title": "Concept Name",
      "explanation": "Clear explanation in 2-3 sentences",
      "tags": ["tag1", "tag2"]
    }
  ],
  "code_examples": [
    {
      "language": "python",
      "code": "example code here",
      "explanation": "What this code demonstrates"
    }
  ],
  "key_takeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3"]
}

Extract 3-5 key concepts with relevant tags. Include code examples if the video covers programming. Respond with only the JSON, no additional text.
```

#### Prompt B: Quiz Generation

```
You are an expert educational assessor. Based on the following video transcript, create comprehension quizzes that test understanding.

**Video Title:** {videoTitle}

**Transcript:**
{transcript}

**Instructions:**
Create 2-3 multiple choice questions that test genuine comprehension, not surface-level memorization. Each question should have 4 plausible options.

**Output Format (JSON):**
{
  "quizzes": [
    {
      "question": "What is the main purpose of X?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0,
      "explanation": "Brief explanation of why this answer is correct"
    }
  ]
}

Rules:
- Create 2-3 quizzes per video
- Questions should test conceptual understanding
- All options must be plausible (no obviously wrong answers)
- Explanations should reinforce the correct concept

Respond with only the JSON, no additional text.
```

#### Prompt C: Chat Response

```
You are an expert tutor helping a student understand educational video content.

**Video Title:** {videoTitle}

**Video Transcript:**
{transcript}

**Previous Conversation:**
{previousMessages formatted as "User: ... \n Assistant: ..."}

**Student's Question:**
{userMessage}

**Instructions:**
Answer the student's question based on the video content. Be concise, clear, and helpful. If the question is not related to the video content, politely redirect to the video topics. Use markdown formatting for code examples and emphasis where appropriate.
```

---

## 6. Error Handling

### 6.1 Error Categories and Responses

#### Network Errors

| Error | User Message | Recovery Action |
|:---|:---|:---|
| No internet connection | "You're offline. Some features are unavailable." | Show offline indicator, disable AI features, allow access to cached content |
| API request timeout | "Request timed out. Please try again." | Retry button, queue request for later |
| Server error (5xx) | "Service temporarily unavailable." | Automatic retry with exponential backoff |

#### API Errors

| Error | User Message | Recovery Action |
|:---|:---|:---|
| Invalid API key | "Your Gemini API key is invalid. Please update in Settings." | Link to settings page |
| Rate limit exceeded | "AI generation paused due to rate limits. Retrying in X seconds." | Queue requests, show countdown, auto-retry |
| Quota exceeded | "Daily API quota reached. Try again tomorrow." | Disable AI features until quota resets |

#### YouTube Errors

| Error | User Message | Recovery Action |
|:---|:---|:---|
| Transcript unavailable | "No captions available for this video." | Show manual transcript input option |
| Video unavailable | "This video is no longer available." | Mark waypoint as is_unavailable, preserve existing Field Guide |
| Playlist unavailable | "Unable to access this playlist. It may be private or deleted." | Clear error, allow different URL |

#### Data Errors

| Error | User Message | Recovery Action |
|:---|:---|:---|
| Malformed quiz data | (Silent) | Filter out invalid quizzes, show only valid ones |
| Database write error | "Unable to save. Please try again." | Retry operation |
| Invalid JSON from AI | "AI response was invalid. Regenerating..." | Automatic regeneration with slightly modified prompt |

---

## 7. Design Specifications

### 7.1 Design Tokens

#### Colors (Dark Theme — Default)

```css
/* Background */
--bg-primary: #0f0f0f;        /* Main app background */
--bg-secondary: #1a1a1a;      /* Card backgrounds */
--bg-tertiary: #252525;       /* Input backgrounds, hover states */

/* Text */
--text-primary: #ffffff;       /* Main text */
--text-secondary: #b3b3b3;     /* Muted text, descriptions */
--text-muted: #666666;         /* Subtle text, placeholders */

/* Accent - Warm Gold */
--primary: #d4a953;            /* Primary buttons, links, highlights */
--primary-hover: #e6be6a;      /* Primary hover state */
--primary-muted: rgba(212, 169, 83, 0.2); /* Primary backgrounds */

/* Semantic */
--accent-green: #4ade80;       /* Success, correct answers */
--accent-red: #f87171;         /* Error, incorrect answers */
--accent-blue: #60a5fa;        /* Info, links */

/* Borders */
--border-color: #2a2a2a;       /* Subtle borders */
--border-focus: var(--primary); /* Focus ring color */
```

#### Typography

```css
/* Font Families */
--font-primary: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
--font-heading: 'Merriweather', Georgia, serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */

/* Font Weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
```

#### Spacing

```css
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
```

#### Borders & Shadows

```css
/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;

/* Shadows */
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.2);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.3);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.4);
```

#### Transitions

```css
--transition-fast: 150ms ease;
--transition-base: 200ms ease;
--transition-slow: 300ms ease;
```

---

### 7.2 Component Specifications

#### Buttons

**Primary Button:**
- Background: var(--primary)
- Text: #0f0f0f (dark)
- Padding: 12px 24px
- Border Radius: var(--radius-md)
- Font Weight: 600
- Hover: Background lightens to var(--primary-hover)
- Active: Scale down slightly (transform: scale(0.98))

**Secondary Button:**
- Background: transparent
- Border: 1px solid var(--border-color)
- Text: var(--text-primary)
- Hover: Background var(--bg-tertiary)

**Ghost Button:**
- Background: transparent
- Text: var(--text-secondary)
- Hover: Text var(--text-primary), subtle background

#### Cards

**Expedition Card:**
- Background: var(--bg-secondary)
- Border: 1px solid var(--border-color)
- Border Radius: var(--radius-lg)
- Padding: 0 (image bleeds to edge)
- Hover: Border color var(--primary), subtle shadow
- Transition: var(--transition-base)

#### Input Fields

- Background: var(--bg-tertiary)
- Border: 1px solid var(--border-color)
- Border Radius: var(--radius-md)
- Padding: 12px 16px
- Focus: Border color var(--primary), subtle glow
- Placeholder: var(--text-muted)

#### Modals

- Overlay: rgba(0, 0, 0, 0.7) with backdrop-blur(4px)
- Modal Background: var(--bg-secondary)
- Border Radius: var(--radius-xl)
- Max Width: 480px (small), 640px (medium)
- Padding: 24px
- Animation: Scale up from 0.95 with fade in

---

### 7.3 Responsive Behavior

| Breakpoint | Layout Changes |
|:---|:---|
| < 1200px | Collapse right sidebar (Compass AI) |
| < 900px | Collapse left sidebar (Module Map) |
| < 768px | Full-screen viewport, access sidebars via buttons |

---

## 8. Dependencies

### 8.1 Runtime Dependencies

| Package | Version | Purpose |
|:---|:---|:---|
| react | ^19.0.0 | UI framework |
| react-dom | ^19.0.0 | React DOM rendering |
| react-router-dom | ^7.0.0 | Client-side routing |
| better-sqlite3 | ^12.0.0 | SQLite database (native) |
| electron-store | ^11.0.0 | Encrypted settings storage |
| uuid | ^13.0.0 | UUID generation |

### 8.2 Development Dependencies

| Package | Version | Purpose |
|:---|:---|:---|
| electron | ^39.0.0 | Desktop shell |
| electron-builder | ^26.0.0 | App packaging |
| vite | ^7.0.0 | Build tool & dev server |
| @vitejs/plugin-react | ^5.0.0 | React plugin for Vite |
| concurrently | ^9.0.0 | Run multiple scripts |
| wait-on | ^9.0.0 | Wait for dev server |
| cross-env | ^7.0.0 | Cross-platform env vars |
| eslint | ^9.0.0 | Code linting |

### 8.3 Future Dependencies (for pending features)

| Package | Purpose |
|:---|:---|
| react-force-graph | Knowledge Graph visualization |
| react-markdown | Markdown rendering (if not using custom renderer) |
| prismjs or highlight.js | Syntax highlighting |

---

## 9. File Structure

```
AtlasED/
├── electron/
│   ├── main.js              # Electron main process entry
│   ├── preload.cjs          # Context bridge setup
│   ├── database/
│   │   ├── init.js          # Database initialization, schema
│   │   └── queries.js       # CRUD operations
│   └── services/
│       ├── gemini.js        # Gemini API integration
│       └── transcript.js    # YouTube transcript fetching
│
├── src/
│   ├── main.jsx             # React entry point
│   ├── App.jsx              # Root component with routing
│   ├── index.css            # Global styles, design system
│   ├── components/
│   │   ├── TitleBar.jsx
│   │   ├── Dashboard.jsx
│   │   ├── ExpeditionView.jsx
│   │   ├── VideoPlayer.jsx
│   │   ├── QuizSection.jsx
│   │   ├── Settings.jsx
│   │   ├── ApiKeyModal.jsx
│   │   └── NewExpeditionModal.jsx
│   └── utils/
│       └── youtube.js       # URL parsing, duration formatting
│
├── public/
│   └── icon.ico             # App icon
│
├── index.html               # HTML entry point
├── vite.config.js           # Vite configuration
├── package.json             # Dependencies and scripts
└── PROJECT_DOCUMENTATION.md # This document
```

---

## 10. Development Phases

### Phase 1: Foundation (Complete)
- [x] Electron + React + Vite setup with custom title bar
- [x] SQLite database with full schema
- [x] IPC handlers for all CRUD operations
- [x] Settings management with encryption
- [x] Dashboard with expedition cards
- [x] New Expedition modal with YouTube ingestion

### Phase 2: Core Learning (Complete)
- [x] Video Player with YouTube IFrame API
- [x] Watch position saving and resume
- [x] Transcript fetching service
- [x] Field Guide generation with Gemini
- [x] Field Guide display with Markdown rendering
- [x] Quiz generation and display
- [x] Compass AI chat sidebar

### Phase 3: Engagement (Pending)
- [ ] Mid-stream quiz auto-pause at timestamps
- [ ] Quiz attempt persistence to database
- [ ] Performance-based scoring feedback
- [ ] Keyboard shortcuts

### Phase 4: Retention (Pending)
- [ ] Tag extraction from Field Guides
- [ ] Knowledge Graph (The Atlas) visualization
- [ ] Memory Checkpoint scheduling
- [ ] Review queue on dashboard

### Phase 5: Polish (Pending)
- [ ] PDF export of Field Guides
- [ ] Global search across content
- [ ] Learning analytics
- [ ] Light theme option

---

## Appendix A: YouTube URL Parsing

```javascript
/**
 * Extracts video ID from various YouTube URL formats
 */
function extractVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Extracts playlist ID from YouTube URL
 */
function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

/**
 * Formats seconds into MM:SS or HH:MM:SS
 */
function formatDuration(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
```

---

## Appendix B: Quiz Data Validation

```javascript
/**
 * Validates quiz object structure
 * Returns true if quiz is valid and can be displayed
 */
function isValidQuiz(quiz) {
  return (
    quiz &&
    typeof quiz.question === 'string' &&
    quiz.question.length > 0 &&
    Array.isArray(quiz.options) &&
    quiz.options.length >= 2 &&
    quiz.options.length <= 6 &&
    quiz.options.every(opt => typeof opt === 'string') &&
    typeof quiz.correct_index === 'number' &&
    quiz.correct_index >= 0 &&
    quiz.correct_index < quiz.options.length
  );
}

/**
 * Filters array of quizzes to only valid ones
 */
function filterValidQuizzes(quizzes) {
  if (!Array.isArray(quizzes)) return [];
  return quizzes.filter(isValidQuiz);
}
```

---

*End of Product Requirements Document*
