import { useNavigate } from "react-router-dom";
import { MapIcon, CheckCircle, CircleDot, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbWaypoint } from "@/types/electron";

interface ChartTabProps {
    allWaypoints: DbWaypoint[];
    currentWaypointId: string;
    expeditionTitle: string;
}

export function ChartTab({ allWaypoints, currentWaypointId, expeditionTitle }: ChartTabProps) {
    const navigate = useNavigate();

    const chartedCount = allWaypoints.filter(w => w.is_charted === 1).length;
    const progressPercent = allWaypoints.length > 0
        ? (chartedCount / allWaypoints.length) * 100
        : 0;

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Chart Header */}
            <div className="px-6 py-4 border-b border-atlas-border bg-atlas-bg-secondary/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <MapIcon className="w-4 h-4 text-atlas-gold" />
                        <h3 className="font-display font-semibold text-sm text-atlas-text-primary">{expeditionTitle}</h3>
                    </div>
                    <span className="text-[10px] text-atlas-text-muted font-medium">
                        {chartedCount}/{allWaypoints.length} charted
                    </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-atlas-bg-tertiary rounded-full overflow-hidden">
                    <div
                        className="h-full bg-atlas-gold rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
            {/* Waypoint List */}
            <div className="flex-1 overflow-auto">
                {allWaypoints.map((wp, idx) => {
                    const isCurrent = wp.id === currentWaypointId;
                    const isCharted = wp.is_charted === 1;
                    const inProgress = !isCharted && wp.last_watched_pos && wp.last_watched_pos > 0;
                    return (
                        <button
                            key={wp.id}
                            onClick={() => {
                                if (!isCurrent) navigate(`/player/${wp.id}`);
                            }}
                            className={cn(
                                "w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all border-l-2",
                                isCurrent
                                    ? "bg-atlas-gold/5 border-l-atlas-gold"
                                    : "border-l-transparent hover:bg-atlas-bg-tertiary/50",
                                !isCurrent && "cursor-pointer"
                            )}
                        >
                            {/* Status Icon */}
                            <div className="flex-shrink-0">
                                {isCharted ? (
                                    <CheckCircle className="w-4 h-4 text-atlas-success" />
                                ) : inProgress ? (
                                    <CircleDot className="w-4 h-4 text-atlas-gold" />
                                ) : (
                                    <Circle className="w-4 h-4 text-atlas-text-muted/40" />
                                )}
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-sm truncate leading-tight",
                                    isCurrent ? "text-atlas-gold font-semibold" : "text-atlas-text-primary"
                                )}>
                                    {(() => {
                                        const alreadyNumbered = /^\s*\d+[\.)\-\s]/.test(wp.title);
                                        return alreadyNumbered ? wp.title : `${idx + 1}. ${wp.title}`;
                                    })()}
                                </p>
                                {wp.duration_seconds ? (
                                    <span className="text-[10px] text-atlas-text-muted">
                                        {Math.floor(wp.duration_seconds / 60)}:{String(wp.duration_seconds % 60).padStart(2, '0')}
                                    </span>
                                ) : null}
                            </div>
                            {/* Current indicator */}
                            {isCurrent && (
                                <span className="text-[9px] text-atlas-gold font-bold uppercase tracking-widest flex-shrink-0">Now</span>
                            )}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
