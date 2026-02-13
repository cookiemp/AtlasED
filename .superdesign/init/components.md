# AtlasED UI Components

## Component Inventory

This project uses **vanilla CSS** (no Tailwind) with a custom design system defined in `src/index.css`. Components are built as React function components with inline SVG icons.

### Base UI Patterns

The project follows BEM naming convention with these base classes:

**Buttons (`.btn`)**
- `.btn--primary` - Gold background, dark text
- `.btn--secondary` - Panel background, border
- `.btn--ghost` - Transparent background
- `.btn--icon` - Icon-only button (36x36)
- `.btn--lg` - Large size variant

**Cards (`.card`)**
- Base card with hover effects
- `.expedition-card` - Dashboard expedition cards
- `.quiz-card` - Quiz component

**Inputs (`.input`)**
- Base input with focus states
- `.input--lg` - Large variant
- `.input-group` - Label + input wrapper

**Modal (`.modal`, `.modal-overlay`)**
- Overlay with backdrop blur
- Header, body, footer sections

### Components

All components are in `src/components/`:

1. **TitleBar.jsx** - App title bar with navigation and window controls
2. **Dashboard.jsx** - Main dashboard with expedition grid
3. **ExpeditionView.jsx** - Expedition detail with waypoint list
4. **VideoPlayer.jsx** - Three-column video player with Field Guide and Compass AI
5. **Settings.jsx** - Settings page with API keys and preferences
6. **NewExpeditionModal.jsx** - Modal for creating new expeditions
7. **QuizSection.jsx** - Quiz component for video content
8. **ApiKeyModal.jsx** - API key input modal

### Icons

All icons are inline SVG components defined at the top of each file:
- PlusIcon, MapIcon, DeleteIcon
- ArrowLeftIcon, PlayIcon, CheckIcon
- BookIcon, ListIcon, SendIcon, RobotIcon
- CompassIcon, MinimizeIcon, MaximizeIcon, CloseIcon
- SettingsIcon, HomeIcon
- KeyIcon, EyeIcon, EyeOffIcon
- LinkIcon, LoaderIcon
