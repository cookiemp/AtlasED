import { Play, MapPin, CheckCircle2, Trash2, Brain } from "lucide-react";
import type { Expedition } from "@/types/expedition";
import { cn } from "@/lib/utils";

interface ExpeditionCardProps {
  expedition: Expedition;
  onClick?: () => void;
  onDelete?: () => void;
}

export function ExpeditionCard({ expedition, onClick, onDelete }: ExpeditionCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className="group relative bg-atlas-bg-secondary rounded-2xl border border-atlas-border overflow-hidden hover:border-atlas-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-atlas-gold/5 hover:-translate-y-1 cursor-pointer"
    >
      {/* Delete Button */}
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-lg bg-atlas-bg-primary/80 backdrop-blur-sm border border-atlas-border flex items-center justify-center text-atlas-text-muted hover:text-red-400 hover:border-red-400/50 opacity-0 group-hover:opacity-100 transition-all duration-200"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Memory Checkpoint Badge */}
      {expedition.hasMemoryCheckpoint && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-atlas-gold/15 border border-atlas-gold/30 backdrop-blur-sm">
          <Brain className="w-3 h-3 text-atlas-gold" />
          <span className="text-xs font-medium text-atlas-gold">Memory Checkpoint Due</span>
        </div>
      )}

      {/* New Badge */}
      {expedition.isNew && (
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-atlas-bg-tertiary border border-atlas-border backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-medium text-atlas-text-secondary">New</span>
        </div>
      )}

      {/* Thumbnail Area */}
      <div className={cn(
        "aspect-video relative overflow-hidden",
        !expedition.thumbnailUrl && `bg-gradient-to-br ${expedition.thumbnailGradient}`
      )}>
        {expedition.thumbnailUrl ? (
          <img
            src={expedition.thumbnailUrl}
            alt={expedition.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <>
            <div className="absolute inset-0 bg-atlas-bg-tertiary/30" />
            {/* Placeholder pattern */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: "radial-gradient(circle at 2px 2px, rgba(212,169,83,0.3) 1px, transparent 0)",
                backgroundSize: "24px 24px"
              }}
            />
          </>
        )}
        {/* Play icon overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-14 h-14 rounded-full bg-atlas-gold/90 flex items-center justify-center shadow-lg">
            <Play className="w-5 h-5 text-atlas-bg-primary ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Title */}
        <h3 className="font-display font-semibold text-atlas-text-primary text-base mb-3 line-clamp-1 group-hover:text-atlas-gold transition-colors duration-200">
          {expedition.title}
        </h3>

        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-atlas-text-muted">Progress</span>
            <span className={cn(
              "font-medium",
              expedition.progress > 0 ? "text-atlas-gold" : "text-atlas-text-muted"
            )}>
              {expedition.progress}%
            </span>
          </div>
          <div className="h-1.5 bg-atlas-bg-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-atlas-gold to-atlas-gold-hover rounded-full transition-all duration-500"
              style={{ width: `${expedition.progress}%` }}
            />
          </div>
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between text-xs text-atlas-text-muted">
          <div className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>{expedition.waypoints} waypoints</span>
          </div>
          <div className="flex items-center gap-1.5">
            {expedition.completedWaypoints > 0 ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-atlas-gold" />
                <span>{expedition.completedWaypoints} completed</span>
              </>
            ) : (
              <>
                <span className="w-3.5 h-3.5 border border-current rounded-full" />
                <span>Not started</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
