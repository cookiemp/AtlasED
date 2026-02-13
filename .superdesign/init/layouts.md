# AtlasED Layouts

## App Structure

```
┌─────────────────────────────────────┐
│           TitleBar                  │  <- 48px height, fixed
│  (Logo + Nav + Window Controls)     │
├─────────────────────────────────────┤
│                                     │
│         Main Content Area           │  <- Routes render here
│                                     │
└─────────────────────────────────────┘
```

## TitleBar Component

**File:** `src/components/TitleBar.jsx`

Custom title bar for Electron with:
- Logo + "ATLASED" brand
- Home and Settings navigation buttons
- Window controls (minimize, maximize, close)
- 48px height, glassmorphism effect

```jsx
function TitleBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="titlebar">
      <div className="titlebar__logo" onClick={() => navigate('/')}>
        <CompassIcon />
        <span>ATLASED</span>
      </div>
      <div className="flex items-center gap-md" style={{ WebkitAppRegion: 'no-drag' }}>
        <button className={`btn btn--ghost btn--icon ${location.pathname === '/' ? 'text-gold' : ''}`} onClick={() => navigate('/')}>
          <HomeIcon />
        </button>
        <button className={`btn btn--ghost btn--icon ${location.pathname === '/settings' ? 'text-gold' : ''}`} onClick={() => navigate('/settings')}>
          <SettingsIcon />
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--border-color)', margin: '0 8px' }} />
        <div className="titlebar__controls">
          <button className="titlebar__btn" onClick={handleMinimize}><MinimizeIcon /></button>
          <button className="titlebar__btn" onClick={handleMaximize}><MaximizeIcon /></button>
          <button className="titlebar__btn titlebar__btn--close" onClick={handleClose}><CloseIcon /></button>
        </div>
      </div>
    </div>
  );
}
```

## Page Layout Patterns

### Dashboard Page
- Simple centered content
- Header with title + subtitle
- Grid of expedition cards

### Settings Page
- Max-width container (600px)
- Sections with icons
- Form rows with labels

### Expedition View
- Max-width container (1000px)
- Back button + title header
- Progress bar card
- List of waypoint rows

### Video Player (Cockpit)
**Three-column layout:**
```
┌─────────┬──────────────────┬──────────┐
│         │                  │          │
│  LEFT   │     CENTER       │  RIGHT   │
│ Sidebar │    Viewport      │ Sidebar  │
│(300px)  │   (flexible)     │ (320px)  │
│         │                  │          │
│ Module  │   Video Player   │ Compass  │
│  Map    │   + Field Guide  │   AI     │
│         │                  │          │
└─────────┴──────────────────┴──────────┘
```

- **Left Sidebar (300px):** Module Map - list of waypoints with timeline/progress
- **Center (flexible):** Sticky video player + scrollable Field Guide content
- **Right Sidebar (320px):** Compass AI chat interface with tabs

## Modal Pattern

Modals use overlay + centered card:
- `.modal-overlay` - Full screen, backdrop blur
- `.modal` - Centered card with max-width
- Header, body, footer structure

