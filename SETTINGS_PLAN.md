# Settings Page — Implementation Plan

> **Generated:** Feb 26, 2026  
> **Status:** ✅ All phases implemented (Mar 1, 2026)

---

## Implementation Summary

### Phase 1 — Fix Broken Things ✅

- [x] **Fixed toggle mapping bug** — `autoGenerateFieldGuides` now uses its own `auto_field_guide` store key
- [x] **Removed Dark Mode toggle** — the app is dark-only; removed the misleading toggle
- [x] **Added `auto_field_guide`** to `STORE_SCHEMA` in `main.js` and `Settings` type in `electron.ts`

### Phase 2 — Wire Up Saved Settings ✅

- [x] **Playback Speed → VideoPlayer** — loads `playback_speed` from settings on mount and applies it via YouTube's `setPlaybackRate` postMessage API whenever the video starts playing
- [x] **SRS Enabled → Dashboard** — `ReviewsDue` now checks `srs_enabled` setting; if `false`, the entire Memory Checkpoints section is hidden

### Phase 3 — Implement Data & Privacy Actions ✅

- [x] **Export Learning Data** — gathers all expeditions, waypoints, field guides, notes, and bookmarks into a JSON file and triggers a browser download
- [x] **Clear Cache** — clears all cached transcripts from waypoints with a confirmation dialog, shows count of cleared items
- [x] **Replaced Privacy Policy link** — replaced the non-functional link with a privacy info line ("All data stored locally...")

### Phase 4 — Footer Links ✅

- [x] **Simplified footer** — removed non-functional Documentation/Support links, kept GitHub as an `<a>` tag

### Bonus — UX Improvements ✅

- [x] **Toast notifications** — Save, Export, and Clear Cache now show success/error toasts
- [x] **Removed unused `FileText` import**

---

## Files Modified

| File | Changes |
|---|---|
| `electron/main.js` | Added `auto_field_guide` to store schema |
| `src/types/electron.ts` | Added `auto_field_guide` to Settings interface |
| `src/pages/Settings.tsx` | Complete rewrite: fixed toggles, added Export/Clear Cache handlers, toast system, cleaned footer |
| `src/pages/VideoPlayer.tsx` | Added playback speed loading and YouTube iframe integration |
| `src/components/dashboard/ReviewsDue.tsx` | Added `srs_enabled` check to conditionally render |
