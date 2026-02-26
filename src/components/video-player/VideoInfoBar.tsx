import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Clock, CheckCircle, MapPin, ChevronLeft, ChevronRight, BrainCircuit,
    Bookmark, X, Pencil
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbWaypoint, DbBookmark } from "@/types/electron";
import type { QuizQuestion, QuizResult } from "@/components/modals/QuizModal";

interface VideoInfoBarProps {
    waypoint: DbWaypoint;
    videoDuration: number | null;
    currentVideoTime: number;
    quizQuestions: QuizQuestion[];
    quizResults: Map<number, QuizResult>;
    autoQuizEnabled: boolean;
    prevWaypointId: string | null;
    nextWaypointId: string | null;
    bookmarks: DbBookmark[];
    onMarkComplete: () => void;
    onAddBookmark: () => void;
    onDeleteBookmark: (id: string) => void;
    onUpdateBookmark: (id: string, data: { label?: string; color?: string }) => void;
    onQuizMarkerClick: (question: QuizQuestion) => void;
    onSeekTo: (seconds: number) => void;
}

const BOOKMARK_COLORS = [
    { name: 'gold', class: 'bg-atlas-gold', ring: 'ring-atlas-gold/40' },
    { name: 'blue', class: 'bg-blue-400', ring: 'ring-blue-400/40' },
    { name: 'green', class: 'bg-emerald-400', ring: 'ring-emerald-400/40' },
    { name: 'red', class: 'bg-red-400', ring: 'ring-red-400/40' },
    { name: 'purple', class: 'bg-purple-400', ring: 'ring-purple-400/40' },
];

function getBookmarkColorClass(color: string) {
    return BOOKMARK_COLORS.find(c => c.name === color)?.class || 'bg-atlas-gold';
}

function getBookmarkRingClass(color: string) {
    return BOOKMARK_COLORS.find(c => c.name === color)?.ring || 'ring-atlas-gold/40';
}

export function VideoInfoBar({
    waypoint,
    videoDuration,
    currentVideoTime,
    quizQuestions,
    quizResults,
    autoQuizEnabled,
    prevWaypointId,
    nextWaypointId,
    bookmarks,
    onMarkComplete,
    onAddBookmark,
    onDeleteBookmark,
    onUpdateBookmark,
    onQuizMarkerClick,
    onSeekTo,
}: VideoInfoBarProps) {
    const navigate = useNavigate();
    const [activeBookmarkId, setActiveBookmarkId] = useState<string | null>(null);
    const [editLabel, setEditLabel] = useState("");
    const popoverRef = useRef<HTMLDivElement>(null);

    // Close popover when clicking outside
    useEffect(() => {
        if (!activeBookmarkId) return;
        const handler = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setActiveBookmarkId(null);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [activeBookmarkId]);

    const formatDuration = (dur: number) => {
        const h = Math.floor(dur / 3600);
        const m = Math.floor((dur % 3600) / 60);
        const s = dur % 60;
        return h > 0
            ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
            : `${m}:${String(s).padStart(2, '0')}`;
    };

    const formatTimestamp = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${String(s).padStart(2, '0')}`;
    };

    const timedQuizzes = quizQuestions.filter(q => q.timestamp_seconds);
    const completedQuizzes = timedQuizzes.filter(q => q.timestamp_seconds && quizResults.has(q.timestamp_seconds));
    const hasTimeline = videoDuration && videoDuration > 0;

    return (
        <div className="p-4 border-t border-atlas-border bg-atlas-bg-secondary flex-shrink-0">
            <div className="flex items-start justify-between gap-3 mb-3">
                <h2 className="font-display font-bold text-base text-atlas-text-primary leading-tight line-clamp-2">
                    {waypoint.title}
                </h2>
                <span className="text-xs text-atlas-text-muted bg-atlas-bg-tertiary px-2 py-1 rounded flex-shrink-0">
                    Waypoint {waypoint.order_index + 1}
                </span>
            </div>

            {/* Duration + Status + Bookmark Button Row */}
            <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1.5 text-atlas-text-secondary">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs">
                        {(() => {
                            const dur = videoDuration || waypoint.duration_seconds;
                            if (!dur) return '—';
                            return formatDuration(dur);
                        })()}
                    </span>
                </div>
                <div className="w-px h-3 bg-atlas-border" />
                {waypoint.is_charted ? (
                    <div className="flex items-center gap-1.5 text-atlas-success">
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Charted</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-1.5 text-atlas-text-muted">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="text-xs">Not charted</span>
                    </div>
                )}

                {/* Bookmark button — pushed to the right */}
                <button
                    onClick={onAddBookmark}
                    disabled={!currentVideoTime}
                    className={cn(
                        "ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-200",
                        currentVideoTime
                            ? "bg-atlas-gold/10 text-atlas-gold border border-atlas-gold/20 hover:bg-atlas-gold/20 hover:border-atlas-gold/40 hover:shadow-sm hover:shadow-atlas-gold/10"
                            : "bg-atlas-bg-tertiary/50 text-atlas-text-muted/40 cursor-not-allowed"
                    )}
                    title="Bookmark this moment"
                >
                    <Bookmark className="w-3 h-3" />
                    <span>Bookmark</span>
                </button>
            </div>

            {/* Timeline Bar — Quiz + Bookmark Markers */}
            {hasTimeline && (timedQuizzes.length > 0 || bookmarks.length > 0) && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            {timedQuizzes.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <BrainCircuit className="w-3.5 h-3.5 text-atlas-gold" />
                                    <span className="text-xs font-medium text-atlas-text-secondary">
                                        {completedQuizzes.length}/{timedQuizzes.length} Quizzes
                                    </span>
                                </div>
                            )}
                            {bookmarks.length > 0 && (
                                <div className="flex items-center gap-1.5">
                                    <Bookmark className="w-3 h-3 text-atlas-text-muted" />
                                    <span className="text-xs text-atlas-text-muted">
                                        {bookmarks.length} bookmark{bookmarks.length !== 1 ? 's' : ''}
                                    </span>
                                </div>
                            )}
                        </div>
                        {timedQuizzes.length > 0 && (
                            autoQuizEnabled ? (
                                <span className="text-[10px] text-atlas-gold/70 uppercase tracking-wider font-medium">Auto-pause on</span>
                            ) : (
                                <span className="text-[10px] text-atlas-text-muted uppercase tracking-wider">Auto-pause off</span>
                            )
                        )}
                    </div>
                    <div className="relative h-1.5 bg-atlas-bg-tertiary rounded-full overflow-visible mt-3">
                        {/* Playback progress */}
                        <div
                            className="absolute inset-y-0 left-0 bg-atlas-text-muted/20 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (currentVideoTime / videoDuration) * 100)}%` }}
                        />

                        {/* Quiz markers */}
                        {quizQuestions.map((q) => {
                            if (!q.timestamp_seconds) return null;
                            const position = (q.timestamp_seconds / videoDuration) * 100;
                            const result = quizResults.get(q.timestamp_seconds);
                            const isAnswered = !!result;
                            const wasCorrect = result?.isCorrect ?? false;
                            return (
                                <button
                                    key={`quiz-marker-${q.timestamp_seconds}`}
                                    className={cn(
                                        "absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 transition-all duration-300 hover:scale-150 z-10 cursor-pointer",
                                        isAnswered
                                            ? wasCorrect
                                                ? "bg-atlas-success border-atlas-success/50 shadow-sm shadow-atlas-success/30"
                                                : "bg-atlas-error border-atlas-error/50 shadow-sm shadow-atlas-error/30"
                                            : "bg-atlas-gold border-atlas-gold/50 shadow-sm shadow-atlas-gold/30 animate-pulse"
                                    )}
                                    style={{ left: `${position}%`, marginLeft: '-6px' }}
                                    title={`Quiz at ${formatTimestamp(q.timestamp_seconds)}${isAnswered ? (wasCorrect ? ' ✓ Correct — click to review' : ' ✗ Incorrect — click to review') : ''}`}
                                    onClick={() => onQuizMarkerClick(q)}
                                />
                            );
                        })}

                        {/* Bookmark markers */}
                        {bookmarks.map((bm) => {
                            const position = (bm.timestamp_seconds / videoDuration) * 100;
                            const isActive = activeBookmarkId === bm.id;
                            // Determine popover alignment based on position
                            const popoverAlign = position < 20 ? 'left' : position > 80 ? 'right' : 'center';
                            return (
                                <div key={`bm-${bm.id}`} className="absolute" style={{ left: `${position}%` }}>
                                    {/* Bookmark pin marker — sits above the timeline */}
                                    <button
                                        className={cn(
                                            "absolute -top-3 -translate-x-1/2 flex flex-col items-center transition-all duration-200 hover:scale-125 z-20 group",
                                            isActive && "scale-125"
                                        )}
                                        title={bm.label ? `${bm.label} (${formatTimestamp(bm.timestamp_seconds)})` : `Bookmark at ${formatTimestamp(bm.timestamp_seconds)}`}
                                        onClick={() => {
                                            if (isActive) {
                                                setActiveBookmarkId(null);
                                            } else {
                                                setActiveBookmarkId(bm.id);
                                                setEditLabel(bm.label || "");
                                            }
                                        }}
                                    >
                                        {/* Flag head */}
                                        <div className={cn(
                                            "w-2 h-2.5 rounded-t-sm rounded-b-none",
                                            getBookmarkColorClass(bm.color),
                                            "shadow-sm",
                                        )} style={{ clipPath: 'polygon(0 0, 100% 0, 100% 70%, 50% 100%, 0 70%)' }} />
                                        {/* Stem */}
                                        <div className={cn(
                                            "w-[1.5px] h-1.5",
                                            getBookmarkColorClass(bm.color),
                                            "opacity-60"
                                        )} />
                                    </button>

                                    {/* Bookmark popover — positioned above, edge-aware */}
                                    {isActive && (
                                        <div
                                            ref={popoverRef}
                                            className={cn(
                                                "absolute bottom-6 z-50 w-52 bg-atlas-bg-secondary border border-atlas-border rounded-xl shadow-2xl shadow-black/40 p-3 animate-in fade-in duration-150",
                                                popoverAlign === 'left' && "left-0",
                                                popoverAlign === 'right' && "right-0",
                                                popoverAlign === 'center' && "left-1/2 -translate-x-1/2",
                                            )}
                                        >
                                            {/* Timestamp + jump */}
                                            <div className="flex items-center justify-between mb-2">
                                                <button
                                                    onClick={() => {
                                                        onSeekTo(bm.timestamp_seconds);
                                                        setActiveBookmarkId(null);
                                                    }}
                                                    className="text-xs font-mono text-atlas-gold hover:text-atlas-gold-hover transition-colors"
                                                >
                                                    ▶ {formatTimestamp(bm.timestamp_seconds)}
                                                </button>
                                                <button
                                                    onClick={() => setActiveBookmarkId(null)}
                                                    className="text-atlas-text-muted hover:text-atlas-text-primary transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>

                                            {/* Label input */}
                                            <div className="flex items-center gap-1.5 mb-2">
                                                <Pencil className="w-3 h-3 text-atlas-text-muted flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    value={editLabel}
                                                    onChange={(e) => setEditLabel(e.target.value)}
                                                    onBlur={() => {
                                                        if (editLabel !== bm.label) {
                                                            onUpdateBookmark(bm.id, { label: editLabel });
                                                        }
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            onUpdateBookmark(bm.id, { label: editLabel });
                                                            setActiveBookmarkId(null);
                                                        }
                                                    }}
                                                    placeholder="Add label..."
                                                    className="flex-1 bg-atlas-bg-tertiary text-xs text-atlas-text-primary placeholder:text-atlas-text-muted/50 px-2 py-1 rounded-md border-none outline-none focus:ring-1 focus:ring-atlas-gold/30 transition-all"
                                                    autoFocus
                                                />
                                            </div>

                                            {/* Color picker */}
                                            <div className="flex items-center gap-1.5 mb-2.5">
                                                {BOOKMARK_COLORS.map(c => (
                                                    <button
                                                        key={c.name}
                                                        onClick={() => onUpdateBookmark(bm.id, { color: c.name })}
                                                        className={cn(
                                                            "w-4 h-4 rounded-full transition-all duration-200",
                                                            c.class,
                                                            bm.color === c.name ? "ring-2 ring-offset-1 ring-offset-atlas-bg-secondary scale-110" : "opacity-50 hover:opacity-100 hover:scale-110",
                                                            bm.color === c.name && c.ring
                                                        )}
                                                    />
                                                ))}
                                            </div>

                                            {/* Delete */}
                                            <button
                                                onClick={() => {
                                                    onDeleteBookmark(bm.id);
                                                    setActiveBookmarkId(null);
                                                }}
                                                className="w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-400/10 py-1 rounded-md transition-all duration-200 font-medium"
                                            >
                                                Remove Bookmark
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Navigation Row */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => prevWaypointId && navigate(`/player/${prevWaypointId}`)}
                    disabled={!prevWaypointId}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg transition-all text-sm font-medium",
                        prevWaypointId
                            ? "bg-atlas-bg-tertiary hover:bg-atlas-border text-atlas-text-secondary hover:text-atlas-text-primary cursor-pointer"
                            : "bg-atlas-bg-tertiary/50 text-atlas-text-muted/40 cursor-not-allowed"
                    )}
                >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                </button>
                <button
                    onClick={onMarkComplete}
                    disabled={waypoint.is_charted === 1}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary rounded-lg transition-all text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <CheckCircle className="w-4 h-4" />
                    {waypoint.is_charted ? "Completed" : "Mark Complete"}
                </button>
                <button
                    onClick={() => nextWaypointId && navigate(`/player/${nextWaypointId}`)}
                    disabled={!nextWaypointId}
                    className={cn(
                        "flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-lg transition-all text-sm font-medium",
                        nextWaypointId
                            ? "bg-atlas-bg-tertiary hover:bg-atlas-border text-atlas-text-secondary hover:text-atlas-text-primary cursor-pointer"
                            : "bg-atlas-bg-tertiary/50 text-atlas-text-muted/40 cursor-not-allowed"
                    )}
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
