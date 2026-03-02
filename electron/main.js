import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import { initDatabase } from './database/init.js';
import * as queries from './database/queries.js';
import Store from 'electron-store';
import { fetchTranscriptWithFallback } from './services/transcript.js';
import { generateFieldGuide, generateQuizzes, validateApiKey, chatWithAI, generateExpeditionSummary } from './services/gemini.js';
import ytpl from '@distube/ytpl';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Get or generate a unique encryption key for this installation
 * Key is stored in userData directory with restricted permissions
 */
function getEncryptionKey() {
    const keyPath = path.join(app.getPath('userData'), '.atlased-key');

    try {
        // Try to read existing key
        if (fs.existsSync(keyPath)) {
            return fs.readFileSync(keyPath, 'utf8');
        }

        // Generate new secure key (32 bytes = 256 bits)
        const key = crypto.randomBytes(32).toString('hex');

        // Write key with restricted permissions (owner read/write only)
        fs.writeFileSync(keyPath, key, { mode: 0o600 });

        return key;
    } catch (error) {
        console.error('Failed to get/generate encryption key:', error);
        // Fallback: generate a temporary key (will change on restart, but better than hardcoded)
        return crypto.randomBytes(32).toString('hex');
    }
}

// Store schema — single source of truth (no duplication)
const STORE_SCHEMA = {
    gemini_api_key: { type: 'string', default: '' },
    theme: { type: 'string', default: 'dark' },
    auto_quiz: { type: 'boolean', default: true },
    auto_field_guide: { type: 'boolean', default: true },
    playback_speed: { type: 'number', default: 1.0 },
    srs_enabled: { type: 'boolean', default: true },
    srs_intervals: { type: 'array', default: [1, 3, 7, 14] }
};

/**
 * Initialize electron-store with proper error handling
 * If decryption fails (due to key change), clears store and starts fresh
 */
function initStore() {
    const encryptionKey = getEncryptionKey();

    try {
        // Try to create store with current key
        return new Store({ encryptionKey, schema: STORE_SCHEMA });
    } catch (error) {
        // If decryption fails, clear store and recreate
        if (error.message?.includes('not valid JSON') || error.message?.includes('Unexpected token')) {
            console.log('[Store] Decryption failed, clearing store and reinitializing...');

            // Clear the corrupted config file
            const configPath = path.join(app.getPath('userData'), 'config.json');
            try {
                if (fs.existsSync(configPath)) {
                    fs.unlinkSync(configPath);
                    console.log('[Store] Cleared corrupted config file');
                }
            } catch (clearError) {
                console.error('[Store] Failed to clear config:', clearError);
            }

            // Create fresh store
            return new Store({ encryptionKey, schema: STORE_SCHEMA });
        }

        // Re-throw other errors
        throw error;
    }
}

const store = initStore();

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1400,
        height: 900,
        minWidth: 1000,
        minHeight: 700,
        frame: false,
        titleBarStyle: 'hidden',
        backgroundColor: '#0a0e17',
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false // Required for better-sqlite3
        }
    });

    // Development: Load Vite dev server
    if (process.env.NODE_ENV === 'development') {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Production: Load built files
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

// Initialize database and create window
app.whenReady().then(() => {
    initDatabase();
    createWindow();

    // Configure CSP headers only for our own app pages
    // YouTube iframe content must NOT be restricted by our CSP
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const isOurApp = details.url.startsWith('http://localhost:') || details.url.startsWith('file://');
        if (isOurApp) {
            callback({
                responseHeaders: {
                    ...details.responseHeaders,
                    'Content-Security-Policy': [
                        "default-src 'self'; " +
                        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
                        "style-src 'self' 'unsafe-inline' https://api.fontshare.com; " +
                        "font-src 'self' https://cdn.fontshare.com; " +
                        "img-src 'self' data: https:; " +
                        "connect-src 'self' https://api.fontshare.com https://*.youtube.com https://*.googlevideo.com https://generativelanguage.googleapis.com; " +
                        "frame-src https://www.youtube.com https://youtube.com; " +
                        "media-src blob: https://*.youtube.com https://*.googlevideo.com;"
                    ]
                }
            });
        } else {
            // Let external content (YouTube, etc.) use their own CSP
            callback({ responseHeaders: details.responseHeaders });
        }
    });

    // Inject CSS into YouTube iframes to hide pause/end recommendations
    mainWindow.webContents.on('did-frame-finish-load', (event, isMainFrame) => {
        if (isMainFrame) return; // Only target sub-frames (YouTube iframes)
        try {
            const frames = mainWindow.webContents.mainFrame.frames;
            for (const frame of frames) {
                if (frame.url && frame.url.includes('youtube.com/embed')) {
                    frame.executeJavaScript(`(()=>{
                        if(window.__ytHideInjected)return;
                        window.__ytHideInjected=true;
                        const style = document.createElement('style');
                        style.textContent = \`
                            /* Hide pause/end overlays and suggestions */
                            .ytp-pause-overlay,
                            .ytp-pause-overlay-container,
                            .ytp-scroll-min .ytp-pause-overlay,
                            .ytp-endscreen-content,
                            .ytp-ce-element,
                            .ytp-cards-teaser,
                            .ytp-suggestion-set {
                                display: none !important;
                                visibility: hidden !important;
                                opacity: 0 !important;
                                pointer-events: none !important;
                            }
                        \`;
                        document.head.appendChild(style);
                    })()`).catch((err) => {
                        console.warn('[YouTube] Failed to inject hide styles:', err.message);
                    });
                }
            }
        } catch (e) {
            console.warn('[YouTube] Frame access error (may have navigated away):', e.message);
        }
    });

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// ============ IPC Handlers ============

// Window controls
ipcMain.handle('window:minimize', () => mainWindow.minimize());
ipcMain.handle('window:maximize', () => {
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
});
ipcMain.handle('window:close', () => mainWindow.close());

// Shell: open external URLs in default browser
ipcMain.handle('shell:openExternal', (_, url) => {
    // Only allow http/https URLs for security
    if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
        return shell.openExternal(url);
    }
});

// Settings
ipcMain.handle('settings:get', (_, key) => {
    try {
        const value = store.get(key);
        return value;
    } catch (error) {
        console.error(`[Settings] Error getting "${key}":`, error.message);
        return undefined;
    }
});
ipcMain.handle('settings:set', (_, key, value) => {
    try {
        store.set(key, value);
        return { success: true };
    } catch (error) {
        console.error(`[Settings] Error setting "${key}":`, error.message);
        return { success: false, error: error.message };
    }
});
ipcMain.handle('settings:getAll', () => {
    try {
        return store.store;
    } catch (error) {
        console.error('[Settings] Error getting all:', error.message);
        return {};
    }
});

// Database: Expeditions
ipcMain.handle('db:createExpedition', (_, data) => queries.createExpedition(data));
ipcMain.handle('db:getExpeditions', () => queries.getExpeditions());
ipcMain.handle('db:getExpedition', (_, id) => queries.getExpedition(id));
ipcMain.handle('db:deleteExpedition', (_, id) => queries.deleteExpedition(id));
ipcMain.handle('db:updateExpedition', (_, id, data) => queries.updateExpedition(id, data));

// Database: Waypoints
ipcMain.handle('db:createWaypoint', (_, data) => queries.createWaypoint(data));
ipcMain.handle('db:getWaypoints', (_, expeditionId) => queries.getWaypoints(expeditionId));
ipcMain.handle('db:getWaypoint', (_, id) => queries.getWaypoint(id));
ipcMain.handle('db:updateWaypointProgress', (_, id, position) => queries.updateWaypointProgress(id, position));
ipcMain.handle('db:markWaypointCharted', (_, id) => queries.markWaypointCharted(id));

// Database: Field Guides
ipcMain.handle('db:createFieldGuide', (_, data) => queries.createFieldGuide(data));
ipcMain.handle('db:getFieldGuide', (_, waypointId) => queries.getFieldGuide(waypointId));
ipcMain.handle('db:updateFieldGuide', (_, waypointId, data) => queries.updateFieldGuide(waypointId, data));

// Database: Tags
ipcMain.handle('db:createTag', (_, name) => queries.createTag(name));
ipcMain.handle('db:getTags', () => queries.getTags());
ipcMain.handle('db:addWaypointTag', (_, waypointId, tagId) => queries.addWaypointTag(waypointId, tagId));
ipcMain.handle('db:getWaypointTags', (_, waypointId) => queries.getWaypointTags(waypointId));

// Database: Quiz Attempts
ipcMain.handle('db:createQuizAttempt', (_, data) => queries.createQuizAttempt(data));
ipcMain.handle('db:getQuizAttempts', (_, waypointId) => queries.getQuizAttempts(waypointId));

// Database: Memory Checkpoints (SRS)
ipcMain.handle('db:getMemoryCheckpoints', () => queries.getMemoryCheckpoints());

// ============ Playlist Fetching ============

ipcMain.handle('ai:fetchPlaylist', async (_, url) => {
    try {
        // Check if it's a playlist URL
        const playlistMatch = url.match(/[?&]list=([^&]+)/);

        if (playlistMatch) {
            // It's a playlist URL — fetch all videos
            const playlist = await ytpl(playlistMatch[1], { limit: Infinity });
            return {
                success: true,
                isPlaylist: true,
                title: playlist.title,
                videos: playlist.items.map((item, index) => ({
                    youtube_id: item.id,
                    title: item.title,
                    thumbnail_url: item.bestThumbnail?.url || item.thumbnails?.[0]?.url || null,
                    duration_seconds: item.duration ? parseDuration(item.duration) : 0,
                    order_index: index,
                }))
            };
        } else {
            // It's a single video URL — extract video ID
            const videoIdMatch = url.match(
                /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/
            );
            if (!videoIdMatch) {
                return { success: false, error: 'Could not extract video ID from URL' };
            }
            return {
                success: true,
                isPlaylist: false,
                title: null,
                videos: [{
                    youtube_id: videoIdMatch[1],
                    title: null, // Will need to be set by user or fetched separately
                    thumbnail_url: `https://i.ytimg.com/vi/${videoIdMatch[1]}/mqdefault.jpg`,
                    duration_seconds: 0,
                    order_index: 0,
                }]
            };
        }
    } catch (error) {
        console.error('Playlist fetch error:', error);
        return { success: false, error: error.message || 'Failed to fetch playlist' };
    }
});

// Helper: parse "HH:MM:SS" or "MM:SS" duration string to seconds
function parseDuration(durationStr) {
    if (!durationStr) return 0;
    const parts = durationStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
}

// ============ AI Services ============

// Transcript fetching with fallback strategies
ipcMain.handle('ai:fetchTranscript', async (_, videoId) => {
    try {
        const apiKey = store.get('gemini_api_key');
        // Use fallback strategy: YouTube captions -> Audio transcription
        return await fetchTranscriptWithFallback(videoId, apiKey);
    } catch (error) {
        console.error('Transcript fetch error:', error);
        return {
            success: false,
            error: error.message,
            supportsManualInput: true
        };
    }
});

// Field Guide generation
ipcMain.handle('ai:generateFieldGuide', async (_, transcript, videoTitle) => {
    try {
        const apiKey = store.get('gemini_api_key');
        if (!apiKey) {
            return { success: false, error: 'No Gemini API key configured. Please add your API key in Settings.' };
        }
        return await generateFieldGuide(apiKey, transcript, videoTitle);
    } catch (error) {
        console.error('Field guide generation error:', error);
        return { success: false, error: error.message };
    }
});

// Quiz generation
ipcMain.handle('ai:generateQuizzes', async (_, transcript, videoTitle) => {
    try {
        const apiKey = store.get('gemini_api_key');
        if (!apiKey) {
            return { success: false, error: 'No Gemini API key configured. Please add your API key in Settings.' };
        }
        return await generateQuizzes(apiKey, transcript, videoTitle);
    } catch (error) {
        console.error('Quiz generation error:', error);
        return { success: false, error: error.message };
    }
});

// Expedition summary generation
ipcMain.handle('ai:generateExpeditionSummary', async (_, videoTitles) => {
    try {
        const apiKey = store.get('gemini_api_key');
        if (!apiKey) {
            return { success: false, error: 'No Gemini API key configured' };
        }
        return await generateExpeditionSummary(apiKey, videoTitles);
    } catch (error) {
        console.error('Expedition summary generation error:', error);
        return { success: false, error: error.message };
    }
});

// Validate API key
ipcMain.handle('ai:validateApiKey', async (_, apiKey) => {
    try {
        return await validateApiKey(apiKey);
    } catch (error) {
        console.error('API key validation error:', error);
        return { valid: false, error: error.message };
    }
});

// Update waypoint transcript
ipcMain.handle('db:updateWaypointTranscript', (_, id, transcript) => {
    return queries.updateWaypointTranscript(id, transcript);
});

// AI Chat
ipcMain.handle('ai:chat', async (_, message, transcript, videoTitle, previousMessages) => {
    try {
        const apiKey = store.get('gemini_api_key');
        if (!apiKey) {
            return { success: false, error: 'No Gemini API key configured. Please add your API key in Settings.' };
        }
        return await chatWithAI(apiKey, message, transcript, videoTitle, previousMessages);
    } catch (error) {
        console.error('AI chat error:', error);
        return { success: false, error: error.message };
    }
});

// Notes
ipcMain.handle('db:getNote', (_, waypointId) => {
    return queries.getNote(waypointId);
});

ipcMain.handle('db:upsertNote', (_, waypointId, content) => {
    return queries.upsertNote(waypointId, content);
});

// Knowledge Graph Data
ipcMain.handle('db:getKnowledgeGraphData', () => {
    return queries.getKnowledgeGraphData();
});

// Bookmarks
ipcMain.handle('db:createBookmark', (_, data) => queries.createBookmark(data));
ipcMain.handle('db:getBookmarks', (_, waypointId) => queries.getBookmarks(waypointId));
ipcMain.handle('db:updateBookmark', (_, id, data) => queries.updateBookmark(id, data));
ipcMain.handle('db:deleteBookmark', (_, id) => queries.deleteBookmark(id));

// Global Search
ipcMain.handle('db:globalSearch', (_, query) => queries.globalSearch(query));
