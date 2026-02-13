import { Check, Brain, PlayCircle, PlusCircle } from "lucide-react";
import type { Activity } from "@/types/expedition";
import { cn } from "@/lib/utils";

interface RecentActivityProps {
  activities: Activity[];
}

const activityIcons = {
  completed: Check,
  checkpoint: Brain,
  started: PlayCircle,
  created: PlusCircle,
};

export function RecentActivity({ activities }: RecentActivityProps) {
  return (
    <div className="lg:col-span-2 bg-atlas-bg-secondary rounded-2xl border border-atlas-border p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-atlas-gold/10 border border-atlas-gold/20 flex items-center justify-center">
          <svg className="w-5 h-5 text-atlas-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
          </svg>
        </div>
        <div>
          <h3 className="font-display font-semibold text-atlas-text-primary text-base">Recent Activity</h3>
          <p className="text-xs text-atlas-text-muted">Your learning journey this week</p>
        </div>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const Icon = activityIcons[activity.type];
          const isCompleted = activity.type === "completed" || activity.type === "checkpoint";
          const isLast = index === activities.length - 1;

          return (
            <div key={activity.id} className="flex items-start gap-4 group">
              <div className="relative flex flex-col items-center">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  isCompleted 
                    ? "bg-atlas-gold/15 border border-atlas-gold/30" 
                    : "bg-atlas-bg-tertiary border border-atlas-border"
                )}>
                  <Icon className={cn(
                    "w-4 h-4",
                    isCompleted ? "text-atlas-gold" : "text-atlas-text-secondary"
                  )} />
                </div>
                {!isLast && <div className="w-px h-full bg-atlas-border mt-2" />}
              </div>
              <div className={cn("flex-1", !isLast && "pb-4")}>
                <div className="flex items-center justify-between mb-1">
                  <span className={cn(
                    "text-sm font-medium transition-colors duration-200",
                    isCompleted 
                      ? "text-atlas-text-primary group-hover:text-atlas-gold"
                      : "text-atlas-text-secondary group-hover:text-atlas-text-primary"
                  )}>
                    {activity.title}
                  </span>
                  <span className="text-xs text-atlas-text-muted">{activity.timestamp}</span>
                </div>
                <p className="text-xs text-atlas-text-muted">{activity.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
