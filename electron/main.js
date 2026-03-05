import { app, BrowserWindow, ipcMain, shell } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { initDatabase } from './database/init.js';
import * as queries from './database/queries.js';
import Store from 'electron-store';
import { fetchTranscriptWithFallback } from './services/transcript.js';
import { generateFieldGuide, generateQuizzes, validateApiKey, chatWithAI, generateExpeditionSummary } from './services/gemini.js';

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
let localServer = null;
let localServerPort = null;

/**
 * Start a minimal HTTP server to serve the built frontend.
 * YouTube embeds refuse to work from file:// origins (Error 153),
 * so we serve via http://127.0.0.1:PORT instead.
 */
function startLocalServer(distPath) {
    return new Promise((resolve, reject) => {
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ico': 'image/x-icon',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
            '.ttf': 'font/ttf',
            '.webp': 'image/webp',
            '.webm': 'video/webm',
            '.mp4': 'video/mp4',
            '.wasm': 'application/wasm',
        };

        const server = http.createServer((req, res) => {
            // Parse URL and remove query string
            const urlPath = decodeURIComponent(req.url.split('?')[0]);
            let filePath = path.join(distPath, urlPath === '/' ? 'index.html' : urlPath);

            // Security: prevent directory traversal
            if (!filePath.startsWith(distPath)) {
                res.writeHead(403);
                res.end('Forbidden');
                return;
            }

            fs.stat(filePath, (err, stats) => {
                if (err || !stats.isFile()) {
                    // SPA fallback: serve index.html for any non-file route
                    filePath = path.join(distPath, 'index.html');
                }

                fs.readFile(filePath, (readErr, data) => {
                    if (readErr) {
                        res.writeHead(404);
                        res.end('Not found');
                        return;
                    }
                    const ext = path.extname(filePath).toLowerCase();
                    const contentType = mimeTypes[ext] || 'application/octet-stream';
                    res.writeHead(200, { 'Content-Type': contentType });
                    res.end(data);
                });
            });
        });

        // Listen on a random available port, bound to localhost only
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            console.log(`[LocalServer] Serving dist on http://127.0.0.1:${port}`);
            resolve({ server, port });
        });

        server.on('error', reject);
    });
}

async function createWindow() {
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
        // Production: Serve built files via local HTTP server
        // This gives YouTube embeds a proper http:// origin (fixes Error 153)
        let distPath = path.join(__dirname, '../dist');
        // When packed with asar + asarUnpack, files live in app.asar.unpacked/dist
        const unpackedPath = distPath.replace('app.asar', 'app.asar.unpacked');
        if (fs.existsSync(unpackedPath)) {
            distPath = unpackedPath;
        }
        console.log('[LocalServer] distPath:', distPath);
        const { server, port } = await startLocalServer(distPath);
        localServer = server;
        localServerPort = port;
        mainWindow.loadURL(`http://127.0.0.1:${port}`);
    }
}

// Initialize database and create window
app.whenReady().then(async () => {
    initDatabase();
    await createWindow();

    // Configure CSP headers only for our own app pages
    // YouTube iframe content must NOT be restricted by our CSP
    mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
        const isOurApp = details.url.startsWith('http://localhost:') || details.url.startsWith('http://127.0.0.1:') || details.url.startsWith('file://');
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

// Clean up local server on quit
app.on('will-quit', () => {
    if (localServer) {
        localServer.close();
        localServer = null;
        console.log('[LocalServer] Stopped');
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

/**
 * Fetch playlist data by scraping YouTube's playlist page.
 * Pure Node.js — no Python, no external libraries, near-instant.
 * Parses the `ytInitialData` JSON blob embedded in the page HTML.
 * Follows redirects (up to 3) and bypasses YouTube consent pages.
 * @param {string} playlistId - The YouTube playlist ID
 * @returns {Promise<{success: boolean, title?: string, videos?: Array, error?: string}>}
 */
function fetchPlaylistFromYouTube(playlistId) {
    return new Promise((resolve) => {
        let resolved = false;
        const safeResolve = (val) => {
            if (resolved) return;
            resolved = true;
            clearTimeout(timeoutId);
            resolve(val);
        };

        const timeoutId = setTimeout(() => {
            safeResolve({ success: false, error: 'Playlist fetch timed out after 30 seconds' });
            try { if (currentReq) currentReq.destroy(); } catch { /* ignore */ }
        }, 30000);

        let currentReq = null;

        function doFetch(fetchUrl, redirectCount = 0) {
            if (redirectCount > 3) {
                safeResolve({ success: false, error: 'Too many redirects from YouTube' });
                return;
            }

            console.log(`[Playlist] Fetching: ${fetchUrl}${redirectCount > 0 ? ` (redirect ${redirectCount})` : ''}`);

            currentReq = https.get(fetchUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Cookie': 'CONSENT=YES+cb; SOCS=CAESEwgDEgk2MTkxMjEyMjQaAmVuIAEaBgiA_LyaBg',
                },
            }, (res) => {
                // Follow redirects
                if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                    res.resume(); // Drain the response
                    let redirectUrl = res.headers.location;
                    // Handle relative URLs
                    if (redirectUrl.startsWith('/')) {
                        redirectUrl = `https://www.youtube.com${redirectUrl}`;
                    }
                    doFetch(redirectUrl, redirectCount + 1);
                    return;
                }

                if (res.statusCode !== 200) {
                    res.resume();
                    safeResolve({ success: false, error: `YouTube returned status ${res.statusCode}` });
                    return;
                }

                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        // Extract ytInitialData JSON from the HTML
                        const match = data.match(/var ytInitialData = (.+?);<\/script>/s);
                        if (!match) {
                            safeResolve({ success: false, error: 'Could not parse YouTube playlist page. The playlist may be private or unavailable.' });
                            return;
                        }

                        const ytData = JSON.parse(match[1]);

                        // Extract playlist title
                        const title = ytData?.metadata?.playlistMetadataRenderer?.title || '';

                        // Navigate to the video list
                        const contents = ytData?.contents
                            ?.twoColumnBrowseResultsRenderer?.tabs?.[0]
                            ?.tabRenderer?.content
                            ?.sectionListRenderer?.contents?.[0]
                            ?.itemSectionRenderer?.contents?.[0]
                            ?.playlistVideoListRenderer?.contents;

                        if (!contents || !Array.isArray(contents)) {
                            safeResolve({ success: false, error: 'Playlist appears to be empty or unavailable.' });
                            return;
                        }

                        // Parse video items (filter out continuation tokens)
                        const videos = contents
                            .filter(c => c.playlistVideoRenderer)
                            .map((c, index) => {
                                const v = c.playlistVideoRenderer;
                                const videoId = v.videoId || '';
                                const videoTitle = v.title?.runs?.[0]?.text || `Video ${index + 1}`;

                                // Parse duration from "lengthText" (e.g., "12:34")
                                const durationText = v.lengthText?.simpleText || '';
                                let durationSeconds = 0;
                                if (durationText) {
                                    const parts = durationText.split(':').map(Number);
                                    if (parts.length === 3) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
                                    else if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];
                                    else durationSeconds = parts[0] || 0;
                                }

                                // Get best thumbnail
                                const thumbnails = v.thumbnail?.thumbnails || [];
                                const thumbnailUrl = thumbnails.length > 0
                                    ? thumbnails[thumbnails.length - 1].url
                                    : `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

                                return {
                                    youtube_id: videoId,
                                    title: videoTitle,
                                    thumbnail_url: thumbnailUrl,
                                    duration_seconds: durationSeconds,
                                    order_index: index,
                                };
                            });

                        if (videos.length === 0) {
                            safeResolve({ success: false, error: 'No videos found in this playlist.' });
                            return;
                        }

                        console.log(`[Playlist] Found ${videos.length} videos in "${title}"`);
                        safeResolve({
                            success: true,
                            title,
                            videos,
                        });
                    } catch (parseErr) {
                        console.error('[Playlist] Parse error:', parseErr);
                        safeResolve({ success: false, error: 'Failed to parse playlist data from YouTube.' });
                    }
                });
            });

            currentReq.on('error', (err) => {
                safeResolve({ success: false, error: `Network error: ${err.message}` });
            });
        }

        doFetch(`https://www.youtube.com/playlist?list=${playlistId}`);
    });
}

ipcMain.handle('ai:fetchPlaylist', async (_, url) => {
    try {
        // Extract playlist ID if present
        const playlistMatch = url.match(/[?&]list=([^&]+)/);

        if (playlistMatch) {
            // It's a playlist URL — fetch all videos via YouTube page scraping
            const result = await fetchPlaylistFromYouTube(playlistMatch[1]);

            if (result.success) {
                return {
                    success: true,
                    isPlaylist: true,
                    title: result.title,
                    videos: result.videos,
                };
            }

            // Playlist fetch failed — return the error directly.
            // Do NOT fall through to single-video extraction when the user
            // clearly pasted a playlist URL (has list= param).
            console.warn('[Playlist] Playlist fetch failed:', result.error);
            return {
                success: false,
                error: result.error || 'Failed to fetch playlist. Please try again.',
            };
        }

        // Single video URL (no list= param) — extract video ID
        const videoIdMatch = url.match(
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([^&\n?#]+)/
        );

        if (videoIdMatch) {
            return {
                success: true,
                isPlaylist: false,
                title: null,
                videos: [{
                    youtube_id: videoIdMatch[1],
                    title: null,
                    thumbnail_url: `https://i.ytimg.com/vi/${videoIdMatch[1]}/mqdefault.jpg`,
                    duration_seconds: 0,
                    order_index: 0,
                }]
            };
        }

        return { success: false, error: 'Could not recognize this URL. Please paste a YouTube video or playlist URL.' };
    } catch (error) {
        console.error('Playlist fetch error:', error);
        return { success: false, error: error.message || 'Failed to fetch playlist' };
    }
});

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
