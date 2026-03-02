import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Settings, Play, BrainCircuit, Loader2,
  BookOpen, Compass, StickyNote, Map as MapIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbWaypoint, DbFieldGuide, DbBookmark } from "@/types/electron";
import { QuizModal, type QuizQuestion, type QuizResult } from "@/components/modals/QuizModal";
import { FieldGuidePanel } from "@/components/video-player/FieldGuidePanel";
import { CompassAIChat } from "@/components/video-player/CompassAIChat";
import { NotesTab } from "@/components/video-player/NotesTab";
import { ChartTab } from "@/components/video-player/ChartTab";
import { VideoInfoBar } from "@/components/video-player/VideoInfoBar";
import { WindowControls } from "@/components/WindowControls";

type TabType = 'field-guide' | 'notes' | 'chart' | 'compass-ai';

interface ChatMessage {
  type: 'ai' | 'user';
  content: string;
  id: string;
}

// Helper to generate unique message IDs
const generateMessageId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface FieldGuideData {
  executive_summary: string;
  key_concepts: Array<{ title: string; explanation: string; tags?: string[] }>;
  code_examples: Array<{ language: string; code: string; explanation: string }>;
  key_takeaways: string[];
  markdown_content?: string;
}

export default function VideoPlayer() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<TabType>('field-guide');
  const [isLoading, setIsLoading] = useState(true);
  const [waypoint, setWaypoint] = useState<DbWaypoint | null>(null);
  const [fieldGuide, setFieldGuide] = useState<FieldGuideData | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSendingChat, setIsSendingChat] = useState(false);
  const [expeditionTitle, setExpeditionTitle] = useState("Expedition");
  const [videoDuration, setVideoDuration] = useState<number | null>(null);
  const [videoState, setVideoState] = useState<number>(-1); // -1=unstarted, 1=playing, 2=paused, 0=ended
  const [splitPercent, setSplitPercent] = useState(60); // video gets 60% default
  const [isDragging, setIsDragging] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [isQuizOpen, setIsQuizOpen] = useState(false);
  const [currentQuizQuestions, setCurrentQuizQuestions] = useState<QuizQuestion[]>([]);
  const [quizReviewMode, setQuizReviewMode] = useState(false);
  const [quizReviewAnswer, setQuizReviewAnswer] = useState<number | undefined>(undefined);
  const [quizResults, setQuizResults] = useState<Map<number, QuizResult>>(new Map());
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [prevWaypointId, setPrevWaypointId] = useState<string | null>(null);
  const [nextWaypointId, setNextWaypointId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaveStatus, setNoteSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [allWaypoints, setAllWaypoints] = useState<DbWaypoint[]>([]);
  const [autoQuizEnabled, setAutoQuizEnabled] = useState(true);
  const [autoFieldGuideEnabled, setAutoFieldGuideEnabled] = useState(true);
  const [quizToast, setQuizToast] = useState<string | null>(null);
  const [bookmarks, setBookmarks] = useState<DbBookmark[]>([]);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const autoFieldGuideTriggeredRef = useRef(false);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const timePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset all state when navigating to a different waypoint (prev/next)
  useEffect(() => {
    setWaypoint(null);
    setFieldGuide(null);
    setIsGeneratingGuide(false);
    setChatInput("");
    setChatMessages([]);
    setIsSendingChat(false);
    setExpeditionTitle("Expedition");
    setVideoDuration(null);
    setVideoState(-1);
    setQuizQuestions([]);
    setIsQuizOpen(false);
    setCurrentQuizQuestions([]);
    setQuizReviewMode(false);
    setQuizReviewAnswer(undefined);
    setQuizResults(new Map());
    setCurrentVideoTime(0);
    setPrevWaypointId(null);
    setNextWaypointId(null);
    setNoteContent("");
    setNoteSaveStatus('idle');
    setAllWaypoints([]);
    setAutoQuizEnabled(true); // Reset to default
    setQuizToast(null); // Clear any active toast
    setBookmarks([]); // Clear bookmarks
    setIsLoading(true);
  }, [id]);

  // Drag handlers for resizable split
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientX - rect.left) / rect.width) * 100;
      // Clamp between 30% and 75%
      setSplitPercent(Math.min(75, Math.max(30, percent)));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    // Prevent text selection while dragging
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging]);

  // Load waypoint data
  const loadWaypointData = useCallback(async () => {
    if (!id) return;

    try {
      if (window.atlased) {
        // Get waypoint
        const wp = await window.atlased.waypoints.get(id);
        setWaypoint(wp);

        if (wp) {
          // Get expedition title
          const exp = await window.atlased.expeditions.get(wp.expedition_id);
          if (exp) setExpeditionTitle(exp.title);

          // Load sibling waypoints for prev/next navigation + Chart tab
          const allWps = await window.atlased.waypoints.getAll(wp.expedition_id);
          const sorted = allWps.sort((a: DbWaypoint, b: DbWaypoint) => a.order_index - b.order_index);
          setAllWaypoints(sorted);
          const currentIdx = sorted.findIndex((w: DbWaypoint) => w.id === wp.id);
          setPrevWaypointId(currentIdx > 0 ? sorted[currentIdx - 1].id : null);
          setNextWaypointId(currentIdx < sorted.length - 1 ? sorted[currentIdx + 1].id : null);

          // Load notes
          const note = await window.atlased.notes.get(wp.id);
          if (note) setNoteContent(note.content);

          // Load bookmarks
          const bmarks = await window.atlased.bookmarks.getAll(wp.id);
          if (bmarks) setBookmarks(bmarks);

          // Get existing field guide
          const fg = await window.atlased.fieldGuides.get(id);
          if (fg && fg.executive_summary) {
            try {
              // Parse field guide sections
              const keyConcepts = fg.key_takeaways ? JSON.parse(fg.key_takeaways) : [];
              let codeExamples: FieldGuideData['code_examples'] = [];
              let quizzes: QuizQuestion[] = [];

              // quiz_data_json may contain code_examples OR quiz data
              if (fg.quiz_data_json) {
                try {
                  const parsed = JSON.parse(fg.quiz_data_json);
                  if (parsed.quizzes) {
                    // New format: { code_examples: [...], quizzes: [...] }
                    codeExamples = parsed.code_examples || [];
                    quizzes = parsed.quizzes || [];
                  } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) {
                    // Quiz array directly
                    quizzes = parsed;
                  } else if (Array.isArray(parsed)) {
                    // Old format: code_examples array
                    codeExamples = parsed;
                  }
                } catch { /* ignore */ }
              }

              setFieldGuide({
                executive_summary: fg.executive_summary,
                key_concepts: keyConcepts,
                code_examples: codeExamples,
                key_takeaways: [],
                markdown_content: fg.markdown_content || undefined,
              });

              if (quizzes.length > 0) {
                setQuizQuestions(quizzes);
                // Load existing quiz attempts to pre-populate quizResults
                // This prevents already-completed quizzes from re-triggering
                try {
                  const attempts = await window.atlased.quizAttempts.getAll(wp.id);
                  if (attempts && attempts.length > 0) {
                    const loadedResults = new Map<number, QuizResult>();
                    // Group attempts by question_index
                    attempts.forEach((a: any) => {
                      const q = quizzes[a.question_index];
                      if (q && q.timestamp_seconds) {
                        loadedResults.set(q.timestamp_seconds, {
                          selectedIndex: a.is_correct ? q.correct_index : -1, // We don't store exact selection, approximate
                          isCorrect: !!a.is_correct,
                        });
                      }
                    });
                    if (loadedResults.size > 0) {
                      setQuizResults(loadedResults);
                    }
                  }
                } catch { /* non-critical */ }
              }
            } catch (e) {
              console.error("Error parsing field guide:", e);
              setFieldGuide(null);
            }
          }
        }
      }
    } catch (error) {
      console.error("Error loading waypoint:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  // Load settings: auto_quiz, auto_field_guide, playback_speed
  useEffect(() => {
    async function loadSettings() {
      try {
        if (window.atlased) {
          const [autoQuiz, autoFG, speed] = await Promise.all([
            window.atlased.settings.get('auto_quiz'),
            window.atlased.settings.get('auto_field_guide'),
            window.atlased.settings.get('playback_speed'),
          ]);
          setAutoQuizEnabled(autoQuiz !== false); // default to true
          setAutoFieldGuideEnabled(autoFG !== false); // default to true
          if (speed && typeof speed === 'number') {
            setPlaybackSpeed(speed);
          }
        }
      } catch { /* use default */ }
    }
    loadSettings();
  }, []);

  // Auto-generate field guide when waypoint loads without one
  useEffect(() => {
    if (
      autoFieldGuideEnabled &&
      waypoint &&
      !fieldGuide &&
      !isGeneratingGuide &&
      !isLoading &&
      !autoFieldGuideTriggeredRef.current
    ) {
      autoFieldGuideTriggeredRef.current = true;
      console.log('[VideoPlayer] Auto-generating field guide for', waypoint.title);
      handleGenerateFieldGuide();
    }
  }, [autoFieldGuideEnabled, waypoint, fieldGuide, isGeneratingGuide, isLoading]);

  // Reset auto-trigger ref when waypoint changes
  useEffect(() => {
    autoFieldGuideTriggeredRef.current = false;
  }, [id]);

  useEffect(() => {
    loadWaypointData();
    // Initialize Compass AI greeting
    setChatMessages([{
      id: generateMessageId(),
      type: 'ai',
      content: "Hello! I'm Compass, your AI learning assistant. I can answer questions about this video, explain concepts in different ways, or provide additional examples. What would you like to know?",
    }]);

    // Listen for YouTube IFrame API messages to get duration and current time
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (data.event === 'infoDelivery' && data.info?.duration) {
          setVideoDuration(Math.round(data.info.duration));
        }
        // Track current playback time for mid-stream quizzes
        if (data.event === 'infoDelivery' && data.info?.currentTime !== undefined) {
          setCurrentVideoTime(data.info.currentTime);
        }
        // Track player state: -1=unstarted, 0=ended, 1=playing, 2=paused, 3=buffering
        if (data.event === 'onStateChange' && data.info !== undefined) {
          setVideoState(data.info);
        }
        if (data.event === 'infoDelivery' && data.info?.playerState !== undefined) {
          setVideoState(data.info.playerState);
        }
      } catch { /* ignore parse errors */ }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [loadWaypointData]);

  // Active time polling — YouTube infoDelivery is unreliable for currentTime
  // Poll every 500ms while video is playing to ensure quiz timestamps are caught
  useEffect(() => {
    if (videoState === 1 && quizQuestions.length > 0 && autoQuizEnabled) {
      // Start polling
      timePollingRef.current = setInterval(() => {
        if (playerRef.current?.contentWindow) {
          playerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'getVideoData', args: [] }),
            'https://www.youtube.com'
          );
          // Also request current time directly
          playerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'listening', id: 'atlased-player' }),
            'https://www.youtube.com'
          );
        }
      }, 500);
    } else {
      // Stop polling when not playing
      if (timePollingRef.current) {
        clearInterval(timePollingRef.current);
        timePollingRef.current = null;
      }
    }
    return () => {
      if (timePollingRef.current) {
        clearInterval(timePollingRef.current);
        timePollingRef.current = null;
      }
    };
  }, [videoState, quizQuestions.length, autoQuizEnabled]);

  // Save video position periodically (every 5s) and on unmount
  useEffect(() => {
    const savePosition = () => {
      if (waypoint && currentVideoTime > 0 && window.atlased) {
        window.atlased.waypoints.updateProgress(waypoint.id, Math.floor(currentVideoTime));
      }
    };
    const interval = setInterval(savePosition, 5000);
    return () => {
      clearInterval(interval);
      // Save on unmount too
      savePosition();
    };
  }, [waypoint, currentVideoTime]);

  // Generate field guide
  const handleGenerateFieldGuide = async () => {
    if (!waypoint || !waypoint.youtube_id) return;

    setIsGeneratingGuide(true);
    try {
      if (window.atlased) {
        // First, try to get transcript
        let transcript = waypoint.transcript_text;

        if (!transcript) {
          const transcriptResult = await window.atlased.ai.fetchTranscript(waypoint.youtube_id);
          if (transcriptResult.success && transcriptResult.transcript) {
            transcript = transcriptResult.transcript;
            // Save transcript to DB
            await window.atlased.waypoints.updateTranscript(waypoint.id, transcript);
            // Update local state so Compass AI works immediately
            setWaypoint(prev => prev ? { ...prev, transcript_text: transcript! } : prev);
          } else {
            throw new Error(transcriptResult.error || "Failed to fetch transcript");
          }
        }

        // Generate field guide
        const result = await window.atlased.ai.generateFieldGuide(transcript, waypoint.title);

        if (result.success && result.data) {
          const fgData: FieldGuideData = {
            executive_summary: result.data.executive_summary || '',
            key_concepts: result.data.key_concepts || [],
            code_examples: result.data.code_examples || [],
            key_takeaways: result.data.key_takeaways || [],
            markdown_content: result.data.markdown_content,
          };
          setFieldGuide(fgData);

          // Generate timed quizzes via separate API call
          // Falls back to field guide's embedded quizzes if the dedicated call fails
          let quizzes: QuizQuestion[] = [];
          try {
            const quizResult = await window.atlased.ai.generateQuizzes(transcript!, waypoint.title);
            if (quizResult.success && quizResult.data?.quizzes) {
              quizzes = quizResult.data.quizzes.map((q: any) => ({
                question: q.question,
                options: q.options,
                correct_index: q.correct_index,
                explanation: q.explanation,
                timestamp_seconds: q.timestamp_seconds || undefined,
              }));
            }
          } catch (quizErr) {
            console.warn('Timed quiz generation failed, using field guide quizzes:', quizErr);
          }

          // Fallback: use quizzes from the field guide response if dedicated generation failed
          if (quizzes.length === 0 && result.data.quizzes && result.data.quizzes.length > 0) {
            console.log('[Quiz] Using quizzes from field guide response as fallback');
            quizzes = result.data.quizzes.map((q: any) => ({
              question: q.question,
              options: q.options,
              correct_index: q.correct_index,
              explanation: q.explanation,
              timestamp_seconds: undefined, // field guide quizzes don't have timestamps
            }));
          }

          if (quizzes.length > 0) {
            setQuizQuestions(quizzes);
          }

          // Save to database — update if exists, create if new
          const existingFg = await window.atlased.fieldGuides.get(waypoint.id);
          const quizDataPayload = JSON.stringify({
            code_examples: fgData.code_examples,
            quizzes: quizzes,
          });
          const fgPayload = {
            waypoint_id: waypoint.id,
            executive_summary: fgData.executive_summary,
            markdown_content: fgData.markdown_content || null,
            key_takeaways: JSON.stringify(fgData.key_concepts),
            quiz_data_json: quizDataPayload,
          };
          if (existingFg) {
            await window.atlased.fieldGuides.update(waypoint.id, fgPayload);
          } else {
            await window.atlased.fieldGuides.create(fgPayload);
          }

          // Persist tags from key_concepts → tags + waypoint_tags tables
          // This powers knowledge graph connections between waypoints
          try {
            const allTags = new Set<string>();
            for (const concept of fgData.key_concepts) {
              if (concept.tags) {
                concept.tags.forEach(t => allTags.add(t.toLowerCase().trim()));
              }
            }
            for (const tagName of allTags) {
              if (!tagName) continue;
              const tag = await window.atlased.tags.create(tagName);
              if (tag?.id) {
                await window.atlased.tags.addToWaypoint(waypoint.id, tag.id);
              }
            }
          } catch (tagErr) {
            console.warn('Tag persistence failed (non-critical):', tagErr);
          }
        } else {
          throw new Error(result.error || "Failed to generate field guide");
        }
      }
    } catch (error) {
      console.error("Error generating field guide:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.toLowerCase().includes('rate limit') || errMsg.toLowerCase().includes('quota')) {
        alert("Rate limit reached. The free Gemini API tier allows 20 requests per minute. Please wait about a minute and try again.");
      } else {
        alert(`Failed to generate field guide: ${errMsg}`);
      }
    } finally {
      setIsGeneratingGuide(false);
    }
  };

  // Send chat message
  const handleSendChat = async () => {
    if (!chatInput.trim() || !waypoint) return;

    const userMessage = chatInput.trim();
    setChatInput("");
    setChatMessages(prev => [...prev, { id: generateMessageId(), type: 'user', content: userMessage }]);
    setIsSendingChat(true);

    try {
      if (window.atlased && waypoint.transcript_text) {
        // Only include actual conversation messages, not the initial greeting
        const previousMessages = chatMessages
          .slice(1) // Skip the greeting message (first AI message)
          .map(m => ({
            role: m.type === 'user' ? 'user' : 'assistant',
            content: m.content,
          }));

        const result = await window.atlased.ai.chat(
          userMessage,
          waypoint.transcript_text,
          waypoint.title,
          previousMessages
        );

        if (result.success && result.response) {
          setChatMessages(prev => [...prev, { id: generateMessageId(), type: 'ai', content: result.response! }]);
        } else {
          console.error("Chat API error:", result.error);
          const errorText = result.error?.toLowerCase() || '';
          const isRateLimit = errorText.includes('rate limit') || errorText.includes('quota');
          setChatMessages(prev => [...prev, {
            id: generateMessageId(),
            type: 'ai',
            content: isRateLimit
              ? "⏳ Rate limit reached — the free Gemini tier allows 20 requests/minute. Please wait about a minute and try again."
              : (result.error || "I'm sorry, I couldn't process your question. Please try again or check if the API key is configured in Settings.")
          }]);
        }
      } else {
        setChatMessages(prev => [...prev, {
          id: generateMessageId(),
          type: 'ai',
          content: "I need a transcript to answer questions about this video. Please generate the Field Guide first to enable the chat feature."
        }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, {
        id: generateMessageId(),
        type: 'ai',
        content: "An error occurred. Please try again."
      }]);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Mark waypoint as complete
  const handleMarkComplete = async () => {
    if (!waypoint) return;
    try {
      if (window.atlased) {
        await window.atlased.waypoints.markCharted(waypoint.id);
        // Reload to update state
        loadWaypointData();
      }
    } catch (error) {
      console.error("Error marking complete:", error);
    }
  };

  // Auto-save notes with debounce
  const handleNoteChange = (value: string) => {
    setNoteContent(value);
    setNoteSaveStatus('idle');
    if (noteTimerRef.current) clearTimeout(noteTimerRef.current);
    noteTimerRef.current = setTimeout(async () => {
      if (!waypoint || !window.atlased) return;
      setNoteSaveStatus('saving');
      try {
        await window.atlased.notes.upsert(waypoint.id, value);
        setNoteSaveStatus('saved');
        setTimeout(() => setNoteSaveStatus('idle'), 2000);
      } catch (e) {
        console.error('Failed to save note:', e);
        setNoteSaveStatus('idle');
      }
    }, 1000);
  };

  // Bookmark handlers
  const handleAddBookmark = async () => {
    if (!waypoint || !window.atlased || !currentVideoTime) return;
    try {
      const bookmark = await window.atlased.bookmarks.create({
        waypoint_id: waypoint.id,
        timestamp_seconds: Math.floor(currentVideoTime),
      });
      setBookmarks(prev => [...prev, bookmark].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
    } catch (e) {
      console.error('Failed to create bookmark:', e);
    }
  };

  const handleDeleteBookmark = async (bookmarkId: string) => {
    if (!window.atlased) return;
    try {
      await window.atlased.bookmarks.delete(bookmarkId);
      setBookmarks(prev => prev.filter(b => b.id !== bookmarkId));
    } catch (e) {
      console.error('Failed to delete bookmark:', e);
    }
  };

  const handleUpdateBookmark = async (bookmarkId: string, data: { label?: string; color?: string }) => {
    if (!window.atlased) return;
    try {
      await window.atlased.bookmarks.update(bookmarkId, data);
      setBookmarks(prev => prev.map(b => b.id === bookmarkId ? { ...b, ...data } : b));
    } catch (e) {
      console.error('Failed to update bookmark:', e);
    }
  };

  // Mid-stream quiz: pause video when reaching quiz timestamps
  useEffect(() => {
    if (quizQuestions.length === 0 || videoState !== 1 || !autoQuizEnabled) return;

    for (const q of quizQuestions) {
      if (q.timestamp_seconds && !quizResults.has(q.timestamp_seconds)) {
        // Trigger quiz if we've passed the timestamp (forward-only, within 2s window)
        if (currentVideoTime >= q.timestamp_seconds && currentVideoTime < q.timestamp_seconds + 2) {
          // Pause the video
          if (playerRef.current?.contentWindow) {
            playerRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
              'https://www.youtube.com'
            );
          }
          // Mark this timestamp as triggered (will be updated with actual result when answered)
          setQuizResults(prev => {
            const next = new Map(prev);
            // Only set a placeholder if not already answered
            if (!next.has(q.timestamp_seconds!)) {
              // We'll use -1 as placeholder until actually answered
              // This entry gets overwritten by handleQuestionAnswered
            }
            return next;
          });
          // Show toast notification before opening quiz
          setQuizToast("Comprehension check \u2014 let's see what you've learned!");
          // Open quiz after brief delay so the toast is visible
          setTimeout(() => {
            setQuizToast(null);
            setCurrentQuizQuestions([q]);
            setIsQuizOpen(true);
          }, 1500);
          break;
        }
      }
    }
  }, [currentVideoTime, quizQuestions, videoState, quizResults, autoQuizEnabled]);

  // Called when a single question is answered in the quiz modal
  const handleQuestionAnswered = (question: QuizQuestion, selectedIndex: number, isCorrect: boolean) => {
    if (question.timestamp_seconds) {
      setQuizResults(prev => {
        const next = new Map(prev);
        next.set(question.timestamp_seconds!, { selectedIndex, isCorrect });
        return next;
      });
    }
  };

  // Handle quiz completion — only called when user actually finishes/answers
  const handleQuizComplete = async (score: number, total: number) => {
    // Mark the quiz timestamps as completed (for quizzes without per-question tracking)
    for (const q of currentQuizQuestions) {
      if (q.timestamp_seconds && !quizResults.has(q.timestamp_seconds)) {
        setQuizResults(prev => {
          const next = new Map(prev);
          next.set(q.timestamp_seconds!, { selectedIndex: -1, isCorrect: false });
          return next;
        });
      }
    }

    // Record quiz attempt in DB
    if (window.atlased && waypoint) {
      try {
        for (let i = 0; i < total; i++) {
          await window.atlased.quizAttempts.create({
            waypoint_id: waypoint.id,
            question_index: i,
            is_correct: i < score ? 1 : 0,
          } as any);
        }
      } catch (e) {
        console.warn('Failed to record quiz attempt:', e);
      }
    }
  };

  // Apply playback speed to iframe whenever speed or video state changes
  useEffect(() => {
    if (videoState === 1 && playerRef.current?.contentWindow && playbackSpeed !== 1) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [playbackSpeed] }),
        'https://www.youtube.com'
      );
    }
  }, [videoState, playbackSpeed]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-atlas-bg-primary text-atlas-text-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-atlas-gold animate-spin" />
          <p className="text-atlas-text-secondary">Loading waypoint...</p>
        </div>
      </div>
    );
  }

  if (!waypoint) {
    return (
      <div className="min-h-screen bg-atlas-bg-primary text-atlas-text-primary flex flex-col items-center justify-center">
        <h2 className="text-xl font-display mb-2">Waypoint Not Found</h2>
        <p className="text-atlas-text-secondary mb-4">This waypoint may have been deleted.</p>
        <button onClick={() => navigate(-1)} className="text-atlas-gold hover:underline">Go Back</button>
      </div>
    );
  }

  // In production (file:// protocol), omit origin param — YouTube rejects file:// origins
  // In dev mode (http://), include it for proper JS API communication
  const isFileProtocol = window.location.protocol === 'file:';
  const originParam = isFileProtocol ? '' : `&origin=${encodeURIComponent(window.location.origin)}`;
  const startParam = waypoint.last_watched_pos ? `&start=${Math.floor(waypoint.last_watched_pos)}` : '';
  const youtubeEmbedUrl = `https://www.youtube.com/embed/${waypoint.youtube_id}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3${originParam}${startParam}`;



  // Initialize YouTube IFrame API communication when iframe loads
  const handleIframeLoad = () => {
    // Send 'listening' handshake - YouTube won't send state events without this
    const sendListening = () => {
      if (playerRef.current?.contentWindow) {
        playerRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'listening', id: 'atlased-player' }),
          'https://www.youtube.com'
        );
      }
    };
    // Send immediately and retry a few times (iframe JS may not be ready yet)
    sendListening();
    setTimeout(sendListening, 500);
    setTimeout(sendListening, 1500);
    setTimeout(sendListening, 3000);

    // Apply playback speed after iframe initializes
    if (playbackSpeed !== 1) {
      setTimeout(() => {
        if (playerRef.current?.contentWindow) {
          playerRef.current.contentWindow.postMessage(
            JSON.stringify({ event: 'command', func: 'setPlaybackRate', args: [playbackSpeed] }),
            'https://www.youtube.com'
          );
        }
      }, 2000);
    }
  };

  // Resume playback by sending a command to the iframe
  const handleResumePlayback = () => {
    if (playerRef.current?.contentWindow) {
      playerRef.current.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: 'playVideo', args: [] }),
        'https://www.youtube.com'
      );
    }
  };

  // Open quiz manually (e.g., from field guide)
  const handleOpenQuiz = () => {
    if (quizQuestions.length > 0) {
      setCurrentQuizQuestions(quizQuestions);
      setIsQuizOpen(true);
    }
  };

  return (
    <div className="h-screen bg-atlas-bg-primary text-atlas-text-primary flex flex-col overflow-hidden">
      {/* Title Bar */}
      <div className="h-10 bg-atlas-bg-secondary border-b border-atlas-border flex items-center justify-between pl-4 pr-0 select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties} data-window-drag>
        <div className="flex items-center gap-4" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => navigate(`/expedition/${waypoint.expedition_id}`)}
            className="flex items-center gap-2 text-atlas-text-secondary hover:text-atlas-gold transition-colors group"
          >
            <ArrowLeft className="w-[18px] h-[18px] group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-sm font-medium">Expedition</span>
          </button>
          <div className="w-px h-4 bg-atlas-border" />
          <span className="text-sm text-atlas-text-muted">{expeditionTitle}</span>
        </div>

        <div className="flex items-center gap-3" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 text-atlas-text-secondary hover:text-atlas-gold transition-colors"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>

          {/* Divider before window controls */}
          <div className="w-px h-4 bg-atlas-border" />

          {/* Window Controls */}
          <WindowControls />
        </div>
      </div>

      {/* Main Content — Resizable Split */}
      <div ref={containerRef} className="flex-1 flex overflow-hidden">
        {/* LEFT: Video Player + Controls */}
        <div
          className="flex flex-col bg-atlas-bg-primary overflow-hidden"
          style={{ width: `${splitPercent}%` }}
        >
          {/* Video Container */}
          <div className="relative bg-black flex-1 min-h-0">
            <iframe
              ref={playerRef}
              src={youtubeEmbedUrl}
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleIframeLoad}
            />
            {/* Overlay to prevent iframe from stealing mouse events during drag */}
            {isDragging && <div className="absolute inset-0 z-10" />}
            {/* Overlay to hide recommendations when paused/ended */}
            {(videoState === 2 || videoState === 0) && (
              <div
                className="absolute inset-0 z-10 flex items-center justify-center cursor-pointer"
                onClick={handleResumePlayback}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleResumePlayback();
                  }
                }}
                role="button"
                tabIndex={0}
                aria-label={videoState === 0 ? "Replay video" : "Resume video"}
              >
                {/* Semi-transparent bottom overlay to cover recommendations */}
                <div className="absolute bottom-0 left-0 right-0 h-[30%] bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
                {/* Play button */}
                <button
                  className="relative z-20 w-16 h-16 rounded-full bg-atlas-gold/90 hover:bg-atlas-gold flex items-center justify-center transition-all hover:scale-110 shadow-lg shadow-black/30"
                >
                  <Play className="w-7 h-7 text-atlas-bg-primary ml-1" fill="currentColor" />
                </button>
                {videoState === 0 && (
                  <span className="absolute bottom-6 text-sm text-atlas-text-secondary font-medium">
                    Video ended — click to replay
                  </span>
                )}
              </div>
            )}
            {/* Quiz Toast Notification */}
            {quizToast && (
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="bg-atlas-bg-secondary/95 backdrop-blur-sm border border-atlas-gold/30 rounded-2xl px-8 py-6 flex items-center gap-4 shadow-2xl shadow-atlas-gold/10 animate-fade-in">
                  <div className="w-12 h-12 rounded-xl bg-atlas-gold/10 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-atlas-gold animate-pulse" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-atlas-text-primary text-lg">Quiz Time!</p>
                    <p className="font-body text-sm text-atlas-text-secondary">{quizToast}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <VideoInfoBar
            waypoint={waypoint}
            videoDuration={videoDuration}
            currentVideoTime={currentVideoTime}
            quizQuestions={quizQuestions}
            quizResults={quizResults}
            autoQuizEnabled={autoQuizEnabled}
            prevWaypointId={prevWaypointId}
            nextWaypointId={nextWaypointId}
            bookmarks={bookmarks}
            onMarkComplete={handleMarkComplete}
            onAddBookmark={handleAddBookmark}
            onDeleteBookmark={handleDeleteBookmark}
            onUpdateBookmark={handleUpdateBookmark}
            onQuizMarkerClick={(q) => {
              const result = q.timestamp_seconds ? quizResults.get(q.timestamp_seconds) : undefined;
              setCurrentQuizQuestions([q]);
              setQuizReviewMode(!!result);
              setQuizReviewAnswer(result?.selectedIndex);
              setIsQuizOpen(true);
            }}
            onSeekTo={(seconds) => {
              if (playerRef.current?.contentWindow) {
                playerRef.current.contentWindow.postMessage(
                  JSON.stringify({ event: 'command', func: 'seekTo', args: [seconds, true] }),
                  'https://www.youtube.com'
                );
              }
            }}
          />
        </div>

        {/* Resize Handle */}
        <div
          onMouseDown={handleMouseDown}
          className={cn(
            "w-1 flex-shrink-0 bg-atlas-border hover:bg-atlas-gold/50 cursor-col-resize transition-colors relative group",
            isDragging && "bg-atlas-gold/50"
          )}
        >
          <div className={cn(
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
            isDragging && "opacity-100"
          )}>
            <div className="w-0.5 h-4 bg-atlas-gold/60 rounded-full" />
          </div>
        </div>

        {/* RIGHT: Tabs */}
        <div
          className="bg-atlas-bg-primary flex flex-col overflow-hidden"
          style={{ width: `${100 - splitPercent}%` }}
        >
          {/* Tab Headers — 4 icon tabs */}
          <div className="flex border-b border-atlas-border bg-atlas-bg-secondary">
            {([
              { id: 'field-guide' as TabType, icon: BookOpen, label: 'Field Guide' },
              { id: 'notes' as TabType, icon: StickyNote, label: 'Notes' },
              { id: 'chart' as TabType, icon: MapIcon, label: 'Chart' },
              { id: 'compass-ai' as TabType, icon: Compass, label: 'Compass AI' },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                title={tab.label}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-1 py-3 px-2 border-b-2 transition-all duration-200",
                  activeTab === tab.id
                    ? "border-atlas-gold text-atlas-gold"
                    : "border-transparent text-atlas-text-muted hover:text-atlas-text-secondary"
                )}
              >
                <tab.icon className="w-[18px] h-[18px]" />
                <span className="text-[10px] font-medium tracking-wide uppercase">{tab.label}</span>
              </button>
            ))}
          </div>


          {activeTab === 'field-guide' && (
            <FieldGuidePanel
              fieldGuide={fieldGuide}
              isGenerating={isGeneratingGuide}
              quizQuestions={quizQuestions}
              onGenerate={handleGenerateFieldGuide}
              onOpenQuiz={handleOpenQuiz}
              showQuizButton={autoQuizEnabled}
            />
          )}

          {activeTab === 'compass-ai' && (
            <CompassAIChat
              messages={chatMessages}
              isSending={isSendingChat}
              chatInput={chatInput}
              hasTranscript={!!waypoint.transcript_text}
              onInputChange={setChatInput}
              onSend={handleSendChat}
            />
          )}

          {activeTab === 'notes' && (
            <NotesTab
              noteContent={noteContent}
              noteSaveStatus={noteSaveStatus}
              onNoteChange={handleNoteChange}
            />
          )}

          {activeTab === 'chart' && (
            <ChartTab
              allWaypoints={allWaypoints}
              currentWaypointId={waypoint.id}
              expeditionTitle={expeditionTitle}
            />
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => {
          setIsQuizOpen(false);
          setQuizReviewMode(false);
          setQuizReviewAnswer(undefined);
          handleResumePlayback();
        }}
        onComplete={(score, total) => {
          handleQuizComplete(score, total);
        }}
        onQuestionAnswered={handleQuestionAnswered}
        questions={currentQuizQuestions}
        waypointTitle={waypoint.title}
        reviewMode={quizReviewMode}
        previousAnswer={quizReviewAnswer}
      />
    </div >
  );
}
