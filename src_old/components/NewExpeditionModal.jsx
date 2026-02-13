import { useState } from 'react';
import './NewExpeditionModal.css';

function NewExpeditionModal({ onClose, onCreated }) {
    const [url, setUrl] = useState('');
    const [name, setName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [preview, setPreview] = useState(null);

    function extractVideoId(url) {
        // Extract video ID from YouTube URL
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
            /youtube\.com\/shorts\/([^&\n?#]+)/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    function extractPlaylistId(url) {
        // Extract playlist ID from YouTube URL
        const match = url.match(/[?&]list=([^&]+)/);
        return match ? match[1] : null;
    }

    async function fetchVideoInfo() {
        if (!url.trim()) return;

        setIsLoading(true);
        setError(null);
        setPreview(null);

        try {
            const videoId = extractVideoId(url);
            const playlistId = extractPlaylistId(url);

            if (videoId) {
                // Single video
                const info = {
                    type: 'video',
                    videoId,
                    title: name || 'YouTube Video',
                    thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                    videos: [{
                        id: videoId,
                        title: name || 'Untitled Video',
                        thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
                    }]
                };
                setPreview(info);
            } else if (playlistId) {
                // Playlist (simplified - in real app would fetch from API)
                setPreview({
                    type: 'playlist',
                    playlistId,
                    title: name || 'YouTube Playlist',
                    videos: [] // Would be populated from API
                });
            } else {
                throw new Error('Invalid YouTube URL');
            }
        } catch (err) {
            setError(err.message || 'Failed to fetch video information');
        } finally {
            setIsLoading(false);
        }
    }

    async function handleCreate() {
        if (!url.trim()) return;

        setIsLoading(true);
        setError(null);

        try {
            const videoId = extractVideoId(url);

            if (!videoId) {
                throw new Error('Could not extract video ID from URL');
            }

            if (window.atlased) {
                // Create expedition
                const expeditionId = await window.atlased.expeditions.create({
                    title: name || 'New Expedition',
                    source_url: url,
                    thumbnail_url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`
                });

                // Create waypoint for the video
                await window.atlased.waypoints.create({
                    expedition_id: expeditionId,
                    title: name || 'Video',
                    youtube_id: videoId,
                    order_index: 0
                });

                onCreated?.(expeditionId);
            }
        } catch (err) {
            setError(err.message || 'Failed to create expedition');
            setIsLoading(false);
        }
    }

    function handleUrlChange(e) {
        setUrl(e.target.value);
        setError(null);
        setPreview(null);
    }

    function clearUrl() {
        setUrl('');
        setError(null);
        setPreview(null);
    }

    return (
        <div className="expedition-modal-overlay" onClick={onClose}>
            <div className="expedition-modal" onClick={(e) => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="modal-header">
                    <div className="modal-header-content">
                        <div className="modal-header-left">
                            <div className="modal-header-icon">
                                <iconify-icon icon="lucide:compass"></iconify-icon>
                            </div>
                            <div>
                                <h2 className="modal-header-title">Add New Expedition</h2>
                                <p className="modal-header-subtitle">Transform a YouTube video into a structured learning journey</p>
                            </div>
                        </div>
                        <button className="modal-close-btn" onClick={onClose}>
                            <iconify-icon icon="lucide:x"></iconify-icon>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="modal-body">
                    {/* YouTube URL Input */}
                    <div className="modal-input-group">
                        <label className="modal-input-label">
                            YouTube URL <span className="required">*</span>
                        </label>
                        <div className="modal-input-wrapper">
                            <div className="modal-input-icon">
                                <iconify-icon icon="lucide:link"></iconify-icon>
                            </div>
                            <input
                                type="text"
                                className="modal-input"
                                placeholder="Paste video or playlist URL"
                                value={url}
                                onChange={handleUrlChange}
                                onBlur={fetchVideoInfo}
                            />
                            {url && (
                                <button className="modal-input-clear" onClick={clearUrl}>
                                    <iconify-icon icon="lucide:x-circle"></iconify-icon>
                                </button>
                            )}
                        </div>
                        <p className="modal-input-hint">
                            <iconify-icon icon="lucide:info"></iconify-icon>
                            Supports: youtube.com/watch?v=..., youtu.be/..., and playlists
                        </p>
                    </div>

                    {/* Expedition Name Input */}
                    <div className="modal-input-group">
                        <label className="modal-input-label">
                            Expedition Name <span className="optional">(optional)</span>
                        </label>
                        <div className="modal-input-wrapper">
                            <div className="modal-input-icon">
                                <iconify-icon icon="lucide:type"></iconify-icon>
                            </div>
                            <input
                                type="text"
                                className="modal-input"
                                placeholder="Leave blank to use video title"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoading && !preview && (
                        <div className="modal-loading">
                            <div className="modal-loading-spinner">
                                <div className="modal-loading-spinner-track"></div>
                                <div className="modal-loading-spinner-fill"></div>
                            </div>
                            <p className="modal-loading-title">Fetching video info...</p>
                            <p className="modal-loading-subtitle">Retrieving video information</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && (
                        <div className="modal-error">
                            <div className="modal-error-box">
                                <div className="modal-error-content">
                                    <div className="modal-error-icon">
                                        <iconify-icon icon="lucide:alert-circle"></iconify-icon>
                                    </div>
                                    <div>
                                        <p className="modal-error-title">Unable to fetch video</p>
                                        <p className="modal-error-text">{error}</p>
                                        <button className="modal-error-retry" onClick={fetchVideoInfo}>
                                            <iconify-icon icon="lucide:refresh-cw"></iconify-icon>
                                            Try again
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Preview Section */}
                    {preview && preview.videos && preview.videos.length > 0 && (
                        <div className="modal-preview">
                            <div className="modal-preview-header">
                                <h3 className="modal-preview-title">
                                    Videos found <span className="modal-preview-count">({preview.videos.length})</span>
                                </h3>
                                <span className="modal-preview-label">Preview</span>
                            </div>

                            <div className="modal-preview-grid-container">
                                <div className="modal-preview-grid">
                                    {preview.videos.slice(0, 8).map((video, index) => (
                                        <div key={video.id} className="thumbnail-card">
                                            <img src={video.thumbnail} alt={video.title} />
                                            <div className="thumbnail-play">
                                                <iconify-icon icon="lucide:play"></iconify-icon>
                                            </div>
                                            <div className="thumbnail-title">
                                                <p>{video.title}</p>
                                            </div>
                                            <div className="thumbnail-index">{index + 1}</div>
                                        </div>
                                    ))}
                                </div>

                                {preview.videos.length > 8 && (
                                    <div className="modal-more-videos">
                                        And {preview.videos.length - 8} more videos
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                <div className="modal-footer">
                    <button className="modal-btn secondary" onClick={onClose}>
                        Cancel
                    </button>
                    <button
                        className="modal-btn primary"
                        onClick={handleCreate}
                        disabled={!url.trim() || isLoading}
                    >
                        <span>{isLoading ? 'Creating...' : 'Create Expedition'}</span>
                        <iconify-icon icon="lucide:arrow-right"></iconify-icon>
                    </button>
                </div>
            </div>
        </div>
    );
}

export default NewExpeditionModal;
