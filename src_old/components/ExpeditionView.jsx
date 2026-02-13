import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import './ExpeditionView.css';

function ExpeditionView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [expedition, setExpedition] = useState(null);
    const [waypoints, setWaypoints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

    useEffect(() => {
        loadExpedition();
    }, [id]);

    async function loadExpedition() {
        try {
            if (window.atlased) {
                const exp = await window.atlased.expeditions.get(id);
                const wps = await window.atlased.waypoints.getByExpedition(id);
                setExpedition(exp);
                setWaypoints(wps || []);
            }
        } catch (error) {
            console.error('Error loading expedition:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function getWaypointStatus(waypoint) {
        const progress = waypoint.progress_percent || 0;
        if (progress >= 100) return 'completed';
        if (progress > 0) return 'progress';
        return 'pending';
    }

    function getOverallProgress() {
        if (waypoints.length === 0) return 0;
        const completed = waypoints.filter(w => (w.progress_percent || 0) >= 100).length;
        return Math.round((completed / waypoints.length) * 100);
    }

    function getStatusCounts() {
        const pending = waypoints.filter(w => (w.progress_percent || 0) === 0).length;
        const progress = waypoints.filter(w => {
            const p = w.progress_percent || 0;
            return p > 0 && p < 100;
        }).length;
        const completed = waypoints.filter(w => (w.progress_percent || 0) >= 100).length;
        return { pending, progress, completed };
    }

    function formatDuration(seconds) {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function handleWaypointClick(waypointId) {
        navigate(`/expedition/${id}/waypoint/${waypointId}`);
    }

    function handleResumeClick() {
        // Find first incomplete waypoint
        const incomplete = waypoints.find(w => (w.progress_percent || 0) < 100);
        if (incomplete) {
            navigate(`/expedition/${id}/waypoint/${incomplete.id}`);
        } else if (waypoints.length > 0) {
            navigate(`/expedition/${id}/waypoint/${waypoints[0].id}`);
        }
    }

    if (isLoading) {
        return (
            <div className="expedition-view-page">
                <header className="expedition-header">
                    <div className="expedition-header-left">
                        <button className="back-btn" onClick={() => navigate('/')}>
                            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                            <span>Back to Dashboard</span>
                        </button>
                    </div>
                </header>
                <div className="expedition-loading">
                    <div className="loading-spinner"></div>
                </div>
            </div>
        );
    }

    if (!expedition) {
        return (
            <div className="expedition-view-page">
                <header className="expedition-header">
                    <div className="expedition-header-left">
                        <button className="back-btn" onClick={() => navigate('/')}>
                            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                            <span>Back to Dashboard</span>
                        </button>
                    </div>
                </header>
                <div className="expedition-loading">
                    <p>Expedition not found</p>
                </div>
            </div>
        );
    }

    const overallProgress = getOverallProgress();
    const statusCounts = getStatusCounts();
    const completedCount = statusCounts.completed;
    const totalCount = waypoints.length;

    return (
        <div className="expedition-view-page">
            {/* Header */}
            <header className="expedition-header">
                <div className="expedition-header-left">
                    <button className="back-btn" onClick={() => navigate('/')}>
                        <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                        <span>Back to Dashboard</span>
                    </button>
                </div>

                <div className="expedition-header-right">
                    <button className="header-icon-btn" onClick={() => navigate('/settings')}>
                        <iconify-icon icon="lucide:settings"></iconify-icon>
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="expedition-main">
                <div className="expedition-container">
                    {/* Expedition Info Header */}
                    <div className="expedition-info">
                        <div className="expedition-info-top">
                            <div className="expedition-info-left">
                                <h1 className="expedition-title">{expedition.title}</h1>
                                <div className="expedition-meta">
                                    <span className="expedition-meta-item">
                                        <iconify-icon icon="lucide:clock"></iconify-icon>
                                        <span>12h 34m total</span>
                                    </span>
                                    <span className="expedition-meta-item">
                                        <iconify-icon icon="lucide:play-circle"></iconify-icon>
                                        <span>{totalCount} waypoints</span>
                                    </span>
                                    <span className="expedition-meta-item">
                                        <iconify-icon icon="lucide:calendar"></iconify-icon>
                                        <span>Started 3 days ago</span>
                                    </span>
                                </div>
                            </div>
                            <button className="resume-btn" onClick={handleResumeClick}>
                                <iconify-icon icon="lucide:play"></iconify-icon>
                                <span>Resume Expedition</span>
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="progress-card">
                            <div className="progress-header">
                                <span className="progress-label">Overall Progress</span>
                                <span className="progress-value">{overallProgress}%</span>
                            </div>
                            <div className="progress-track">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${overallProgress}%` }}
                                ></div>
                            </div>
                            <div className="progress-footer">
                                <span>{completedCount} of {totalCount} waypoints completed</span>
                                <span>~5h 12m remaining</span>
                            </div>
                        </div>
                    </div>

                    {/* View Controls */}
                    <div className="view-controls">
                        <div className="view-controls-left">
                            <h2 className="waypoints-title">Waypoints</h2>
                            <div className="view-toggle">
                                <button
                                    className={`view-toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                    onClick={() => setViewMode('list')}
                                >
                                    <iconify-icon icon="lucide:list"></iconify-icon>
                                    <span>List</span>
                                </button>
                                <button
                                    className={`view-toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                    onClick={() => setViewMode('grid')}
                                >
                                    <iconify-icon icon="lucide:layout-grid"></iconify-icon>
                                    <span>Grid</span>
                                </button>
                            </div>
                        </div>
                        <div className="view-controls-right">
                            <span className="status-indicator">
                                <span className="status-dot pending"></span>
                                {statusCounts.pending} Pending
                            </span>
                            <span className="status-indicator">
                                <span className="status-dot progress"></span>
                                {statusCounts.progress} In Progress
                            </span>
                            <span className="status-indicator">
                                <span className="status-dot completed"></span>
                                {statusCounts.completed} Completed
                            </span>
                        </div>
                    </div>

                    {/* List View */}
                    {viewMode === 'list' && (
                        <div className="waypoint-list">
                            {waypoints.map((waypoint, index) => {
                                const status = getWaypointStatus(waypoint);
                                const progress = waypoint.progress_percent || 0;

                                return (
                                    <div
                                        key={waypoint.id}
                                        className={`waypoint-row ${status}`}
                                        onClick={() => handleWaypointClick(waypoint.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            className="waypoint-checkbox"
                                            checked={status === 'completed'}
                                            readOnly
                                            onClick={(e) => e.stopPropagation()}
                                        />

                                        <div className="waypoint-thumbnail">
                                            <img
                                                src={waypoint.thumbnail_url || `https://i.ytimg.com/vi/${waypoint.youtube_id}/mqdefault.jpg`}
                                                alt={waypoint.title}
                                            />
                                            {status === 'completed' && (
                                                <div className="waypoint-thumbnail-overlay">
                                                    <iconify-icon icon="lucide:check-circle"></iconify-icon>
                                                </div>
                                            )}
                                            {status === 'progress' && (
                                                <div className="waypoint-thumbnail-progress">
                                                    <div className="waypoint-thumbnail-progress-track">
                                                        <div
                                                            className="waypoint-thumbnail-progress-fill"
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )}
                                            <span className="waypoint-duration">
                                                {formatDuration(waypoint.duration_seconds)}
                                            </span>
                                        </div>

                                        <div className="waypoint-info">
                                            <div className="waypoint-info-header">
                                                <span className="waypoint-index">{index + 1}/{totalCount}</span>
                                                <h3 className="waypoint-title">{waypoint.title}</h3>
                                            </div>
                                            <div className="waypoint-info-footer">
                                                <span className={`status-badge ${status}`}>
                                                    {status === 'completed' ? 'Completed' :
                                                        status === 'progress' ? 'In Progress' : 'Pending'}
                                                </span>
                                                <span className="waypoint-watched">
                                                    {status === 'completed' ? 'Watched 2 days ago' :
                                                        status === 'progress' ? `${Math.round(progress)}% watched` : 'Not started'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="waypoint-actions">
                                            <span className="waypoint-progress-text">{progress}%</span>
                                            <button
                                                className={`waypoint-action-btn ${status === 'progress' ? 'gold' : ''}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <iconify-icon icon={status === 'completed' ? 'lucide:book-open' : 'lucide:bookmark'}></iconify-icon>
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Grid View */}
                    {viewMode === 'grid' && (
                        <div className="waypoint-grid">
                            {waypoints.map((waypoint, index) => {
                                const status = getWaypointStatus(waypoint);
                                const progress = waypoint.progress_percent || 0;

                                return (
                                    <div
                                        key={waypoint.id}
                                        className={`grid-card ${status}`}
                                        onClick={() => handleWaypointClick(waypoint.id)}
                                    >
                                        <div className="grid-card-thumbnail">
                                            <div className="grid-card-thumbnail-inner">
                                                <img
                                                    src={waypoint.thumbnail_url || `https://i.ytimg.com/vi/${waypoint.youtube_id}/mqdefault.jpg`}
                                                    alt={waypoint.title}
                                                />
                                                {status === 'completed' && (
                                                    <div className="grid-card-check-overlay">
                                                        <iconify-icon icon="lucide:check-circle"></iconify-icon>
                                                    </div>
                                                )}
                                                {status === 'progress' && (
                                                    <div className="grid-card-gradient"></div>
                                                )}
                                            </div>
                                            <div className="grid-card-index">{index + 1}/{totalCount}</div>
                                            {status === 'progress' && (
                                                <div className="grid-card-progress-bar">
                                                    <div
                                                        className="grid-card-progress-fill"
                                                        style={{ width: `${progress}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="grid-card-content">
                                            <h3 className="grid-card-title">{waypoint.title}</h3>
                                            <div className="grid-card-meta">
                                                <span className="grid-card-status">
                                                    {status === 'completed' ? '100% Complete' :
                                                        status === 'progress' ? `${progress}% Watched` : 'Not Started'}
                                                </span>
                                                <span className="grid-card-duration">
                                                    {formatDuration(waypoint.duration_seconds)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Bookmarks Section */}
                    <div className="empty-section">
                        <h2 className="empty-section-title">Bookmarked Moments</h2>
                        <div className="empty-section-content">
                            <div className="empty-section-icon">
                                <iconify-icon icon="lucide:bookmark"></iconify-icon>
                            </div>
                            <p className="empty-section-text">No bookmarks yet</p>
                            <p className="empty-section-subtext">Bookmark important moments while watching to revisit them later</p>
                        </div>
                    </div>

                    {/* Quiz Results Section */}
                    <div className="empty-section" style={{ marginBottom: '2rem' }}>
                        <h2 className="empty-section-title">Quiz Results</h2>
                        <div className="empty-section-content">
                            <div className="empty-section-icon">
                                <iconify-icon icon="lucide:help-circle"></iconify-icon>
                            </div>
                            <p className="empty-section-text">No quizzes taken yet</p>
                            <p className="empty-section-subtext">Take knowledge checks after each waypoint to reinforce your learning</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ExpeditionView;
