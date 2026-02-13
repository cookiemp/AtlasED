import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Loader2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { ExpeditionCard } from "@/components/dashboard/ExpeditionCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { LearningTips } from "@/components/dashboard/LearningTips";
import { NewExpeditionModal } from "@/components/modals/NewExpeditionModal";
import type { Expedition, Activity } from "@/types/expedition";
import type { DbExpedition } from "@/types/electron";

// Transform database expedition to UI expedition format
function transformExpedition(dbExp: DbExpedition): Expedition {
  const total = dbExp.total_waypoints || 0;
  const completed = dbExp.completed_waypoints || 0;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    id: dbExp.id,
    title: dbExp.title,
    thumbnailUrl: dbExp.thumbnail_url,
    thumbnailGradient: "from-violet-900/40 to-purple-900/20", // Fallback gradient
    waypoints: total,
    completedWaypoints: completed,
    progress,
    isNew: progress === 0,
    startedAt: new Date(dbExp.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    lastActiveAt: formatRelativeTime(dbExp.updated_at),
  };
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? "" : "s"} ago`;
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [expeditions, setExpeditions] = useState<Expedition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Static activities for now - could be dynamic in the future
  const activities: Activity[] = [
    {
      id: "a1",
      type: "completed",
      title: "Keep learning and making progress!",
      subtitle: "Complete waypoints to track your journey",
      timestamp: "Recently",
    },
  ];

  const loadExpeditions = useCallback(async () => {
    try {
      if (window.atlased) {
        const dbExpeditions = await window.atlased.expeditions.getAll();
        const uiExpeditions = (dbExpeditions || []).map(transformExpedition);
        setExpeditions(uiExpeditions);
      }
    } catch (error) {
      console.error("Error loading expeditions:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExpeditions();
  }, [loadExpeditions]);

  const handleCreateExpedition = async (playlistUrl: string, name?: string) => {
    if (!window.atlased) return;

    try {
      // Fetch playlist/video data from main process
      const result = await window.atlased.ai.fetchPlaylist(playlistUrl);

      if (!result.success || !result.videos || result.videos.length === 0) {
        console.error("Failed to fetch playlist:", result.error);
        return;
      }

      // Determine expedition title
      const expeditionTitle = name || result.title || "New Expedition";
      const firstVideo = result.videos[0];

      // Create expedition
      const expedition = await window.atlased.expeditions.create({
        title: expeditionTitle,
        playlist_url: playlistUrl,
        thumbnail_url: firstVideo.thumbnail_url || `https://i.ytimg.com/vi/${firstVideo.youtube_id}/mqdefault.jpg`,
      });

      // Create waypoints for ALL videos
      for (const video of result.videos) {
        await window.atlased.waypoints.create({
          expedition_id: expedition.id,
          title: video.title || `Video ${video.order_index + 1}`,
          youtube_id: video.youtube_id,
          order_index: video.order_index,
          thumbnail_url: video.thumbnail_url || undefined,
          duration_seconds: video.duration_seconds || undefined,
        });
      }

      // Reload expeditions to show the new one
      await loadExpeditions();
    } catch (error) {
      console.error("Error creating expedition:", error);
    }
  };

  const handleDeleteExpedition = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this expedition?")) {
      try {
        if (window.atlased) {
          await window.atlased.expeditions.delete(id);
          await loadExpeditions();
        }
      } catch (error) {
        console.error("Error deleting expedition:", error);
      }
    }
  };

  if (isLoading) {
    return (
      <AppLayout showFooter={true}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-atlas-gold animate-spin" />
            <p className="text-atlas-text-secondary">Loading expeditions...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isEmpty = expeditions.length === 0;

  return (
    <AppLayout showFooter={true}>
      {isEmpty ? (
        <EmptyState onCreateExpedition={() => setIsModalOpen(true)} />
      ) : (
        <div className="flex-1 flex flex-col">
          {/* Header Section */}
          <div className="px-8 py-8 md:px-12 lg:px-16">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="font-display font-bold text-3xl md:text-4xl text-atlas-text-primary tracking-tight">
                  Your Expeditions
                </h1>
                <p className="text-atlas-text-secondary mt-1.5 text-base">
                  Transform YouTube playlists into structured learning journeys
                </p>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => setIsModalOpen(true)}
                className="group flex items-center gap-3 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-semibold px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-atlas-gold/20 hover:-translate-y-0.5"
              >
                <Plus className="w-5 h-5" />
                <span>Start New Expedition</span>
              </button>
            </div>
          </div>

          {/* Content Container */}
          <div className="flex-1 px-8 md:px-12 lg:px-16 pb-8">
            {/* Expedition Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {expeditions.map((expedition) => (
                <ExpeditionCard
                  key={expedition.id}
                  expedition={expedition}
                  onClick={() => navigate(`/expedition/${expedition.id}`)}
                  onDelete={() => handleDeleteExpedition(expedition.id)}
                />
              ))}
            </div>

            {/* Info Section */}
            <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <RecentActivity activities={activities} />
              <LearningTips />
            </div>
          </div>
        </div>
      )}

      <NewExpeditionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreateExpedition}
      />
    </AppLayout>
  );
}
