# AtlasED Redesign Implementation Plan

## Overview
Transform AtlasED UI based on 8 SuperDesign-generated screens while maintaining existing functionality.

## Design System Changes

### Color Palette Update
**Current (warm brown):**
- `--atlas-dark: #16140d`
- `--atlas-panel: #262319`
- `--atlas-border: #433d28`
- `--primary: #d4af35`

**New (dark charcoal):**
- `--bg-primary: #0f0f0f`
- `--bg-secondary: #1a1a1a`
- `--bg-tertiary: #242424`
- `--accent-gold: #d4a953`
- `--border-subtle: #2a2a2a`

### Typography Update
**Current:** Inter, Merriweather, JetBrains Mono
**New:** Satoshi, Cabinet Grotesk, JetBrains Mono (via Fontshare)

### Icon System Update
**Current:** Inline SVG components
**New:** Lucide icons via Iconify (`<iconify-icon>`)

---

## Component Migration Plan

### Phase 1: Foundation (CSS + Base Components)
1. **Update index.css**
   - Replace color variables with new palette
   - Add new utility classes from designs
   - Keep existing component classes for compatibility
   - Add Iconify script to index.html

2. **Update TitleBar.jsx**
   - Already similar to design, minor tweaks needed
   - Ensure drag-region classes work

### Phase 2: Core Pages (High Priority)

#### 1. Dashboard.jsx
**Current:** Simple grid with expedition cards
**New Design:** 
- Grid with gradient thumbnails
- Activity timeline section
- Learning tips cards
- Memory checkpoint badges on cards
- Delete button appears on hover

**Implementation Notes:**
- Keep existing data fetching logic
- Add new activity/tips sections as static/demo for now
- Update card design with new hover effects
- Add "Memory Checkpoint Due" badges

#### 2. NewExpeditionModal.jsx
**Current:** Basic modal with URL input
**New Design:**
- Enhanced modal with icon headers
- Video preview grid with thumbnails
- Loading state with spinner
- Error state with retry
- Clear URL button

**Implementation Notes:**
- Keep existing form logic
- Add video preview grid (show thumbnails of videos in playlist)
- Add loading/error states as designed

#### 3. ExpeditionView.jsx
**Current:** Simple list with thumbnails
**New Design:**
- Table layout with columns: Waypoint, Duration, Status, Field Guide, Quiz, Last Viewed
- Filter tabs: All, In Progress, Completed, Not Started
- Sort dropdown
- Progress stats cards at top
- "CURRENT" badge for active waypoint

**Implementation Notes:**
- Keep existing waypoint loading logic
- Add filter/sort state management
- Add table view alongside existing list view (or replace)
- Add status badges (Completed, In Progress, Not Started)

#### 4. VideoPlayer.jsx
**Current:** 3-column layout with left nav, center video, right chat
**New Design:**
- Similar 3-column structure but refined styling
- Left: Module Map (waypoint navigation) - mostly unchanged
- Center: Video + Field Guide with tabs
- Right: Compass AI / My Notes tabs

**Implementation Notes:**
- Keep existing YouTube player integration
- Keep existing chat/AI functionality
- Update styling to match new design
- Field Guide tab should show generated notes

#### 5. Settings.jsx
**Current:** Simple form sections
**New Design:**
- Card-based sections with icons
- API Configuration card with validate button
- Learning Preferences toggles
- Playback Speed radio buttons
- Data & Privacy section
- Better visual hierarchy

**Implementation Notes:**
- Keep existing settings logic
- Reorganize into card sections
- Add API key validation UI
- Add toggle switches for preferences

### Phase 3: Enhanced Components

#### 6. QuizSection.jsx
**Current:** Basic quiz card with options
**New Design:**
- Full modal overlay
- Progress bar at top
- Code context block
- Multiple choice with A/B/C/D labels
- Explanation panel after answering
- Next/Skip buttons

**Implementation Notes:**
- Keep existing quiz logic
- Update UI to match modal design
- Add explanation reveal animation
- Add progress tracking

### Phase 4: New Pages (Medium Priority)

#### 7. MemoryCheckpoints.jsx (New)
**Design:**
- Stats header (Due Today, Upcoming, Completed)
- Filter/sort controls
- Due Today section with checkpoint cards
- Upcoming section with timeline cards
- Difficulty badges (Easy/Medium/Hard)
- Retention strength progress bars

**Implementation Notes:**
- New route: `/memory-checkpoints`
- Need database schema for SRS data (may need migration)
- Create placeholder data for initial implementation

#### 8. KnowledgeGraph.jsx (New)
**Design:**
- D3.js force-directed graph
- Node types: Fundamentals, Advanced, Practical, Theory
- Filter panel (category checkboxes)
- Sidebar with node details
- Zoom/pan controls
- Legend panel

**Implementation Notes:**
- New route: `/atlas`
- Requires D3.js dependency
- Create sample graph data
- Implement node click → sidebar details

---

## Implementation Order

### Sprint 1: Foundation + Dashboard
1. Update CSS variables
2. Update Dashboard.jsx with new design
3. Update NewExpeditionModal.jsx
4. Test and verify

### Sprint 2: Core Learning Flow
1. Update ExpeditionView.jsx
2. Update VideoPlayer.jsx
3. Update QuizSection.jsx
4. Test navigation flow

### Sprint 3: Settings & Polish
1. Update Settings.jsx
2. Add new icon system (Iconify)
3. Update TitleBar if needed
4. Full app testing

### Sprint 4: New Features
1. Create MemoryCheckpoints.jsx
2. Create KnowledgeGraph.jsx
3. Add routes to App.jsx
4. Add navigation links

---

## Key Technical Considerations

### 1. Icon Migration
```javascript
// Current:
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

// New approach:
// Use iconify-icon web component
<iconify-icon icon="lucide:plus" className="text-lg"></iconify-icon>
```

Need to add to index.html:
```html
<script src="https://code.iconify.design/iconify-icon/1.0.7/iconify-icon.min.js"></script>
```

### 2. Color Variables
Map old → new:
- `--atlas-dark` → `--bg-primary: #0f0f0f`
- `--atlas-panel` → `--bg-secondary: #1a1a1a`
- `--atlas-border` → `--border-subtle: #2a2a2a`
- `--primary` → `--accent-gold: #d4a953`

### 3. Font Loading
Add to index.html:
```html
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700&f[]=cabinet-grotesk@400,500,700,800&display=swap" rel="stylesheet">
```

### 4. Maintaining Functionality
- All IPC calls stay the same
- Database queries remain unchanged
- State management logic preserved
- Only UI layer changes

---

## Testing Checklist

### Visual
- [ ] All colors match new palette
- [ ] Typography uses new fonts
- [ ] Icons display correctly
- [ ] Responsive layouts work
- [ ] Animations/transitions smooth

### Functional
- [ ] Can create new expedition
- [ ] Can navigate between pages
- [ ] Video player works
- [ ] Field Guide generates
- [ ] AI chat works
- [ ] Quizzes display and function
- [ ] Settings save correctly
- [ ] Progress tracking works

### Edge Cases
- [ ] Empty states look good
- [ ] Loading states visible
- [ ] Error states handled
- [ ] Long titles truncate properly
- [ ] Mobile responsive (if applicable)

---

## Files to Modify

### High Priority
1. `src/index.css` - Update design system
2. `src/index.html` - Add fonts and Iconify
3. `src/components/Dashboard.jsx` - Redesign
4. `src/components/NewExpeditionModal.jsx` - Redesign
5. `src/components/ExpeditionView.jsx` - Redesign
6. `src/components/VideoPlayer.jsx` - Redesign
7. `src/components/Settings.jsx` - Redesign
8. `src/components/QuizSection.jsx` - Redesign

### Medium Priority
9. `src/App.jsx` - Add new routes
10. `src/components/TitleBar.jsx` - Minor updates

### New Files
11. `src/components/MemoryCheckpoints.jsx`
12. `src/components/KnowledgeGraph.jsx`

---

## Risk Mitigation

1. **Breaking Changes**: Make CSS changes additive first, then remove old
2. **Functionality Loss**: Test each component after update
3. **Performance**: Iconify loads icons on-demand, should be fast
4. **Dependencies**: D3.js for knowledge graph adds bundle size

---

## Success Criteria

1. All 8 designs implemented
2. Existing functionality preserved
3. No console errors
4. App feels more polished and modern
5. User can complete full learning flow
