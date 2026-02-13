import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './MemoryCheckpoints.css';

function MemoryCheckpoints() {
    const navigate = useNavigate();
    const [checkpoints, setCheckpoints] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date-asc');

    // Mock data for demonstration
    useEffect(() => {
        // Simulate loading data
        setTimeout(() => {
            const mockCheckpoints = [
                {
                    id: 1,
                    title: 'React useState Hook Fundamentals',
                    expedition: 'Advanced React Patterns',
                    dueDate: new Date(),
                    difficulty: 'medium',
                    retentionStrength: 65,
                    lastReviewed: '3 days ago',
                    status: 'due'
                },
                {
                    id: 2,
                    title: 'Component Lifecycle Methods',
                    expedition: 'Advanced React Patterns',
                    dueDate: new Date(),
                    difficulty: 'hard',
                    retentionStrength: 45,
                    lastReviewed: '5 days ago',
                    status: 'due'
                },
                {
                    id: 3,
                    title: 'CSS Grid vs Flexbox',
                    expedition: 'Modern CSS Mastery',
                    dueDate: new Date(Date.now() + 86400000),
                    difficulty: 'easy',
                    retentionStrength: 85,
                    lastReviewed: '1 week ago',
                    status: 'upcoming'
                },
                {
                    id: 4,
                    title: 'TypeScript Generics',
                    expedition: 'TypeScript Fundamentals',
                    dueDate: new Date(Date.now() + 172800000),
                    difficulty: 'hard',
                    retentionStrength: 30,
                    lastReviewed: '2 weeks ago',
                    status: 'upcoming'
                }
            ];
            setCheckpoints(mockCheckpoints);
            setIsLoading(false);
        }, 500);
    }, []);

    const stats = {
        dueToday: checkpoints.filter(c => c.status === 'due').length,
        upcoming: checkpoints.filter(c => c.status === 'upcoming').length,
        completed: 89 // Mock completed count
    };

    const filteredCheckpoints = checkpoints.filter(cp => {
        if (filter === 'all') return true;
        if (filter === 'due') return cp.status === 'due';
        return cp.difficulty === filter;
    });

    const sortedCheckpoints = [...filteredCheckpoints].sort((a, b) => {
        if (sortBy === 'date-asc') return a.dueDate - b.dueDate;
        if (sortBy === 'date-desc') return b.dueDate - a.dueDate;
        if (sortBy === 'difficulty') {
            const diffOrder = { easy: 1, medium: 2, hard: 3 };
            return diffOrder[a.difficulty] - diffOrder[b.difficulty];
        }
        return 0;
    });

    function getDifficultyClass(difficulty) {
        switch (difficulty) {
            case 'easy': return 'difficulty-easy';
            case 'medium': return 'difficulty-medium';
            case 'hard': return 'difficulty-hard';
            default: return '';
        }
    }

    function getDifficultyLabel(difficulty) {
        switch (difficulty) {
            case 'easy': return 'Easy';
            case 'medium': return 'Medium';
            case 'hard': return 'Hard';
            default: return 'Unknown';
        }
    }

    function formatDueDate(date) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dueDate = new Date(date);
        dueDate.setHours(0, 0, 0, 0);
        
        const diffTime = dueDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Due today';
        if (diffDays === 1) return 'Due tomorrow';
        if (diffDays < 0) return 'Overdue';
        return `Due in ${diffDays} days`;
    }

    if (isLoading) {
        return (
            <div className="memory-checkpoints">
                <div className="mc-loading">
                    <div className="mc-loading-spinner"></div>
                    <p>Loading checkpoints...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="memory-checkpoints">
            {/* Title Bar */}
            <header className="mc-header drag-region">
                <div className="mc-header-left no-drag">
                    <button className="mc-back-btn" onClick={() => navigate('/')}>
                        <iconify-icon icon="lucide:arrow-left"></iconify-icon>
                    </button>
                    <div className="mc-logo">
                        <div className="mc-logo-icon">
                            <iconify-icon icon="lucide:compass"></iconify-icon>
                        </div>
                        <span className="mc-logo-text">AtlasED</span>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="mc-main">
                {/* Header Section */}
                <div className="mc-hero">
                    <div className="mc-hero-content">
                        <div className="mc-hero-text">
                            <h1 className="mc-title">Memory Checkpoints</h1>
                            <p className="mc-description">
                                Spaced repetition reviews are scheduled to maximize long-term retention. 
                                Complete checkpoints when due to strengthen neural pathways and prevent forgetting.
                            </p>
                        </div>
                        
                        {/* Stats */}
                        <div className="mc-stats">
                            <div className="mc-stat">
                                <div className="mc-stat-value mc-stat-due">{stats.dueToday}</div>
                                <div className="mc-stat-label">Due Today</div>
                            </div>
                            <div className="mc-stat-divider"></div>
                            <div className="mc-stat">
                                <div className="mc-stat-value">{stats.upcoming}</div>
                                <div class="mc-stat-label">Upcoming</div>
                            </div>
                            <div className="mc-stat-divider"></div>
                            <div className="mc-stat">
                                <div className="mc-stat-value mc-stat-success">{stats.completed}</div>
                                <div className="mc-stat-label">Completed</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Bar */}
                <div className="mc-filter-bar">
                    <div className="mc-filter-bar-content">
                        <div className="mc-filters">
                            <div className="mc-select-wrapper">
                                <select 
                                    className="mc-select" 
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                >
                                    <option value="all">All Checkpoints</option>
                                    <option value="due">Due Today</option>
                                    <option value="easy">Easy Difficulty</option>
                                    <option value="medium">Medium Difficulty</option>
                                    <option value="hard">Hard Difficulty</option>
                                </select>
                                <iconify-icon icon="lucide:chevron-down" className="mc-select-icon"></iconify-icon>
                            </div>
                            
                            <div className="mc-select-wrapper">
                                <select 
                                    className="mc-select"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                >
                                    <option value="date-asc">Due Date (Earliest)</option>
                                    <option value="date-desc">Due Date (Latest)</option>
                                    <option value="difficulty">Difficulty Level</option>
                                </select>
                                <iconify-icon icon="lucide:chevron-down" className="mc-select-icon"></iconify-icon>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Checkpoints List */}
                <div className="mc-content">
                    {sortedCheckpoints.length === 0 ? (
                        <div className="mc-empty">
                            <iconify-icon icon="lucide:brain" className="mc-empty-icon"></iconify-icon>
                            <h3 className="mc-empty-title">No Checkpoints</h3>
                            <p className="mc-empty-text">Complete waypoints to generate memory checkpoints for spaced repetition.</p>
                        </div>
                    ) : (
                        <div className="mc-checkpoints-list">
                            {sortedCheckpoints.map((checkpoint) => (
                                <div 
                                    key={checkpoint.id} 
                                    className={`mc-checkpoint-card ${getDifficultyClass(checkpoint.difficulty)}`}
                                >
                                    <div className="mc-checkpoint-main">
                                        <div className="mc-checkpoint-header">
                                            <div className={`mc-difficulty-badge mc-difficulty-${checkpoint.difficulty}`}>
                                                {getDifficultyLabel(checkpoint.difficulty)}
                                            </div>
                                            <div className={`mc-due-badge ${checkpoint.status === 'due' ? 'mc-due-urgent' : ''}`}>
                                                <iconify-icon icon="lucide:clock"></iconify-icon>
                                                {formatDueDate(checkpoint.dueDate)}
                                            </div>
                                        </div>
                                        
                                        <h3 className="mc-checkpoint-title">{checkpoint.title}</h3>
                                        <p className="mc-checkpoint-expedition">
                                            <iconify-icon icon="lucide:map-pin"></iconify-icon>
                                            {checkpoint.expedition}
                                        </p>
                                        
                                        <div className="mc-retention">
                                            <div className="mc-retention-header">
                                                <span className="mc-retention-label">Retention Strength</span>
                                                <span className="mc-retention-value">{checkpoint.retentionStrength}%</span>
                                            </div>
                                            <div className="mc-retention-bar">
                                                <div 
                                                    className="mc-retention-fill"
                                                    style={{ width: `${checkpoint.retentionStrength}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mc-checkpoint-actions">
                                        <div className="mc-last-reviewed">
                                            <iconify-icon icon="lucide:history"></iconify-icon>
                                            <span>{checkpoint.lastReviewed}</span>
                                        </div>
                                        <button className="mc-start-btn">
                                            <iconify-icon icon="lucide:brain"></iconify-icon>
                                            Start Review
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default MemoryCheckpoints;
