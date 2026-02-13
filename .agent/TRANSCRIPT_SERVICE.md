# Transcript Service - Updated February 1, 2026

## Overview

The transcript service has been completely refactored to use a more reliable approach for fetching YouTube video transcripts.

## Current Implementation

### Primary Method: Python `youtube-transcript-api`

The transcript service now uses the Python `youtube-transcript-api` library, which provides:

- ✅ **Auto-generated captions** - Works for ~95% of YouTube videos
- ✅ **Manual captions** - Also fetches manually created subtitles
- ✅ **Multi-language support** - Prefers English but falls back to any available language
- ✅ **No API limits** - Completely local, no rate limits
- ✅ **Fast** - Just fetches existing captions, no audio download needed

### Requirements

- **Python 3.x** - Must be installed and in PATH
- **youtube-transcript-api** - Install with: `pip install youtube-transcript-api`

### How It Works

1. Node.js writes a Python script to a temp file
2. Python executes and fetches transcript using youtube-transcript-api
3. Result is parsed and returned to the Electron app
4. Temp file is cleaned up

## Removed Features

The following features have been **removed** as they are no longer needed:

### ❌ Audio Transcription (Removed)
- No longer downloads YouTube audio with yt-dlp
- No longer uses Gemini API for audio-to-text transcription
- **Reason:** Slow, complex, API rate limits, unreliable

### ❌ npm youtube-transcript Package (Removed)
- Removed dependency on `youtube-transcript` npm package
- **Reason:** Replaced by more reliable Python library that handles auto-generated captions better

## AI Generation

The Gemini API is still used for:
- Generating Field Guide content from transcripts
- Generating quiz questions

Current model: **gemini-3-flash-preview**
- Free tier: 250 requests/day, 20-25 RPM
- Fast and capable

## File Structure

```
electron/services/
├── transcript.js    # Fetches transcripts using Python youtube-transcript-api
└── gemini.js        # Generates Field Guide and Quizzes using Gemini AI
```

## Error Handling

The service handles common errors:
- Python not installed
- youtube-transcript-api not installed
- Transcripts disabled for video
- Video unavailable
- Network timeouts (30 second limit)

## Future Improvements

- Add transcript caching to avoid re-fetching
- Support for manual transcript input as fallback
- Offline mode for previously fetched transcripts
