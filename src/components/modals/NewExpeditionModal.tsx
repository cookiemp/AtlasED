import { useState } from "react";
import { X, Link, Type, Compass, Info, XCircle, RefreshCw, ArrowRight, Loader2, ListVideo } from "lucide-react";
import { Dialog, DialogContent, DialogOverlay, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { PlaylistResult } from "@/types/electron";

interface NewExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (playlistUrl: string, name?: string) => void | Promise<void>;
}

type ModalState = 'initial' | 'loading' | 'error' | 'preview';

export function NewExpeditionModal({ isOpen, onClose, onSubmit }: NewExpeditionModalProps) {
  const [playlistUrl, setPlaylistUrl] = useState("");
  const [expeditionName, setExpeditionName] = useState("");
  const [state, setState] = useState<ModalState>("initial");
  const [fetchResult, setFetchResult] = useState<PlaylistResult | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUrlChange = (value: string) => {
    setPlaylistUrl(value);
    if (state === 'error' || state === 'preview') {
      setState('initial');
      setFetchResult(null);
      setErrorMessage("");
    }
  };

  const clearUrl = () => {
    setPlaylistUrl("");
    setFetchResult(null);
    setState("initial");
    setErrorMessage("");
  };

  const handleFetch = async () => {
    if (!playlistUrl.trim() || !window.atlased) return;
    setState("loading");
    setErrorMessage("");

    try {
      const result = await window.atlased.ai.fetchPlaylist(playlistUrl);
      if (result.success && result.videos && result.videos.length > 0) {
        setFetchResult(result);
        // Auto-fill expedition name from playlist title if user hasn't typed one
        if (!expeditionName && result.title) {
          setExpeditionName(result.title);
        }
        setState("preview");
      } else {
        setErrorMessage(result.error || "Could not find any videos at this URL.");
        setState("error");
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to fetch playlist");
      setState("error");
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onSubmit(playlistUrl, expeditionName || undefined);
      onClose();
      setPlaylistUrl("");
      setExpeditionName("");
      setFetchResult(null);
      setState("initial");
    } catch (error) {
      console.error("Error creating expedition:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const retry = () => {
    setState("initial");
    setErrorMessage("");
  };

  const videoCount = fetchResult?.videos?.length || 0;
  const firstVideoId = fetchResult?.videos?.[0]?.youtube_id;
  const totalDuration = fetchResult?.videos?.reduce((acc, v) => acc + (v.duration_seconds || 0), 0) || 0;

  const formatTotalDuration = (seconds: number): string => {
    if (seconds === 0) return "";
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}m total`;
    return `${mins}m total`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogOverlay className="bg-black/60 backdrop-blur-sm" />
      <DialogContent
        className="animate-modal-enter max-w-2xl max-h-[85vh] p-0 bg-atlas-bg-secondary border-atlas-border rounded-2xl overflow-hidden flex flex-col"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Add New Expedition</DialogTitle>
        {/* Header */}
        <div className="px-8 pt-8 pb-6 border-b border-atlas-border flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-atlas-gold/10 flex items-center justify-center">
                <Compass className="w-5 h-5 text-atlas-gold" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-atlas-text-primary">Add New Expedition</h2>
                <p className="text-sm text-atlas-text-muted mt-0.5">Transform a YouTube playlist into a structured learning journey</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-atlas-text-muted hover:text-atlas-text-primary hover:bg-atlas-bg-tertiary transition-all duration-200"
            >
              <X className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 py-6 flex-1 overflow-y-auto modal-scrollbar">
          {/* YouTube URL Input */}
          <div className="space-y-2 mb-5">
            <label htmlFor="playlist-url" className="block text-sm font-medium text-atlas-text-secondary">
              YouTube Playlist URL <span className="text-atlas-gold">*</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-atlas-text-muted">
                <Link className="w-[18px] h-[18px]" />
              </div>
              <input
                id="playlist-url"
                type="text"
                value={playlistUrl}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="Paste playlist or video URL"
                className="input-glow w-full bg-atlas-bg-tertiary border border-atlas-border rounded-xl pl-11 pr-10 py-3.5 text-atlas-text-primary placeholder-atlas-text-muted focus:outline-none focus:border-atlas-gold/50 transition-all duration-200"
              />
              {playlistUrl && (
                <button
                  onClick={clearUrl}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-atlas-text-muted hover:text-atlas-text-primary"
                >
                  <XCircle className="w-[18px] h-[18px]" />
                </button>
              )}
            </div>
            <p className="text-xs text-atlas-text-muted flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Supports: youtube.com/playlist?list=..., youtu.be/..., and single video URLs
            </p>
          </div>

          {/* Expedition Name Input */}
          <div className="space-y-2 mb-6">
            <label htmlFor="expedition-name" className="block text-sm font-medium text-atlas-text-secondary">
              Expedition Name <span className="text-atlas-text-muted font-normal">(optional)</span>
            </label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-atlas-text-muted">
                <Type className="w-[18px] h-[18px]" />
              </div>
              <input
                id="expedition-name"
                type="text"
                value={expeditionName}
                onChange={(e) => setExpeditionName(e.target.value)}
                placeholder="Leave blank to use playlist title"
                className="input-glow w-full bg-atlas-bg-tertiary border border-atlas-border rounded-xl pl-11 pr-4 py-3.5 text-atlas-text-primary placeholder-atlas-text-muted focus:outline-none focus:border-atlas-gold/50 transition-all duration-200"
              />
            </div>
          </div>

          {/* Loading State */}
          {state === "loading" && (
            <div className="py-8">
              <div className="flex flex-col items-center justify-center">
                <div className="relative w-12 h-12 mb-4">
                  <div className="absolute inset-0 rounded-full border-2 border-atlas-bg-tertiary" />
                  <div className="absolute inset-0 rounded-full border-2 border-atlas-gold border-t-transparent animate-spin-slow" />
                </div>
                <p className="text-atlas-text-primary font-medium mb-1">Fetching playlist...</p>
                <p className="text-sm text-atlas-text-muted">Retrieving video information</p>
              </div>
            </div>
          )}

          {/* Error State */}
          {state === "error" && (
            <div className="mb-6">
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <XCircle className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-atlas-text-primary font-medium mb-1">Unable to fetch playlist</p>
                    <p className="text-sm text-red-400/80 mb-3">{errorMessage || "The playlist URL appears to be invalid or the playlist is private."}</p>
                    <button
                      onClick={retry}
                      className="inline-flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Try again
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {state === "preview" && fetchResult && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-atlas-text-secondary flex items-center gap-2">
                  {fetchResult.isPlaylist ? (
                    <>
                      <ListVideo className="w-4 h-4 text-atlas-gold" />
                      Playlist found <span className="text-atlas-text-primary">{videoCount} videos</span>
                    </>
                  ) : (
                    <>
                      Video found <span className="text-atlas-text-primary">(1)</span>
                    </>
                  )}
                </h3>
                {totalDuration > 0 && (
                  <span className="text-xs text-atlas-text-muted">{formatTotalDuration(totalDuration)}</span>
                )}
              </div>

              <div className="bg-atlas-bg-tertiary rounded-xl p-4 border border-atlas-border">
                {/* Thumbnail */}
                {firstVideoId && (
                  <div className="aspect-video rounded-lg overflow-hidden relative mb-4">
                    <img
                      src={`https://i.ytimg.com/vi/${firstVideoId}/hqdefault.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 px-2 py-1 bg-red-600 rounded text-white text-xs font-medium flex items-center gap-1">
                      <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      YouTube
                    </div>
                    {fetchResult.isPlaylist && (
                      <div className="absolute top-3 right-3 px-2 py-1 bg-atlas-bg-primary/80 backdrop-blur-sm rounded text-atlas-text-primary text-xs font-medium flex items-center gap-1">
                        <ListVideo className="w-3.5 h-3.5" />
                        {videoCount} videos
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                      <p className="text-sm text-white font-medium truncate">{expeditionName || fetchResult.title || "YouTube Video"}</p>
                      <p className="text-xs text-white/60 mt-0.5">Click "Create Expedition" to start learning</p>
                    </div>
                  </div>
                )}

                {/* Video list for playlists */}
                {fetchResult.isPlaylist && fetchResult.videos && fetchResult.videos.length > 1 && (
                  <div className="space-y-1 max-h-48 overflow-y-auto modal-scrollbar">
                    {fetchResult.videos.slice(0, 20).map((video, i) => (
                      <div key={video.youtube_id} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-atlas-bg-primary/50 transition-colors">
                        <span className="text-xs text-atlas-text-muted w-5 text-right font-mono">{i + 1}</span>
                        <img
                          src={video.thumbnail_url || `https://i.ytimg.com/vi/${video.youtube_id}/default.jpg`}
                          alt=""
                          className="w-16 h-9 rounded object-cover flex-shrink-0"
                        />
                        <span className="text-sm text-atlas-text-primary truncate flex-1">{video.title || `Video ${i + 1}`}</span>
                        {video.duration_seconds > 0 && (
                          <span className="text-xs text-atlas-text-muted flex-shrink-0">
                            {Math.floor(video.duration_seconds / 60)}:{String(video.duration_seconds % 60).padStart(2, '0')}
                          </span>
                        )}
                      </div>
                    ))}
                    {fetchResult.videos.length > 20 && (
                      <p className="text-xs text-atlas-text-muted text-center py-2">
                        +{fetchResult.videos.length - 20} more videos not shown
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-5 border-t border-atlas-border bg-atlas-bg-secondary flex-shrink-0">
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-atlas-text-secondary font-medium hover:text-atlas-text-primary hover:bg-atlas-bg-tertiary transition-all duration-200"
            >
              Cancel
            </button>
            {state === "preview" ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-atlas-gold text-atlas-bg-primary font-semibold hover:bg-atlas-gold-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <span>Create Expedition</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleFetch}
                disabled={!playlistUrl.trim() || state === 'loading'}
                className="px-6 py-2.5 rounded-xl bg-atlas-gold text-atlas-bg-primary font-semibold hover:bg-atlas-gold-hover disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-atlas-gold transition-all duration-200 flex items-center gap-2"
              >
                <span>Fetch Playlist</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
