/**
 * Transcript Service - Fetches YouTube video transcripts
 * Uses Python youtube-transcript-api for reliable transcript fetching
 * including auto-generated captions
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

// Track whether we've already attempted auto-install this session
let hasAttemptedInstall = false;
let isPackageAvailable = null; // null = unknown, true/false = checked

/**
 * Auto-install youtube-transcript-api via pip if not already installed.
 * Runs silently in the background. Only attempts once per session.
 * @returns {Promise<{installed: boolean, error?: string}>}
 */
async function ensureTranscriptApiInstalled() {
    if (hasAttemptedInstall && isPackageAvailable === true) {
        return { installed: true };
    }

    // First, check if it's already installed
    const checkResult = await checkPythonPackage();
    if (checkResult.available) {
        isPackageAvailable = true;
        return { installed: true };
    }

    if (hasAttemptedInstall) {
        // Already tried to install this session, don't retry
        return { installed: false, error: 'Installation was already attempted this session' };
    }

    hasAttemptedInstall = true;
    console.log('[Transcript] youtube-transcript-api not found, auto-installing...');

    // Try installing with pip
    const installResult = await installPackage();
    if (installResult.success) {
        console.log('[Transcript] youtube-transcript-api installed successfully');
        isPackageAvailable = true;
        return { installed: true };
    }

    console.error('[Transcript] Failed to auto-install youtube-transcript-api:', installResult.error);
    isPackageAvailable = false;
    return { installed: false, error: installResult.error };
}

/**
 * Check if youtube-transcript-api Python package is importable
 * @returns {Promise<{available: boolean}>}
 */
function checkPythonPackage() {
    return new Promise((resolve) => {
        let proc;
        try {
            proc = spawn('python', ['-c', 'import youtube_transcript_api; print("ok")'], {
                windowsHide: true,
                env: { ...process.env },
                timeout: 10000,
            });
        } catch {
            resolve({ available: false });
            return;
        }

        let output = '';
        proc.stdout.on('data', (data) => { output += data.toString(); });
        proc.on('close', (code) => {
            resolve({ available: code === 0 && output.trim().includes('ok') });
        });
        proc.on('error', () => {
            resolve({ available: false });
        });
    });
}

/**
 * Install youtube-transcript-api via pip
 * Tries pip install with --user flag as fallback
 * @returns {Promise<{success: boolean, error?: string}>}
 */
function installPackage() {
    return new Promise((resolve) => {
        let errorOutput = '';
        let resolved = false;

        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                try { proc.kill(); } catch { /* ignore */ }
                resolve({ success: false, error: 'pip install timed out after 60 seconds' });
            }
        }, 60000);

        let proc;
        try {
            proc = spawn('pip', ['install', 'youtube-transcript-api'], {
                windowsHide: true,
                env: { ...process.env },
            });
        } catch (err) {
            clearTimeout(timeoutId);
            // Try python -m pip as fallback
            return tryPythonMPip(resolve);
        }

        proc.stderr.on('data', (data) => { errorOutput += data.toString(); });

        proc.on('close', (code) => {
            clearTimeout(timeoutId);
            if (resolved) return;
            resolved = true;

            if (code === 0) {
                resolve({ success: true });
            } else {
                // Try python -m pip as fallback
                tryPythonMPip(resolve);
            }
        });

        proc.on('error', () => {
            clearTimeout(timeoutId);
            if (resolved) return;
            resolved = true;
            // Try python -m pip as fallback
            tryPythonMPip(resolve);
        });
    });
}

/**
 * Fallback: try `python -m pip install youtube-transcript-api`
 */
function tryPythonMPip(resolve) {
    let errorOutput = '';
    let resolved = false;

    const timeoutId = setTimeout(() => {
        if (!resolved) {
            resolved = true;
            try { proc.kill(); } catch { /* ignore */ }
            resolve({ success: false, error: 'python -m pip install timed out' });
        }
    }, 60000);

    let proc;
    try {
        proc = spawn('python', ['-m', 'pip', 'install', 'youtube-transcript-api'], {
            windowsHide: true,
            env: { ...process.env },
        });
    } catch (err) {
        clearTimeout(timeoutId);
        resolve({ success: false, error: `Cannot run pip: ${err.message}` });
        return;
    }

    proc.stderr.on('data', (data) => { errorOutput += data.toString(); });

    proc.on('close', (code) => {
        clearTimeout(timeoutId);
        if (resolved) return;
        resolved = true;
        if (code === 0) {
            resolve({ success: true });
        } else {
            resolve({ success: false, error: errorOutput || `pip exited with code ${code}` });
        }
    });

    proc.on('error', (err) => {
        clearTimeout(timeoutId);
        if (resolved) return;
        resolved = true;
        resolve({ success: false, error: `Python/pip not available: ${err.message}` });
    });
}

/**
 * Fetches transcript using Python youtube-transcript-api
 * This library can fetch both manual and auto-generated captions
 * @param {string} videoId - The YouTube video ID
 * @returns {Promise<{success: boolean, transcript?: string, error?: string}>}
 */
async function fetchWithPython(videoId) {
    return new Promise((resolve) => {
        console.log(`[Transcript] Fetching transcript via Python for ${videoId}...`);

        // Write Python script to temp file to avoid command line escaping issues
        const tempDir = os.tmpdir();
        const scriptPath = path.join(tempDir, `atlased_transcript_${Date.now()}.py`);

        const pythonCode = `
import json
import sys

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    
    video_id = ${JSON.stringify(videoId)}
    
    try:
        ytt_api = YouTubeTranscriptApi()
        
        try:
            result = ytt_api.fetch(video_id, languages=['en', 'en-US', 'en-GB'])
        except:
            result = ytt_api.fetch(video_id)
        
        text = ' '.join([snippet.text for snippet in result])
        language = getattr(result, 'language', 'unknown')
        
        print(json.dumps({"success": True, "transcript": text, "language": language}))
            
    except Exception as e:
        error_msg = str(e)
        if 'disabled' in error_msg.lower():
            print(json.dumps({"success": False, "error": "Transcripts are disabled for this video"}))
        elif 'not found' in error_msg.lower() or 'no transcript' in error_msg.lower():
            print(json.dumps({"success": False, "error": "No transcript found for this video"}))
        elif 'unavailable' in error_msg.lower():
            print(json.dumps({"success": False, "error": "Video is unavailable"}))
        else:
            print(json.dumps({"success": False, "error": error_msg}))
        
except ImportError:
    print(json.dumps({"success": False, "error": "youtube-transcript-api not installed. Run: pip install youtube-transcript-api"}))
except Exception as e:
    print(json.dumps({"success": False, "error": str(e)}))
`;

        // Write script to temp file
        try {
            fs.writeFileSync(scriptPath, pythonCode, 'utf8');
        } catch (err) {
            resolve({
                success: false,
                error: `Failed to write Python script: ${err.message}`
            });
            return;
        }

        let output = '';
        let errorOutput = '';
        let resolved = false;

        // Cleanup function
        const cleanup = () => {
            try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }
        };

        // Timeout after 30 seconds
        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                cleanup();
                try { proc.kill(); } catch { /* ignore */ }
                resolve({
                    success: false,
                    error: 'Transcript fetch timed out after 30 seconds'
                });
            }
        }, 30000);

        let proc;
        try {
            proc = spawn('python', [scriptPath], {
                windowsHide: true,
                env: { ...process.env }
            });
        } catch (err) {
            clearTimeout(timeoutId);
            cleanup();
            resolve({
                success: false,
                error: `Failed to start Python: ${err.message}`
            });
            return;
        }

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        proc.on('close', (code) => {
            clearTimeout(timeoutId);
            cleanup();
            if (resolved) return;
            resolved = true;

            if (code === 0 && output.trim()) {
                try {
                    const result = JSON.parse(output.trim());
                    if (result.success) {
                        console.log(`[Transcript] Python fetch successful (language: ${result.language || 'unknown'})`);
                    } else {
                        console.log(`[Transcript] Python fetch failed: ${result.error}`);
                    }
                    resolve(result);
                } catch {
                    console.error('[Transcript] Failed to parse Python output:', output);
                    resolve({
                        success: false,
                        error: 'Failed to parse transcript response'
                    });
                }
            } else {
                console.error('[Transcript] Python error:', errorOutput || `Exit code ${code}`);
                resolve({
                    success: false,
                    error: errorOutput || `Python exited with code ${code}`
                });
            }
        });

        proc.on('error', (err) => {
            clearTimeout(timeoutId);
            cleanup();
            if (resolved) return;
            resolved = true;
            console.error('[Transcript] Python spawn error:', err.message);
            resolve({
                success: false,
                error: `Python not available: ${err.message}`
            });
        });
    });
}

/**
 * Checks if Python and youtube-transcript-api are available
 * @returns {Promise<{available: boolean, error?: string}>}
 */
export async function checkTranscriptAvailability() {
    return new Promise((resolve) => {
        const tempDir = os.tmpdir();
        const scriptPath = path.join(tempDir, `atlased_check_${Date.now()}.py`);

        const pythonCode = `
import json
try:
    from youtube_transcript_api import YouTubeTranscriptApi
    print(json.dumps({"available": True}))
except ImportError:
    print(json.dumps({"available": False, "error": "youtube-transcript-api not installed"}))
`;

        try {
            fs.writeFileSync(scriptPath, pythonCode, 'utf8');
        } catch (err) {
            resolve({ available: false, error: `Failed to write script: ${err.message}` });
            return;
        }

        let output = '';
        let resolved = false;

        const cleanup = () => {
            try { fs.unlinkSync(scriptPath); } catch { /* ignore */ }
        };

        const timeoutId = setTimeout(() => {
            if (!resolved) {
                resolved = true;
                cleanup();
                try { proc.kill(); } catch { /* ignore */ }
                resolve({ available: false, error: 'Python check timed out' });
            }
        }, 10000);

        let proc;
        try {
            proc = spawn('python', [scriptPath], {
                windowsHide: true,
                env: { ...process.env }
            });
        } catch (err) {
            clearTimeout(timeoutId);
            cleanup();
            resolve({ available: false, error: `Python not found: ${err.message}` });
            return;
        }

        proc.stdout.on('data', (data) => {
            output += data.toString();
        });

        proc.on('close', (code) => {
            clearTimeout(timeoutId);
            cleanup();
            if (resolved) return;
            resolved = true;

            if (code === 0 && output.trim()) {
                try {
                    const result = JSON.parse(output.trim());
                    resolve(result);
                } catch {
                    resolve({ available: false, error: 'Failed to parse Python output' });
                }
            } else {
                resolve({ available: false, error: `Python check failed with code ${code}` });
            }
        });

        proc.on('error', (err) => {
            clearTimeout(timeoutId);
            cleanup();
            if (resolved) return;
            resolved = true;
            resolve({ available: false, error: `Python error: ${err.message}` });
        });
    });
}

/**
 * Main function to fetch transcript
 * Uses Python youtube-transcript-api which supports auto-generated captions.
 * Auto-installs the Python package if not found.
 * @param {string} videoId - The YouTube video ID
 * @param {string} _apiKey - Not used anymore, kept for API compatibility
 * @returns {Promise<{success: boolean, transcript?: string, method?: string, error?: string}>}
 */
export async function fetchTranscriptWithFallback(videoId, _apiKey) {
    console.log(`[Transcript] Fetching transcript for ${videoId}...`);

    // Ensure youtube-transcript-api is installed before attempting fetch
    const installCheck = await ensureTranscriptApiInstalled();
    if (!installCheck.installed) {
        return {
            success: false,
            error: `Python dependency missing: ${installCheck.error || 'youtube-transcript-api could not be installed'}. Please ensure Python is installed and run: pip install youtube-transcript-api`,
            supportsManualInput: true
        };
    }

    // Use Python youtube-transcript-api (supports auto-generated captions)
    const result = await fetchWithPython(videoId);

    if (result.success) {
        return {
            success: true,
            transcript: result.transcript,
            method: 'youtube_transcript_api'
        };
    }

    // Return failure with helpful message
    return {
        success: false,
        error: result.error || 'Failed to fetch transcript. You can paste a transcript manually.',
        supportsManualInput: true
    };
}


