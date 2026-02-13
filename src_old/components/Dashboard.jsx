import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import NewExpeditionModal from './NewExpeditionModal';
import './Dashboard.css';

function Dashboard() {
    const [expeditions, setExpeditions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showNewModal, setShowNewModal] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadExpeditions();
    }, []);

    async function loadExpeditions() {
        try {
            if (window.atlased) {
                const exps = await window.atlased.expeditions.getAll();
                setExpeditions(exps || []);
            }
        } catch (error) {
            console.error('Error loading expeditions:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function handleExpeditionClick(id) {
        navigate(`/expedition/${id}`);
    }

    async function handleDeleteExpedition(e, id) {
        e.stopPropagation();
        if (window.confirm('Are you sure you want to delete this expedition?')) {
            try {
                if (window.atlased) {
                    await window.atlased.expeditions.delete(id);
                    await loadExpeditions();
                }
            } catch (error) {
                console.error('Error deleting expedition:', error);
            }
        }
    }

    function getProgress(expedition) {
        // Calculate progress from waypoints
        const total = expedition.waypoint_count || 0;
        const completed = expedition.completed_count || 0;
        if (total === 0) return 0;
        return Math.round((completed / total) * 100);
    }

    if (isLoading) {
        return (
            <div className="dashboard-page">
                <header className="dashboard-header">
                    <div className="dashboard-header-left">
                        <div className="dashboard-logo">
                            <div className="dashboard-logo-icon">
                                <iconify-icon icon="lucide:compass"></iconify-icon>
                            </div>
                            <span className="dashboard-logo-text">AtlasED</span>
                        </div>
                    </div>
                </header>
                <div className="dashboard-loading">
                    <div className="loading-spinner"></div>
                    <p>Loading expeditions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard-page">
            {/* Custom Title Bar */}
            <header className="dashboard-header">
                {/* Left: Logo and Navigation */}
                <div className="dashboard-header-left">
                    <div className="dashboard-logo">
                        <div className="dashboard-logo-icon">
                            <iconify-icon icon="lucide:compass"></iconify-icon>
                        </div>
                        <span className="dashboard-logo-text">AtlasED</span>
                    </div>

                    <div className="header-divider"></div>

                    <button className="nav-back-btn" disabled>
                        <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                        <span>Back</span>
                    </button>
                </div>

                {/* Right: Settings */}
                <div className="dashboard-header-right">
                    <button className="nav-settings-btn" onClick={() => navigate('/settings')}>
                        <iconify-icon icon="lucide:settings"></iconify-icon>
                        <span>Settings</span>
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="dashboard-main">
                {/* Hero Section */}
                <div className="dashboard-hero">
                    <div className="dashboard-hero-content">
                        <div>
                            <h1 className="dashboard-title">Your Expeditions</h1>
                            <p className="dashboard-subtitle">Transform YouTube playlists into structured learning journeys</p>
                        </div>

                        <button className="cta-button" onClick={() => setShowNewModal(true)}>
                            <iconify-icon icon="lucide:plus"></iconify-icon>
                            <span>Start New Expedition</span>
                        </button>
                    </div>
                </div>

                {/* Content Container */}
                <div className="expedition-content">
                    {expeditions.length === 0 ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <iconify-icon icon="lucide:compass"></iconify-icon>
                            </div>
                            <h2 className="empty-state-title">No expeditions yet</h2>
                            <p className="empty-state-desc">Start your learning journey by creating your first expedition from a YouTube playlist.</p>
                            <button className="cta-button" onClick={() => setShowNewModal(true)}>
                                <iconify-icon icon="lucide:plus"></iconify-icon>
                                <span>Start New Expedition</span>
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Expedition Grid */}
                            <div className="expedition-grid">
                                {expeditions.map((expedition) => {
                                    const progress = getProgress(expedition);
                                    const isNew = progress === 0;

                                    return (
                                        <div
                                            key={expedition.id}
                                            className="expedition-card"
                                            onClick={() => handleExpeditionClick(expedition.id)}
                                        >
                                            {/* Delete Button */}
                                            <button
                                                className="card-delete-btn"
                                                onClick={(e) => handleDeleteExpedition(e, expedition.id)}
                                            >
                                                <iconify-icon icon="lucide:trash-2"></iconify-icon>
                                            </button>

                                            {/* New Badge */}
                                            {isNew && (
                                                <div className="new-badge">
                                                    <span className="new-badge-dot"></span>
                                                    <span>New</span>
                                                </div>
                                            )}

                                            {/* Thumbnail Area */}
                                            <div className="card-thumbnail">
                                                {expedition.thumbnail_url ? (
                                                    <img src={expedition.thumbnail_url} alt={expedition.title} />
                                                ) : (
                                                    <>
                                                        <div className="card-thumbnail-overlay"></div>
                                                        <div className="card-thumbnail-pattern"></div>
                                                    </>
                                                )}
                                                <div className="card-play-overlay">
                                                    <div className="card-play-btn">
                                                        <iconify-icon icon="lucide:play"></iconify-icon>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Card Content */}
                                            <div className="card-content">
                                                <h3 className="card-title">{expedition.title}</h3>

                                                {/* Progress Bar */}
                                                <div className="card-progress">
                                                    <div className="card-progress-header">
                                                        <span className="card-progress-label">Progress</span>
                                                        <span className={`card-progress-value ${progress === 0 ? 'zero' : ''}`}>
                                                            {progress}%
                                                        </span>
                                                    </div>
                                                    <div className="card-progress-track">
                                                        <div
                                                            className="card-progress-fill"
                                                            style={{ width: `${progress}%` }}
                                                        ></div>
                                                    </div>
                                                </div>

                                                {/* Meta Info */}
                                                <div className="card-meta">
                                                    <div className="card-meta-item">
                                                        <iconify-icon icon="lucide:map-pin"></iconify-icon>
                                                        <span>{expedition.waypoint_count || 0} waypoints</span>
                                                    </div>
                                                    <div className="card-meta-item">
                                                        {progress > 0 ? (
                                                            <>
                                                                <iconify-icon icon="lucide:check-circle-2" className="gold"></iconify-icon>
                                                                <span>{expedition.completed_count || 0} completed</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <iconify-icon icon="lucide:circle"></iconify-icon>
                                                                <span>Not started</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Info Section */}
                            <div className="info-section">
                                {/* Recent Activity */}
                                <div className="recent-activity">
                                    <div className="info-header">
                                        <div className="info-icon-box">
                                            <iconify-icon icon="lucide:activity"></iconify-icon>
                                        </div>
                                        <div>
                                            <h3 className="info-title">Recent Activity</h3>
                                            <p className="info-subtitle">Your learning journey this week</p>
                                        </div>
                                    </div>

                                    <div className="activity-timeline">
                                        {/* Activity placeholders - these would be dynamic in real app */}
                                        <div className="activity-item">
                                            <div className="activity-icon-wrapper">
                                                <div className="activity-icon">
                                                    <iconify-icon icon="lucide:check"></iconify-icon>
                                                </div>
                                                <div className="activity-line"></div>
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-header">
                                                    <span className="activity-title">Completed waypoint</span>
                                                    <span className="activity-time">2 hours ago</span>
                                                </div>
                                                <p className="activity-desc">Keep learning and making progress!</p>
                                            </div>
                                        </div>

                                        <div className="activity-item">
                                            <div className="activity-icon-wrapper">
                                                <div className="activity-icon muted">
                                                    <iconify-icon icon="lucide:play-circle"></iconify-icon>
                                                </div>
                                            </div>
                                            <div className="activity-content">
                                                <div className="activity-header">
                                                    <span className="activity-title muted">Started expedition</span>
                                                    <span className="activity-time">Yesterday</span>
                                                </div>
                                                <p className="activity-desc">New learning journey begun</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Learning Tips */}
                                <div className="learning-tips">
                                    <div className="info-header">
                                        <div className="info-icon-box">
                                            <iconify-icon icon="lucide:lightbulb"></iconify-icon>
                                        </div>
                                        <div>
                                            <h3 className="info-title">Learning Tips</h3>
                                            <p className="info-subtitle">Make the most of AtlasED</p>
                                        </div>
                                    </div>

                                    <div className="tips-list">
                                        <div className="tip-card">
                                            <div className="tip-card-content">
                                                <div className="tip-icon">
                                                    <iconify-icon icon="lucide:repeat"></iconify-icon>
                                                </div>
                                                <div>
                                                    <h4 className="tip-title">Spaced Repetition</h4>
                                                    <p className="tip-desc">Complete memory checkpoints when they appear to maximize retention.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="tip-card">
                                            <div className="tip-card-content">
                                                <div className="tip-icon">
                                                    <iconify-icon icon="lucide:message-circle"></iconify-icon>
                                                </div>
                                                <div>
                                                    <h4 className="tip-title">Ask Compass AI</h4>
                                                    <p className="tip-desc">Stuck on a concept? Ask Compass for tailored explanations.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="tip-card">
                                            <div className="tip-card-content">
                                                <div className="tip-icon">
                                                    <iconify-icon icon="lucide:book-open"></iconify-icon>
                                                </div>
                                                <div>
                                                    <h4 className="tip-title">Read Field Guides</h4>
                                                    <p className="tip-desc">Field Guides summarize key concepts for quick review.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pro-tip">
                                        <div className="pro-tip-header">
                                            <iconify-icon icon="lucide:sparkles"></iconify-icon>
                                            <span>Pro Tip</span>
                                        </div>
                                        <p className="pro-tip-text">Keep a personal notebook to jot down insights while watching videos.</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="dashboard-footer">
                <div className="footer-left">
                    <span>AtlasED v1.0.0</span>
                    <span className="footer-dot"></span>
                    <span>
                        <iconify-icon icon="lucide:database"></iconify-icon>
                        SQLite Local
                    </span>
                </div>
                <div className="footer-right">
                    <button>Help</button>
                    <button>Feedback</button>
                </div>
            </footer>

            {/* New Expedition Modal */}
            {showNewModal && (
                <NewExpeditionModal
                    onClose={() => setShowNewModal(false)}
                    onCreated={() => {
                        setShowNewModal(false);
                        loadExpeditions();
                    }}
                />
            )}
        </div>
    );
}

export default Dashboard;
