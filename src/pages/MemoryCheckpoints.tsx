import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlarmClock, Calendar, Brain, Map, Clock, ChevronDown,
  Play, LayoutGrid, List, TrendingUp, Target, Zap,
  BookOpen
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";
import type { SrsCheckpoint } from "@/types/electron";

function CheckpointCard({ checkpoint, isUpcoming = false }: { checkpoint: SrsCheckpoint; isUpcoming?: boolean }) {
  const navigate = useNavigate();

  const getDifficultyStyles = (difficulty: SrsCheckpoint['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return "bg-atlas-success/10 text-atlas-success border-atlas-success/20";
      case 'medium':
        return "bg-atlas-warning/10 text-atlas-warning border-atlas-warning/20";
      case 'hard':
        return "bg-atlas-error/10 text-atlas-error border-atlas-error/20";
    }
  };

  return (
    <div className={cn(
      "checkpoint-card bg-atlas-bg-secondary border border-atlas-border rounded-xl p-5 cursor-pointer group transition-all",
      isUpcoming ? "opacity-75 hover:opacity-100 bg-atlas-bg-secondary/50" : "hover:border-atlas-gold/50"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-semibold text-lg text-atlas-text-primary truncate group-hover:text-atlas-gold transition-colors">
            {checkpoint.title}
          </h3>
          <p className="text-sm text-atlas-text-secondary mt-1 flex items-center gap-2">
            <Map className="w-4 h-4 text-atlas-text-muted" />
            {checkpoint.expeditionTitle}
          </p>
        </div>
        <span className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium border",
          getDifficultyStyles(checkpoint.difficulty)
        )}>
          {checkpoint.difficulty.charAt(0).toUpperCase() + checkpoint.difficulty.slice(1)}
        </span>
      </div>

      {isUpcoming && checkpoint.dueDate ? (
        <div className="flex items-center gap-3 mb-4 p-3 bg-atlas-bg-tertiary/50 rounded-lg">
          <Clock className="w-4 h-4 text-atlas-gold" />
          <div>
            <div className="text-sm font-medium text-atlas-text-primary">Due {checkpoint.dueDate}</div>
            <div className="text-xs text-atlas-text-muted">{checkpoint.accuracy}% accuracy over {checkpoint.sessionCount} session{checkpoint.sessionCount !== 1 ? 's' : ''}</div>
          </div>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-5">
            <div className="flex items-center justify-between text-sm">
              <span className="text-atlas-text-muted">Last reviewed</span>
              <span className="text-atlas-text-secondary">{checkpoint.lastReviewed}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-atlas-text-muted">Interval</span>
              <span className="text-atlas-text-secondary">{checkpoint.currentInterval} → {checkpoint.nextInterval}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-atlas-text-muted">Accuracy</span>
              <span className={cn(
                "font-medium",
                checkpoint.accuracy >= 80 ? "text-atlas-success" :
                  checkpoint.accuracy >= 50 ? "text-atlas-warning" : "text-atlas-error"
              )}>
                {checkpoint.accuracy}% ({checkpoint.correctCount}/{checkpoint.totalAttempts})
              </span>
            </div>
          </div>

          {/* Retention Strength */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-atlas-text-muted">Retention Strength</span>
              <span className={cn(
                "font-medium",
                checkpoint.retentionStrength >= 70 ? "text-atlas-gold" :
                  checkpoint.retentionStrength >= 40 ? "text-atlas-warning" : "text-atlas-error"
              )}>
                {checkpoint.retentionStrength}%
              </span>
            </div>
            <div className="h-2 bg-atlas-bg-tertiary rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-700",
                  checkpoint.retentionStrength >= 70
                    ? "bg-gradient-to-r from-atlas-gold to-atlas-gold-hover"
                    : checkpoint.retentionStrength >= 40
                      ? "bg-gradient-to-r from-atlas-warning to-yellow-500"
                      : "bg-gradient-to-r from-atlas-error to-red-400"
                )}
                style={{ width: `${checkpoint.retentionStrength}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => navigate(`/expedition/${checkpoint.expeditionId}`)}
            className="w-full flex items-center justify-center gap-2 bg-atlas-bg-tertiary hover:bg-atlas-gold hover:text-atlas-bg-primary border border-atlas-border hover:border-atlas-gold text-atlas-text-primary font-medium py-2.5 rounded-lg transition-all"
          >
            <Brain className="w-4 h-4" />
            Start Review
          </button>
        </>
      )}

      {isUpcoming && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-atlas-text-muted">Last review: {checkpoint.lastReviewed}</span>
          <span className={cn(
            "font-medium",
            checkpoint.retentionStrength > 80 ? "text-atlas-success" :
              checkpoint.retentionStrength > 60 ? "text-atlas-warning" : "text-atlas-text-muted"
          )}>
            {checkpoint.retentionStrength > 80 ? "Excellent retention" :
              checkpoint.retentionStrength > 60 ? "Strong retention" : "Needs attention"}
          </span>
        </div>
      )}
    </div>
  );
}

export default function MemoryCheckpoints() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('date-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [checkpoints, setCheckpoints] = useState<SrsCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCheckpoints();
  }, []);

  const loadCheckpoints = async () => {
    if (!window.atlased) return;
    try {
      setLoading(true);
      const data = await window.atlased.memoryCheckpoints.getAll();
      setCheckpoints(data);
    } catch (err) {
      console.error('Failed to load memory checkpoints:', err);
    } finally {
      setLoading(false);
    }
  };

  // Split into due vs upcoming
  const dueCheckpoints = checkpoints.filter(c => c.isDue);
  const upcomingCheckpoints = checkpoints.filter(c => !c.isDue);

  // Apply filters
  const applyFilter = (list: SrsCheckpoint[]) => {
    switch (filter) {
      case 'due': return list.filter(c => c.isDue);
      case 'easy': return list.filter(c => c.difficulty === 'easy');
      case 'medium': return list.filter(c => c.difficulty === 'medium');
      case 'hard': return list.filter(c => c.difficulty === 'hard');
      default: return list;
    }
  };

  // Apply sorting
  const applySort = (list: SrsCheckpoint[]) => {
    const sorted = [...list];
    switch (sort) {
      case 'date-asc':
        return sorted.sort((a, b) => new Date(a.nextReviewAt).getTime() - new Date(b.nextReviewAt).getTime());
      case 'date-desc':
        return sorted.sort((a, b) => new Date(b.nextReviewAt).getTime() - new Date(a.nextReviewAt).getTime());
      case 'difficulty':
        const order = { hard: 0, medium: 1, easy: 2 };
        return sorted.sort((a, b) => order[a.difficulty] - order[b.difficulty]);
      case 'retention':
        return sorted.sort((a, b) => a.retentionStrength - b.retentionStrength);
      case 'expedition':
        return sorted.sort((a, b) => a.expeditionTitle.localeCompare(b.expeditionTitle));
      default: return sorted;
    }
  };

  const filteredDue = applySort(applyFilter(dueCheckpoints));
  const filteredUpcoming = applySort(applyFilter(upcomingCheckpoints));

  // Stats
  const avgRetention = checkpoints.length > 0
    ? Math.round(checkpoints.reduce((sum, c) => sum + c.retentionStrength, 0) / checkpoints.length)
    : 0;

  const totalSessions = checkpoints.reduce((sum, c) => sum + c.sessionCount, 0);

  return (
    <AppLayout headerProps={{ showBack: true, backLabel: "Back", backTo: "/" }}>
      <main className="flex-1 overflow-auto">
        {/* Header Section */}
        <div className="px-8 pt-8 pb-6 border-b border-atlas-border">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display font-bold text-3xl text-atlas-text-primary mb-2">Memory Checkpoints</h1>
                <p className="text-atlas-text-secondary max-w-2xl text-base leading-relaxed">
                  Spaced repetition reviews are scheduled to maximize long-term retention.
                  Complete checkpoints when due to strengthen neural pathways and prevent forgetting.
                </p>
              </div>
              {/* Stats Summary */}
              <div className="flex gap-6">
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-atlas-gold">{dueCheckpoints.length}</div>
                  <div className="text-xs text-atlas-text-muted uppercase tracking-wider mt-1">Due Now</div>
                </div>
                <div className="w-px bg-atlas-border" />
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-atlas-text-secondary">{upcomingCheckpoints.length}</div>
                  <div className="text-xs text-atlas-text-muted uppercase tracking-wider mt-1">Upcoming</div>
                </div>
                <div className="w-px bg-atlas-border" />
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-atlas-success">{avgRetention}%</div>
                  <div className="text-xs text-atlas-text-muted uppercase tracking-wider mt-1">Avg Retention</div>
                </div>
                <div className="w-px bg-atlas-border" />
                <div className="text-center">
                  <div className="text-3xl font-display font-bold text-atlas-text-secondary">{totalSessions}</div>
                  <div className="text-xs text-atlas-text-muted uppercase tracking-wider mt-1">Reviews</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter & Controls Bar */}
        <div className="px-8 py-4 bg-atlas-bg-secondary/50 border-b border-atlas-border">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Filter Dropdown */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none bg-atlas-bg-tertiary border border-atlas-border rounded-lg px-4 py-2 pr-10 text-sm text-atlas-text-primary focus:outline-none focus:border-atlas-gold transition-colors cursor-pointer"
                >
                  <option value="all">All Checkpoints</option>
                  <option value="due">Due Now</option>
                  <option value="easy">Easy Difficulty</option>
                  <option value="medium">Medium Difficulty</option>
                  <option value="hard">Hard Difficulty</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-atlas-text-muted pointer-events-none" />
              </div>
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none bg-atlas-bg-tertiary border border-atlas-border rounded-lg px-4 py-2 pr-10 text-sm text-atlas-text-primary focus:outline-none focus:border-atlas-gold transition-colors cursor-pointer"
                >
                  <option value="date-asc">Due Date (Earliest)</option>
                  <option value="date-desc">Due Date (Latest)</option>
                  <option value="difficulty">Difficulty Level</option>
                  <option value="retention">Retention (Lowest)</option>
                  <option value="expedition">Expedition</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-atlas-text-muted pointer-events-none" />
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex bg-atlas-bg-tertiary rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === 'grid' ? "bg-atlas-bg-secondary text-atlas-gold" : "text-atlas-text-muted hover:text-atlas-text-primary"
                  )}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-2 rounded-md transition-colors",
                    viewMode === 'list' ? "bg-atlas-bg-secondary text-atlas-gold" : "text-atlas-text-muted hover:text-atlas-text-primary"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-8 py-8">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-atlas-gold border-t-transparent rounded-full mx-auto mb-4" />
                  <p className="text-atlas-text-muted">Loading checkpoints...</p>
                </div>
              </div>
            ) : checkpoints.length === 0 ? (
              /* Empty State */
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-2xl bg-atlas-bg-secondary border border-atlas-border flex items-center justify-center mb-6">
                  <Brain className="w-10 h-10 text-atlas-text-muted" />
                </div>
                <h2 className="font-display font-bold text-2xl text-atlas-text-primary mb-3">No Memory Checkpoints Yet</h2>
                <p className="text-atlas-text-secondary max-w-md mb-8 leading-relaxed">
                  Memory checkpoints are created automatically when you take quizzes during your learning sessions.
                  Start watching videos and complete the mid-stream quizzes to begin building your review schedule.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-semibold px-6 py-3 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <BookOpen className="w-5 h-5" />
                    Start Learning
                  </button>
                </div>

                {/* How it works */}
                <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl">
                  <div className="bg-atlas-bg-secondary border border-atlas-border rounded-xl p-5 text-center">
                    <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 flex items-center justify-center mx-auto mb-3">
                      <Play className="w-5 h-5 text-atlas-gold" />
                    </div>
                    <h3 className="font-medium text-atlas-text-primary text-sm mb-1">1. Watch & Learn</h3>
                    <p className="text-xs text-atlas-text-muted">Watch videos and generate field guides</p>
                  </div>
                  <div className="bg-atlas-bg-secondary border border-atlas-border rounded-xl p-5 text-center">
                    <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 flex items-center justify-center mx-auto mb-3">
                      <Target className="w-5 h-5 text-atlas-gold" />
                    </div>
                    <h3 className="font-medium text-atlas-text-primary text-sm mb-1">2. Take Quizzes</h3>
                    <p className="text-xs text-atlas-text-muted">Answer mid-stream quiz questions</p>
                  </div>
                  <div className="bg-atlas-bg-secondary border border-atlas-border rounded-xl p-5 text-center">
                    <div className="w-10 h-10 rounded-lg bg-atlas-gold/10 flex items-center justify-center mx-auto mb-3">
                      <TrendingUp className="w-5 h-5 text-atlas-gold" />
                    </div>
                    <h3 className="font-medium text-atlas-text-primary text-sm mb-1">3. Review & Retain</h3>
                    <p className="text-xs text-atlas-text-muted">SRS schedules optimal review times</p>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Due Today Section */}
                {filteredDue.length > 0 && (
                  <section className="mb-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-atlas-gold/10 flex items-center justify-center">
                        <AlarmClock className="w-5 h-5 text-atlas-gold" />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-xl text-atlas-text-primary">Due Now</h2>
                        <p className="text-sm text-atlas-text-muted">Complete these checkpoints to maintain your learning streak</p>
                      </div>
                      {filteredDue.length > 1 && (
                        <div className="ml-auto">
                          <button
                            onClick={() => {
                              if (filteredDue[0]) navigate(`/expedition/${filteredDue[0].expeditionId}`);
                            }}
                            className="flex items-center gap-2 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-semibold px-5 py-2.5 rounded-lg transition-all hover:scale-[1.02] active:scale-[0.98]"
                          >
                            <Play className="w-4 h-4" />
                            Start Review ({filteredDue.length})
                          </button>
                        </div>
                      )}
                    </div>

                    <div className={cn(
                      viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                        : "flex flex-col gap-3"
                    )}>
                      {filteredDue.map((checkpoint) => (
                        <CheckpointCard key={checkpoint.id} checkpoint={checkpoint} />
                      ))}
                    </div>
                  </section>
                )}

                {/* Upcoming Section */}
                {filteredUpcoming.length > 0 && (
                  <section>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-atlas-bg-tertiary flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-atlas-text-secondary" />
                      </div>
                      <div>
                        <h2 className="font-display font-bold text-xl text-atlas-text-primary">Upcoming</h2>
                        <p className="text-sm text-atlas-text-muted">Scheduled reviews based on your SRS intervals</p>
                      </div>
                    </div>

                    <div className={cn(
                      viewMode === 'grid'
                        ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                        : "flex flex-col gap-3"
                    )}>
                      {filteredUpcoming.map((checkpoint) => (
                        <CheckpointCard key={checkpoint.id} checkpoint={checkpoint} isUpcoming />
                      ))}
                    </div>
                  </section>
                )}

                {/* All filtered out */}
                {filteredDue.length === 0 && filteredUpcoming.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Zap className="w-12 h-12 text-atlas-success mb-4" />
                    <h2 className="font-display font-bold text-xl text-atlas-text-primary mb-2">All Clear!</h2>
                    <p className="text-atlas-text-muted">No checkpoints match the current filter. Try changing your filter settings.</p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </AppLayout>
  );
}
