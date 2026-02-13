import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QuizSection from './QuizSection';
import './VideoPlayer.css';

function VideoPlayer() {
    const { expeditionId, waypointId } = useParams();
    const navigate = useNavigate();
    const playerRef = useRef(null);
    const playerContainerRef = useRef(null);

    const [expedition, setExpedition] = useState(null);
    const [waypoint, setWaypoint] = useState(null);
    const [waypoints, setWaypoints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('fieldGuide');

    // Field Guide state
    const [fieldGuide, setFieldGuide] = useState(null);
    const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

    // Chat state
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isSendingMessage, setIsSendingMessage] = useState(false);

    // Quiz state
    const [quiz, setQuiz] = useState(null);
    const [showQuiz, setShowQuiz] = useState(false);

    useEffect(() => {
        loadData();
    }, [expeditionId, waypointId]);

    useEffect(() => {
        if (waypoint?.youtube_id) {
            initializePlayer();
        }
        return () => {
            if (playerRef.current) {
                playerRef.current.destroy?.();
            }
        };
    }, [waypoint?.youtube_id]);

    async function loadData() {
        try {
            if (window.atlased) {
                const exp = await window.atlased.expeditions.get(expeditionId);
                const wps = await window.atlased.waypoints.getByExpedition(expeditionId);
                const wp = wps?.find(w => w.id === parseInt(waypointId));

                setExpedition(exp);
                setWaypoints(wps || []);
                setWaypoint(wp);

                // Load field guide if exists
                if (wp?.field_guide) {
                    try {
                        setFieldGuide(JSON.parse(wp.field_guide));
                    } catch (e) {
                        setFieldGuide(null);
                    }
                }

                // Initialize chat with welcome message
                setChatMessages([{
                    role: 'assistant',
                    content: "Hello! I'm Compass, your AI learning assistant. I can answer questions about this video, explain concepts in different ways, or provide additional examples. What would you like to know?"
                }]);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setIsLoading(false);
        }
    }

    function initializePlayer() {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = 'https://www.youtube.com/iframe_api';
            document.body.appendChild(tag);
            window.onYouTubeIframeAPIReady = createPlayer;
        } else {
            createPlayer();
        }
    }

    function createPlayer() {
        if (playerRef.current) {
            playerRef.current.destroy?.();
        }

        playerRef.current = new window.YT.Player(playerContainerRef.current, {
            videoId: waypoint.youtube_id,
            playerVars: {
                autoplay: 0,
                modestbranding: 1,
                rel: 0,
                origin: window.location.origin
            },
            events: {
                onStateChange: handleStateChange
            }
        });
    }

    function handleStateChange(event) {
        // Save progress when video ends or pauses
        if (event.data === window.YT?.PlayerState?.ENDED) {
            saveProgress(100);
        } else if (event.data === window.YT?.PlayerState?.PAUSED) {
            const duration = playerRef.current?.getDuration?.() || 1;
            const currentTime = playerRef.current?.getCurrentTime?.() || 0;
            const percent = Math.round((currentTime / duration) * 100);
            saveProgress(percent);
        }
    }

    async function saveProgress(percent) {
        try {
            if (window.atlased && waypoint) {
                await window.atlased.waypoints.updateProgress(waypoint.id, percent);
            }
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    }

    async function generateFieldGuide() {
        setIsGeneratingGuide(true);
        try {
            if (window.atlased) {
                const guide = await window.atlased.ai.generateFieldGuide(
                    waypoint.youtube_id,
                    waypoint.title
                );
                setFieldGuide(guide);

                // Save to waypoint
                await window.atlased.waypoints.update(waypoint.id, {
                    field_guide: JSON.stringify(guide)
                });
            }
        } catch (error) {
            console.error('Error generating field guide:', error);
        } finally {
            setIsGeneratingGuide(false);
        }
    }

    async function sendChatMessage() {
        if (!chatInput.trim() || isSendingMessage) return;

        const userMessage = chatInput.trim();
        setChatInput('');
        setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setIsSendingMessage(true);

        try {
            if (window.atlased) {
                const response = await window.atlased.ai.chat(
                    waypoint.youtube_id,
                    waypoint.title,
                    userMessage,
                    chatMessages
                );
                setChatMessages(prev => [...prev, { role: 'assistant', content: response }]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setChatMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.'
            }]);
        } finally {
            setIsSendingMessage(false);
        }
    }

    function getCurrentIndex() {
        return waypoints.findIndex(w => w.id === parseInt(waypointId));
    }

    function goToPrevious() {
        const index = getCurrentIndex();
        if (index > 0) {
            navigate(`/expedition/${expeditionId}/waypoint/${waypoints[index - 1].id}`);
        }
    }

    function goToNext() {
        const index = getCurrentIndex();
        if (index < waypoints.length - 1) {
            navigate(`/expedition/${expeditionId}/waypoint/${waypoints[index + 1].id}`);
        }
    }

    async function markComplete() {
        await saveProgress(100);
        goToNext();
    }

    function formatDuration(seconds) {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    if (isLoading) {
        return (
            <div className="video-player-page">
                <header className="video-player-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate(`/expedition/${expeditionId}`)}>
                            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                            <span>Expedition</span>
                        </button>
                    </div>
                </header>
                <div className="video-player-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="field-guide-loading">
                        <div className="field-guide-loading-spinner"></div>
                        <p className="field-guide-loading-text">Loading...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!waypoint) {
        return (
            <div className="video-player-page">
                <header className="video-player-header">
                    <div className="header-left">
                        <button className="back-btn" onClick={() => navigate(`/expedition/${expeditionId}`)}>
                            <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                            <span>Expedition</span>
                        </button>
                    </div>
                </header>
                <div className="video-player-main" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="error-state">
                        <div className="error-icon">
                            <iconify-icon icon="lucide:alert-circle"></iconify-icon>
                        </div>
                        <p className="error-title">Waypoint not found</p>
                        <p className="error-text">This waypoint doesn't exist or has been deleted.</p>
                    </div>
                </div>
            </div>
        );
    }

    const currentIndex = getCurrentIndex();
    const totalWaypoints = waypoints.length;

    return (
        <div className="video-player-page">
            {/* Title Bar */}
            <header className="video-player-header">
                <div className="header-left">
                    <button className="back-btn" onClick={() => navigate(`/expedition/${expeditionId}`)}>
                        <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                        <span>Expedition</span>
                    </button>
                    <div className="header-divider"></div>
                    <span className="header-expedition-name">{expedition?.title}</span>
                </div>

                <div className="header-right">
                    <button className="header-btn" onClick={() => navigate('/settings')}>
                        <iconify-icon icon="lucide:settings"></iconify-icon>
                    </button>
                </div>
            </header>

            {/* Main Content Grid */}
            <div className="video-player-main">
                {/* LEFT COLUMN: Video Player */}
                <div className="video-column">
                    <div className="video-container">
                        <div ref={playerContainerRef} style={{ width: '100%', height: '100%' }}></div>
                    </div>

                    {/* Video Info */}
                    <div className="video-info">
                        <div className="video-info-header">
                            <h2 className="video-title">{currentIndex + 1}. {waypoint.title}</h2>
                            <span className="video-waypoint-badge">Waypoint {currentIndex + 1}/{totalWaypoints}</span>
                        </div>
                        <p className="video-description">
                            {waypoint.description || 'Watch this video to continue your learning journey.'}
                        </p>
                    </div>
                </div>

                {/* CENTER COLUMN: Navigation */}
                <div className="navigation-column">
                    {/* Waypoint Info */}
                    <div className="waypoint-info">
                        <div className="waypoint-info-header">
                            <div className="waypoint-info-icon">
                                <iconify-icon icon="lucide:map-pin"></iconify-icon>
                            </div>
                            <span className="waypoint-info-label">Current</span>
                        </div>
                        <h3 className="waypoint-info-title">{waypoint.title}</h3>
                        <p className="waypoint-info-duration">Duration: {formatDuration(waypoint.duration_seconds)}</p>
                    </div>

                    {/* Description */}
                    <div className="waypoint-description">
                        <h4 className="waypoint-description-label">About this Waypoint</h4>
                        <p className="waypoint-description-text">
                            {waypoint.description || 'This video covers important concepts in your learning journey. Watch attentively and take notes for the best learning experience.'}
                        </p>

                        <div className="waypoint-tags">
                            <span className="waypoint-tag">Learning</span>
                            <span className="waypoint-tag">Video</span>
                        </div>
                    </div>

                    {/* Navigation Actions */}
                    <div className="navigation-actions">
                        <button
                            className="nav-btn secondary"
                            onClick={goToPrevious}
                            disabled={currentIndex === 0}
                        >
                            <iconify-icon icon="lucide:chevron-left"></iconify-icon>
                            Previous
                        </button>

                        <button className="nav-btn primary" onClick={markComplete}>
                            <iconify-icon icon="lucide:check-circle"></iconify-icon>
                            Mark Complete
                        </button>

                        <button
                            className="nav-btn secondary"
                            onClick={goToNext}
                            disabled={currentIndex === totalWaypoints - 1}
                        >
                            Next
                            <iconify-icon icon="lucide:chevron-right"></iconify-icon>
                        </button>
                    </div>
                </div>

                {/* RIGHT COLUMN: Tabs */}
                <div className="tabs-column">
                    {/* Tab Headers */}
                    <div className="tab-headers">
                        <button
                            className={`tab-btn ${activeTab === 'fieldGuide' ? 'active' : ''}`}
                            onClick={() => setActiveTab('fieldGuide')}
                        >
                            <iconify-icon icon="lucide:book-open"></iconify-icon>
                            Field Guide
                        </button>
                        <button
                            className={`tab-btn ${activeTab === 'compass' ? 'active' : ''}`}
                            onClick={() => setActiveTab('compass')}
                        >
                            <iconify-icon icon="lucide:compass"></iconify-icon>
                            Compass AI
                        </button>
                    </div>

                    {/* Tab Content: Field Guide */}
                    <div className={`tab-content ${activeTab === 'fieldGuide' ? '' : 'hidden'}`}>
                        {isGeneratingGuide ? (
                            <div className="field-guide-loading">
                                <div className="field-guide-loading-spinner"></div>
                                <p className="field-guide-loading-text">Generating Field Guide...</p>
                            </div>
                        ) : fieldGuide ? (
                            <>
                                {/* Summary */}
                                <div className="field-guide-section">
                                    <h3 className="field-guide-heading">
                                        <iconify-icon icon="lucide:scroll-text"></iconify-icon>
                                        Summary
                                    </h3>
                                    <p className="field-guide-text">{fieldGuide.summary}</p>
                                </div>

                                {/* Key Concepts */}
                                {fieldGuide.keyConcepts && (
                                    <div className="field-guide-section">
                                        <h3 className="field-guide-heading">
                                            <iconify-icon icon="lucide:key"></iconify-icon>
                                            Key Concepts
                                        </h3>
                                        <ul className="key-concepts-list">
                                            {fieldGuide.keyConcepts.map((concept, i) => (
                                                <li key={i} className="key-concept-item">
                                                    <span className="key-concept-number">
                                                        <span>{i + 1}</span>
                                                    </span>
                                                    <span className="key-concept-text">{concept}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {/* Code Examples */}
                                {fieldGuide.codeExamples && fieldGuide.codeExamples.length > 0 && (
                                    <div className="field-guide-section">
                                        <h3 className="field-guide-heading">
                                            <iconify-icon icon="lucide:code-2"></iconify-icon>
                                            Code Example
                                        </h3>
                                        <div className="code-block">
                                            <pre>{fieldGuide.codeExamples[0]}</pre>
                                        </div>
                                    </div>
                                )}

                                {/* Important Notes */}
                                {fieldGuide.importantNotes && (
                                    <div className="note-box">
                                        <div className="note-box-content">
                                            <iconify-icon icon="lucide:alert-circle"></iconify-icon>
                                            <div>
                                                <h4 className="note-box-title">Remember</h4>
                                                <p className="note-box-text">{fieldGuide.importantNotes}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="field-guide-loading">
                                <div className="error-icon" style={{ marginBottom: '1rem' }}>
                                    <iconify-icon icon="lucide:book-open" style={{ color: '#737373' }}></iconify-icon>
                                </div>
                                <p className="error-title">No Field Guide Yet</p>
                                <p className="error-text" style={{ marginBottom: '1.5rem' }}>
                                    Generate a comprehensive study guide for this video.
                                </p>
                                <button className="generate-btn" onClick={generateFieldGuide}>
                                    <iconify-icon icon="lucide:sparkles"></iconify-icon>
                                    Generate Field Guide
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Tab Content: Compass AI */}
                    <div className={`tab-content ${activeTab === 'compass' ? '' : 'hidden'}`} style={{ padding: 0, display: activeTab === 'compass' ? 'flex' : 'none', flexDirection: 'column' }}>
                        <div className="chat-container">
                            {/* Chat Messages */}
                            <div className="chat-messages">
                                {chatMessages.map((message, index) => (
                                    <div key={index} className={`chat-message ${message.role === 'user' ? 'user' : ''}`}>
                                        {message.role === 'assistant' && (
                                            <div className="chat-avatar">
                                                <iconify-icon icon="lucide:compass"></iconify-icon>
                                            </div>
                                        )}
                                        <div className={`chat-bubble ${message.role === 'user' ? 'user' : 'ai'}`}>
                                            <p>{message.content}</p>
                                        </div>
                                    </div>
                                ))}
                                {isSendingMessage && (
                                    <div className="chat-message">
                                        <div className="chat-avatar">
                                            <iconify-icon icon="lucide:compass"></iconify-icon>
                                        </div>
                                        <div className="chat-bubble ai">
                                            <p>Thinking...</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Chat Input */}
                            <div className="chat-input-container">
                                <div className="chat-input-row">
                                    <input
                                        type="text"
                                        className="chat-input"
                                        placeholder="Ask Compass about this video..."
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                                        disabled={isSendingMessage}
                                    />
                                    <button
                                        className="chat-send-btn"
                                        onClick={sendChatMessage}
                                        disabled={isSendingMessage || !chatInput.trim()}
                                    >
                                        <iconify-icon icon="lucide:send"></iconify-icon>
                                    </button>
                                </div>
                                <p className="chat-disclaimer">
                                    Compass AI may produce inaccurate information. Always verify important concepts.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quiz Overlay */}
            {showQuiz && quiz && (
                <div className="quiz-overlay">
                    <div className="quiz-container">
                        <QuizSection
                            quiz={quiz}
                            onComplete={() => setShowQuiz(false)}
                            onClose={() => setShowQuiz(false)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

export default VideoPlayer;
