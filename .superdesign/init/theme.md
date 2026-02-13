# AtlasED Theme & Design System

## Overview

AtlasED uses a **premium dark-mode aesthetic** with glassmorphism and gold accents. It's an Electron desktop app for transforming YouTube playlists into interactive learning courses.

**CSS Approach:** Vanilla CSS only (no Tailwind), defined in `src/index.css`

## Color Palette

### Brand Colors
```css
--primary: #d4af35;              /* Gold - primary accent */
--primary-hover: #e5bd3a;        /* Lighter gold on hover */
--bg-light: #f8f7f6;             /* Light mode background */
--bg-dark: #201d12;              /* Dark background */
--atlas-dark: #16140d;           /* Deepest background */
--atlas-panel: #262319;          /* Card/panel background */
--atlas-border: #433d28;         /* Border color */
```

### Semantic Mappings
```css
--bg-primary: var(--atlas-dark);
--bg-secondary: var(--atlas-panel);
--bg-tertiary: var(--bg-dark);
--bg-glass: rgba(38, 35, 25, 0.8);
--bg-hover: rgba(212, 175, 53, 0.1);
```

### Accent Colors
```css
--accent-gold: var(--primary);
--accent-gold-light: #eec84b;
--accent-gold-dark: #b8962a;
--accent-red: #e74c3c;
--accent-green: #27ae60;
--accent-blue: #3498db;
```

### Text Colors
```css
--text-primary: #ffffff;         /* White - headings, primary text */
--text-secondary: #c3b998;       /* Beige - body text */
--text-tertiary: #8a8168;        /* Muted beige - captions */
--text-muted: #605739;           /* Dark muted - placeholders */
```

## Typography

### Font Families
```css
--font-display: 'Inter', sans-serif;       /* UI, headings */
--font-serif: 'Merriweather', serif;       /* Titles, emphasis */
--font-mono: 'JetBrains Mono', monospace;  /* Code, metadata */
```

### Font Sizes
```css
--font-size-xs: 0.75rem;    /* 12px - captions, badges */
--font-size-sm: 0.875rem;   /* 14px - secondary text */
--font-size-base: 1rem;     /* 16px - body */
--font-size-lg: 1.125rem;   /* 18px - lead text */
--font-size-xl: 1.25rem;    /* 20px - small headings */
--font-size-2xl: 1.5rem;    /* 24px - headings */
--font-size-3xl: 1.875rem;  /* 30px - large headings */
--font-size-4xl: 2.25rem;   /* 36px - hero titles */
```

## Spacing Scale

```css
--space-xs: 0.25rem;   /* 4px */
--space-sm: 0.5rem;    /* 8px */
--space-md: 1rem;      /* 16px */
--space-lg: 1.5rem;    /* 24px */
--space-xl: 2rem;      /* 32px */
--space-2xl: 3rem;     /* 48px */
```

## Border Radius

```css
--radius-sm: 0.5rem;    /* 8px - small elements */
--radius-md: 1rem;      /* 16px - buttons, inputs */
--radius-lg: 1.5rem;    /* 24px - cards */
--radius-xl: 2rem;      /* 32px - large cards */
--radius-full: 9999px;  /* Pills, circles */
```

## Shadows

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.3);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.4);
--shadow-glow: 0 0 15px rgba(212, 175, 53, 0.2);
```

## Transitions

```css
--transition-fast: 0.15s ease;
--transition-base: 0.2s ease;
--transition-slow: 0.3s ease;
```

## Layout Constants

```css
--titlebar-height: 48px;
```

## Visual Style

### Dark Mode (Primary)
- Background: Deep charcoal (#16140d)
- Panels: Slightly lighter (#262319)
- Borders: Subtle gold-tinted (#433d28)
- Accents: Gold (#d4af35)

### Light Mode (Optional)
- Background: Off-white (#f8f7f6)
- Text adapts accordingly

### Effects
- Glassmorphism: `backdrop-filter: blur(12px)` on title bar
- Hover states: Gold glow, slight lift
- Progress bars: Gold fill
- Active states: Gold border/shadow

## Key Components Style

### Buttons
- **Primary:** Gold bg, dark text, glow shadow
- **Secondary:** Panel bg, border, subtle hover
- **Ghost:** Transparent, gold on hover

### Cards
- Panel background
- Gold border on hover
- Subtle shadow

### Inputs
- Dark background (atlas-dark)
- Gold focus ring
- Monospace font for technical inputs

### Progress Bars
- Background: atlas-border
- Fill: primary (gold)

