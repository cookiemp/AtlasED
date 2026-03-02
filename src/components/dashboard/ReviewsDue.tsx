import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Brain, ChevronRight, Zap, Clock, Trophy, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryCheckpoint {
    id: string;
    title: string;
    expeditionTitle: string;
    expeditionId: string;
    difficulty: "easy" | "medium" | "hard";
    lastReviewed: string;
    currentInterval: string;
    nextInterval: string;
    retentionStrength: number;
    dueDate: string;
    isDue: boolean;
    accuracy: number;
    sessionCount: number;
}

const difficultyConfig = {
    easy: { label: "Easy", color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20" },
    medium: { label: "Medium", color: "text-atlas-gold", bg: "bg-atlas-gold/10", border: "border-atlas-gold/20" },
    hard: { label: "Hard", color: "text-red-400", bg: "bg-red-400/10", border: "border-red-400/20" },
};

export function ReviewsDue() {
    const navigate = useNavigate();
    const [checkpoints, setCheckpoints] = useState<MemoryCheckpoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [srsEnabled, setSrsEnabled] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                if (window.atlased) {
                    // Check if SRS is enabled in settings
                    const enabled = await window.atlased.settings.get('srs_enabled');
                    if (enabled === false) {
                        setSrsEnabled(false);
                        setIsLoading(false);
                        return;
                    }

                    const data = await window.atlased.memoryCheckpoints.getAll();
                    setCheckpoints(data || []);
                }
            } catch (e) {
                console.error("Error loading memory checkpoints:", e);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, []);

    // If SRS is disabled, don't render the section at all
    if (!srsEnabled) return null;

    const dueItems = checkpoints.filter((c) => c.isDue);
    const upcomingItems = checkpoints.filter((c) => !c.isDue).slice(0, 3);

    // Retention strength color
    const getRetentionColor = (strength: number) => {
        if (strength >= 70) return "bg-emerald-400";
        if (strength >= 40) return "bg-atlas-gold";
        return "bg-red-400";
    };

    const getRetentionBg = (strength: number) => {
        if (strength >= 70) return "bg-emerald-400/10";
        if (strength >= 40) return "bg-atlas-gold/10";
        return "bg-red-400/10";
    };

    if (isLoading) {
        return (
            <div className="lg:col-span-2 bg-atlas-bg-secondary rounded-2xl border border-atlas-border p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-atlas-gold/10 border border-atlas-gold/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-atlas-gold" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold text-atlas-text-primary text-base">Memory Checkpoints</h3>
                        <p className="text-xs text-atlas-text-muted">Loading reviews...</p>
                    </div>
                </div>
                {/* Skeleton */}
                <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="h-20 rounded-xl bg-atlas-bg-tertiary/50 animate-pulse" />
                    ))}
                </div>
            </div>
        );
    }

    // No checkpoints at all — user hasn't taken any quizzes yet
    if (checkpoints.length === 0) {
        return (
            <div className="lg:col-span-2 bg-atlas-bg-secondary rounded-2xl border border-atlas-border p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-atlas-gold/10 border border-atlas-gold/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-atlas-gold" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold text-atlas-text-primary text-base">Memory Checkpoints</h3>
                        <p className="text-xs text-atlas-text-muted">Spaced repetition for long-term retention</p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-atlas-bg-tertiary border border-atlas-border flex items-center justify-center mb-4">
                        <Sparkles className="w-6 h-6 text-atlas-text-muted" />
                    </div>
                    <p className="text-sm font-medium text-atlas-text-secondary mb-1">No reviews yet</p>
                    <p className="text-xs text-atlas-text-muted max-w-[280px]">
                        Complete quizzes in your waypoints to unlock spaced repetition reviews
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="lg:col-span-2 bg-atlas-bg-secondary rounded-2xl border border-atlas-border p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-atlas-gold/10 border border-atlas-gold/20 flex items-center justify-center">
                        <Brain className="w-5 h-5 text-atlas-gold" />
                    </div>
                    <div>
                        <h3 className="font-display font-semibold text-atlas-text-primary text-base">Memory Checkpoints</h3>
                        <p className="text-xs text-atlas-text-muted">Spaced repetition for long-term retention</p>
                    </div>
                </div>
                {dueItems.length > 0 && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-400/10 border border-red-400/20">
                        <Zap className="w-3 h-3 text-red-400" />
                        <span className="text-xs font-semibold text-red-400">
                            {dueItems.length} due
                        </span>
                    </div>
                )}
            </div>

            {/* Due Items */}
            {dueItems.length > 0 && (
                <div className="space-y-2 mb-4">
                    <p className="text-[10px] uppercase tracking-wider text-atlas-text-muted font-medium mb-2">Due for Review</p>
                    {dueItems.map((item) => {
                        const diff = difficultyConfig[item.difficulty];
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(`/expedition/${item.expeditionId}`)}
                                className="w-full text-left p-4 rounded-xl bg-red-400/5 border border-red-400/15 hover:border-red-400/30 hover:bg-red-400/8 transition-all duration-200 group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-atlas-text-primary truncate group-hover:text-atlas-gold transition-colors duration-200">
                                            {item.title}
                                        </p>
                                        <p className="text-xs text-atlas-text-muted mt-0.5 truncate">
                                            {item.expeditionTitle}
                                        </p>
                                        <div className="flex items-center gap-3 mt-2">
                                            {/* Retention bar */}
                                            <div className="flex items-center gap-1.5 flex-1 max-w-[120px]">
                                                <div className={cn("h-1.5 rounded-full flex-1", getRetentionBg(item.retentionStrength))}>
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-500", getRetentionColor(item.retentionStrength))}
                                                        style={{ width: `${item.retentionStrength}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-atlas-text-muted font-mono">{item.retentionStrength}%</span>
                                            </div>
                                            {/* Difficulty badge */}
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", diff.bg, diff.color, diff.border, "border")}>
                                                {diff.label}
                                            </span>
                                            {/* Accuracy */}
                                            <span className="text-[10px] text-atlas-text-muted flex items-center gap-1">
                                                <Trophy className="w-2.5 h-2.5" />
                                                {item.accuracy}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 mt-1">
                                        <span className="text-xs font-medium text-red-400">{item.dueDate}</span>
                                        <ChevronRight className="w-4 h-4 text-atlas-text-muted group-hover:text-atlas-gold transition-colors duration-200" />
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Upcoming Items */}
            {upcomingItems.length > 0 && (
                <div className="space-y-2">
                    <p className="text-[10px] uppercase tracking-wider text-atlas-text-muted font-medium mb-2">Coming Up</p>
                    {upcomingItems.map((item) => {
                        const diff = difficultyConfig[item.difficulty];
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(`/expedition/${item.expeditionId}`)}
                                className="w-full text-left p-3 rounded-xl bg-atlas-bg-tertiary/50 border border-atlas-border/50 hover:border-atlas-gold/20 transition-all duration-200 group"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-atlas-text-secondary truncate group-hover:text-atlas-text-primary transition-colors duration-200">
                                            {item.title}
                                        </p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            {/* Retention bar */}
                                            <div className="flex items-center gap-1.5 flex-1 max-w-[100px]">
                                                <div className={cn("h-1 rounded-full flex-1", getRetentionBg(item.retentionStrength))}>
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-500", getRetentionColor(item.retentionStrength))}
                                                        style={{ width: `${item.retentionStrength}%` }}
                                                    />
                                                </div>
                                                <span className="text-[10px] text-atlas-text-muted font-mono">{item.retentionStrength}%</span>
                                            </div>
                                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md font-medium", diff.bg, diff.color, diff.border, "border")}>
                                                {diff.label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <Clock className="w-3 h-3 text-atlas-text-muted" />
                                        <span className="text-xs text-atlas-text-muted">{item.dueDate}</span>
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}

            {/* All caught up state */}
            {dueItems.length === 0 && checkpoints.length > 0 && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-400/5 border border-emerald-400/20 mt-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-400/15 flex items-center justify-center shrink-0">
                        <Trophy className="w-4 h-4 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-emerald-400">All caught up!</p>
                        <p className="text-xs text-atlas-text-muted mt-0.5">
                            No reviews due. Your next review is {upcomingItems[0]?.dueDate || "soon"}.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
