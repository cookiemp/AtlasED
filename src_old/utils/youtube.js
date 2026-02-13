/**
 * YouTube URL Parsing Utilities
 * Extracts video and playlist IDs from various YouTube URL formats
 */

// Regex patterns for YouTube URLs
const PATTERNS = {
    // Standard video URLs
    video: [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
        /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/
    ],
    // Playlist URLs
    playlist: [
        /[?&]list=([a-zA-Z0-9_-]+)/
    ]
};

/**
 * Extract video ID from a YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null if not found
 */
export function extractVideoId(url) {
    if (!url) return null;

    for (const pattern of PATTERNS.video) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Extract playlist ID from a YouTube URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Playlist ID or null if not found
 */
export function extractPlaylistId(url) {
    if (!url) return null;

    for (const pattern of PATTERNS.playlist) {
        const match = url.match(pattern);
        if (match) return match[1];
    }

    return null;
}

/**
 * Check if URL is a playlist
 * @param {string} url - YouTube URL
 * @returns {boolean}
 */
export function isPlaylistUrl(url) {
    return extractPlaylistId(url) !== null;
}

/**
 * Check if URL is a valid YouTube URL
 * @param {string} url - URL to check
 * @returns {boolean}
 */
export function isYouTubeUrl(url) {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
}

/**
 * Parse a YouTube URL and extract all relevant information
 * @param {string} url - YouTube URL
 * @returns {Object} - Parsed URL information
 */
export function parseYouTubeUrl(url) {
    return {
        isValid: isYouTubeUrl(url),
        videoId: extractVideoId(url),
        playlistId: extractPlaylistId(url),
        isPlaylist: isPlaylistUrl(url)
    };
}

/**
 * Generate YouTube thumbnail URL
 * @param {string} videoId - YouTube video ID
 * @param {string} quality - Thumbnail quality (default, medium, high, maxres)
 * @returns {string} - Thumbnail URL
 */
export function getThumbnailUrl(videoId, quality = 'maxresdefault') {
    return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * Generate YouTube embed URL
 * @param {string} videoId - YouTube video ID
 * @param {Object} options - Embed options
 * @returns {string} - Embed URL
 */
export function getEmbedUrl(videoId, options = {}) {
    const params = new URLSearchParams({
        enablejsapi: '1',
        origin: window.location.origin,
        modestbranding: '1',
        rel: '0',
        ...options
    });

    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

/**
 * Format seconds to human-readable duration
 * @param {number} seconds - Duration in seconds
 * @returns {string} - Formatted duration (e.g., "3:45", "1:02:30")
 */
export function formatDuration(seconds) {
    if (!seconds || seconds < 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Fetch video metadata using oEmbed (no API key required)
 * @param {string} videoId - YouTube video ID
 * @returns {Promise<Object>} - Video metadata
 */
export async function fetchVideoMetadata(videoId) {
    try {
        const response = await fetch(
            `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch video metadata');
        }

        const data = await response.json();

        return {
            title: data.title,
            author: data.author_name,
            thumbnail_url: getThumbnailUrl(videoId),
            duration_seconds: null // oEmbed doesn't provide duration
        };
    } catch (error) {
        console.error('Error fetching video metadata:', error);
        return null;
    }
}
