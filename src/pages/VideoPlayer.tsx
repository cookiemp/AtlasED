import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft, Settings, Play, Pause, Volume2, Maximize,
  ChevronLeft, ChevronRight, CheckCircle, MapPin, Clock,
  BookOpen, Compass, Key, Code2, AlertCircle, Send, Loader2, RefreshCw,
  StickyNote, Map as MapIcon, Circle, CircleDot
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DbWaypoint, DbFieldGuide } from "@/types/electron";
import { QuizModal, type QuizQuestion } from "@/components/modals/QuizModal";

type TabType = 'field-guide' | 'notes' | 'chart' | 'compass-ai';

// Simple markdown renderer for chat messages
function renderMarkdown(text: string) {
  // Split by code blocks first
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    // Code block
    if (part.startsWith('```')) {
      const lines = part.slice(3, -3).split('\n');
      const language = lines[0]?.trim() || '';
      const code = lines.slice(language ? 1 : 0).join('\n');
      return (
        <div key={i} className="my-2 rounded-lg overflow-hidden">
          {language && (
            <div className="bg-atlas-bg-tertiary px-3 py-1 text-xs text-atlas-text-muted uppercase">
              {language}
            </div>
          )}
          <pre className="bg-atlas-bg-tertiary/50 p-3 overflow-x-auto">
            <code className="text-xs font-mono text-atlas-text-secondary">{code}</code>
          </pre>
        </div>
      );
    }

    // Regular text — process inline markdown
    const lines = part.split('\n');
    return (
      <span key={i}>
        {lines.map((line, j) => {
          // Process bold, italic, inline code
          const processed = line
            .replace(/\*\*(.+?)\*\*/g, '<strong class="text-atlas-text-primary font-semibold">$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/`([^`]+)`/g, '<code class="bg-atlas-bg-tertiary px-1.5 py-0.5 rounded text-xs font-mono text-atlas-gold">$1</code>');

          // Bullet points
          const isBullet = line.match(/^\s*[-*•]\s+(.*)/);
          if (isBullet) {
            return (
              <span key={j} className="flex items-start gap-2 my-0.5">
                <span className="text-atlas-gold mt-0">•</span>
                <span dangerouslySetInnerHTML={{ __html: processed.replace(/^\s*[-*•]\s+/, '') }} />
              </span>
            );
          }

          // Numbered list
          const isNumbered = line.match(/^\s*(\d+)\.\s+(.*)/);
          if (isNumbered) {
            return (
              <span key={j} className="flex items-start gap-2 my-0.5">
                <span className="text-atlas-gold font-medium text-xs min-w-[1rem]">{isNumbered[1]}.</span>
                <span dangerouslySetInnerHTML={{ __html: processed.replace(/^\s*\d+\.\s+/, '') }} />
              </span>
            );
          }

          return (
            <span key={j}>
              <span dangerouslySetInnerHTML={{ __html: processed }} />
              {j < lines.length - 1 && <br />}
            </span>
          );
        })}
      </span>
    );
  });
}

interface ChatMessage {
  type: 'ai' | 'user';
  content: string;
}

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
  const [triggeredTimestamps, setTriggeredTimestamps] = useState<Set<number>>(new Set());
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [prevWaypointId, setPrevWaypointId] = useState<string | null>(null);
  const [nextWaypointId, setNextWaypointId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState("");
  const [noteSaveStatus, setNoteSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [allWaypoints, setAllWaypoints] = useState<DbWaypoint[]>([]);
  const noteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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
    setTriggeredTimestamps(new Set());
    setCurrentVideoTime(0);
    setPrevWaypointId(null);
    setNextWaypointId(null);
    setNoteContent("");
    setNoteSaveStatus('idle');
    setAllWaypoints([]);
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

  useEffect(() => {
    loadWaypointData();
    // Initialize Compass AI greeting
    setChatMessages([{
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

          // Also generate quizzes in parallel (fire & forget — don't block field guide)
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
              setQuizQuestions(quizzes);
            }
          } catch (quizErr) {
            console.warn('Quiz generation failed (non-critical):', quizErr);
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
    setChatMessages(prev => [...prev, { type: 'user', content: userMessage }]);
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
          setChatMessages(prev => [...prev, { type: 'ai', content: result.response! }]);
        } else {
          console.error("Chat API error:", result.error);
          const errorText = result.error?.toLowerCase() || '';
          const isRateLimit = errorText.includes('rate limit') || errorText.includes('quota');
          setChatMessages(prev => [...prev, {
            type: 'ai',
            content: isRateLimit
              ? "⏳ Rate limit reached — the free Gemini tier allows 20 requests/minute. Please wait about a minute and try again."
              : (result.error || "I'm sorry, I couldn't process your question. Please try again or check if the API key is configured in Settings.")
          }]);
        }
      } else {
        setChatMessages(prev => [...prev, {
          type: 'ai',
          content: "I need a transcript to answer questions about this video. Please generate the Field Guide first to enable the chat feature."
        }]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatMessages(prev => [...prev, {
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

  // Mid-stream quiz: pause video when reaching quiz timestamps
  useEffect(() => {
    if (quizQuestions.length === 0 || videoState !== 1) return; // Only check while playing

    for (const q of quizQuestions) {
      if (q.timestamp_seconds && !triggeredTimestamps.has(q.timestamp_seconds)) {
        // Trigger quiz if within 2-second window of timestamp
        if (Math.abs(currentVideoTime - q.timestamp_seconds) < 2) {
          // Pause the video
          if (playerRef.current?.contentWindow) {
            playerRef.current.contentWindow.postMessage(
              JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }),
              'https://www.youtube.com'
            );
          }
          // Show quiz for this timestamp
          setCurrentQuizQuestions([q]);
          setIsQuizOpen(true);
          setTriggeredTimestamps(prev => new Set([...prev, q.timestamp_seconds!]));
          break;
        }
      }
    }
  }, [currentVideoTime, quizQuestions, videoState, triggeredTimestamps]);

  // Handle quiz completion
  const handleQuizComplete = async (score: number, total: number) => {
    // Record quiz attempt
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
    setIsQuizOpen(false);
    // Resume playback after quiz
    handleResumePlayback();
  };

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

  const youtubeEmbedUrl = `https://www.youtube.com/embed/${waypoint.youtube_id}?enablejsapi=1&rel=0&modestbranding=1&iv_load_policy=3&origin=${encodeURIComponent(window.location.origin)}`;

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
      <div className="h-10 bg-atlas-bg-secondary border-b border-atlas-border flex items-center justify-between px-4">
        <div className="flex items-center gap-4">
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

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/settings')}
            className="p-1.5 text-atlas-text-secondary hover:text-atlas-gold transition-colors"
          >
            <Settings className="w-[18px] h-[18px]" />
          </button>
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
          </div>

          {/* Video Info Bar */}
          <div className="p-4 border-t border-atlas-border bg-atlas-bg-secondary flex-shrink-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="font-display font-bold text-base text-atlas-text-primary leading-tight line-clamp-2">
                {waypoint.title}
              </h2>
              <span className="text-xs text-atlas-text-muted bg-atlas-bg-tertiary px-2 py-1 rounded flex-shrink-0">
                Waypoint {waypoint.order_index + 1}
              </span>
            </div>

            {/* Duration + Status Row */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-1.5 text-atlas-text-secondary">
                <Clock className="w-3.5 h-3.5" />
                <span className="text-xs">
                  {(() => {
                    const dur = videoDuration || waypoint.duration_seconds;
                    if (!dur) return '—';
                    const h = Math.floor(dur / 3600);
                    const m = Math.floor((dur % 3600) / 60);
                    const s = dur % 60;
                    return h > 0
                      ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
                      : `${m}:${String(s).padStart(2, '0')}`;
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
            </div>

            {/* Navigation Row — pushed to bottom */}
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
                onClick={handleMarkComplete}
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

          {/* Tab Content: Field Guide */}
          {activeTab === 'field-guide' && (
            <div className="flex-1 overflow-auto p-6">
              {isGeneratingGuide ? (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <Loader2 className="w-8 h-8 text-atlas-gold animate-spin" />
                  <p className="text-atlas-text-secondary">Generating Field Guide...</p>
                  <p className="text-xs text-atlas-text-muted">This may take a minute</p>
                </div>
              ) : fieldGuide ? (
                <>
                  {/* Executive Summary */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-display font-bold text-atlas-text-primary flex items-center gap-2">
                        <svg className="w-5 h-5 text-atlas-gold" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M16 13H8" />
                          <path d="M16 17H8" />
                        </svg>
                        Summary
                      </h3>
                      <button
                        onClick={handleGenerateFieldGuide}
                        disabled={isGeneratingGuide}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-atlas-text-secondary hover:text-atlas-gold bg-atlas-bg-tertiary hover:bg-atlas-bg-tertiary/80 border border-atlas-border rounded-lg transition-all disabled:opacity-50"
                        title="Regenerate Field Guide"
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5", isGeneratingGuide && "animate-spin")} />
                        Regenerate
                      </button>
                    </div>
                    <p className="text-sm text-atlas-text-secondary leading-relaxed">
                      {fieldGuide.executive_summary}
                    </p>
                  </div>

                  {/* Key Concepts */}
                  {fieldGuide.key_concepts && fieldGuide.key_concepts.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-display font-bold text-atlas-text-primary mb-3 flex items-center gap-2">
                        <Key className="w-5 h-5 text-atlas-gold" />
                        Key Concepts
                      </h3>
                      <ul className="space-y-3">
                        {fieldGuide.key_concepts.map((concept, index) => (
                          <li key={index} className="flex items-start gap-3 text-sm">
                            <span className="w-5 h-5 rounded bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-atlas-gold text-xs font-bold">{index + 1}</span>
                            </span>
                            <div>
                              <p className="text-atlas-text-primary font-medium">{concept.title}</p>
                              <p className="text-atlas-text-secondary mt-0.5">{concept.explanation}</p>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Code Examples */}
                  {fieldGuide.code_examples && fieldGuide.code_examples.length > 0 && (
                    <div className="mb-6">
                      <h3 className="font-display font-bold text-atlas-text-primary mb-3 flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-atlas-gold" />
                        Code Examples
                      </h3>
                      {fieldGuide.code_examples.map((example, index) => (
                        <div key={index} className="mb-4">
                          <div className="code-block rounded-lg p-4 overflow-x-auto">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs text-atlas-text-muted uppercase">{example.language}</span>
                            </div>
                            <pre className="text-xs text-atlas-text-secondary leading-relaxed font-mono">
                              <code>{example.code}</code>
                            </pre>
                          </div>
                          {example.explanation && (
                            <p className="text-xs text-atlas-text-muted mt-2 px-1">{example.explanation}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Key Takeaways */}
                  {fieldGuide.key_takeaways && fieldGuide.key_takeaways.length > 0 && (
                    <div className="bg-atlas-gold/5 border border-atlas-gold/20 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="w-[18px] h-[18px] text-atlas-gold flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-atlas-text-primary text-sm mb-2">Key Takeaways</h4>
                          <ul className="space-y-1">
                            {fieldGuide.key_takeaways.map((takeaway, index) => (
                              <li key={index} className="text-sm text-atlas-text-secondary flex items-start gap-2">
                                <span className="text-atlas-gold mt-1">•</span>
                                <span>{takeaway}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Take Quiz Button */}
                  {quizQuestions.length > 0 && (
                    <div className="pt-4 border-t border-atlas-border">
                      <button
                        onClick={handleOpenQuiz}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-atlas-gold/10 hover:bg-atlas-gold/20 border border-atlas-gold/30 text-atlas-gold font-semibold rounded-xl transition-all"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Take Comprehension Quiz ({quizQuestions.length} questions)
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-16 h-16 rounded-full bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-atlas-gold" />
                  </div>
                  <h3 className="font-display font-bold text-atlas-text-primary">No Field Guide Yet</h3>
                  <p className="text-sm text-atlas-text-secondary text-center max-w-xs">
                    Generate an AI-powered field guide with key concepts, code examples, and important notes.
                  </p>
                  <button
                    onClick={handleGenerateFieldGuide}
                    className="px-6 py-3 bg-atlas-gold hover:bg-atlas-gold-hover text-atlas-bg-primary font-bold rounded-xl transition-all"
                  >
                    Generate Field Guide
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tab Content: Compass AI */}
          {activeTab === 'compass-ai' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chat Messages */}
              <div className="flex-1 overflow-auto p-6 space-y-4">
                {chatMessages.map((msg, index) => (
                  <div key={index} className={cn(
                    "flex gap-3",
                    msg.type === 'user' && "justify-end"
                  )}>
                    {msg.type === 'ai' && (
                      <div className="w-8 h-8 rounded-full bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center flex-shrink-0">
                        <Compass className="w-4 h-4 text-atlas-gold" />
                      </div>
                    )}
                    <div className={cn(
                      "rounded-2xl px-4 py-3 max-w-[85%]",
                      msg.type === 'ai'
                        ? "chat-bubble-ai rounded-tl-sm"
                        : "chat-bubble-user rounded-tr-sm"
                    )}>
                      <div className="text-sm text-atlas-text-secondary leading-relaxed">{renderMarkdown(msg.content)}</div>
                    </div>
                  </div>
                ))}
                {isSendingChat && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-atlas-gold/10 border border-atlas-gold/30 flex items-center justify-center flex-shrink-0">
                      <Compass className="w-4 h-4 text-atlas-gold" />
                    </div>
                    <div className="chat-bubble-ai rounded-2xl rounded-tl-sm px-4 py-3">
                      <Loader2 className="w-4 h-4 animate-spin text-atlas-gold" />
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-4 border-t border-atlas-border bg-atlas-bg-secondary">
                <form
                  onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                  className="flex gap-3"
                >
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      placeholder="Ask Compass about this video..."
                      disabled={isSendingChat}
                      className="w-full bg-atlas-bg-tertiary border border-atlas-border rounded-xl px-4 py-3 text-sm text-atlas-text-primary placeholder-atlas-text-muted focus:outline-none focus:border-atlas-gold/50 focus:ring-1 focus:ring-atlas-gold/50 transition-all disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSendingChat || !chatInput.trim()}
                    className="w-11 h-11 bg-atlas-gold hover:bg-atlas-gold-hover rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-[18px] h-[18px] text-atlas-bg-primary" />
                  </button>
                </form>
                <p className="text-xs text-atlas-text-muted mt-2 text-center">
                  {waypoint.transcript_text
                    ? "Compass AI may produce inaccurate information. Always verify important concepts."
                    : "Generate a Field Guide first to enable Compass AI chat."
                  }
                </p>
              </div>
            </div>
          )}

          {/* Tab Content: Notes */}
          {activeTab === 'notes' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Notes Header */}
              <div className="px-6 py-4 border-b border-atlas-border bg-atlas-bg-secondary/50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <StickyNote className="w-4 h-4 text-atlas-gold" />
                  <h3 className="font-display font-semibold text-sm text-atlas-text-primary">Personal Notes</h3>
                </div>
                <span className={cn(
                  "text-[10px] font-medium px-2 py-0.5 rounded-full transition-all",
                  noteSaveStatus === 'saving' && "bg-atlas-gold/10 text-atlas-gold",
                  noteSaveStatus === 'saved' && "bg-atlas-success/10 text-atlas-success",
                  noteSaveStatus === 'idle' && "opacity-0"
                )}>
                  {noteSaveStatus === 'saving' ? 'Saving...' : noteSaveStatus === 'saved' ? '✓ Saved' : ''}
                </span>
              </div>
              {/* Notes Textarea */}
              <div className="flex-1 p-4 overflow-hidden">
                <textarea
                  value={noteContent}
                  onChange={(e) => handleNoteChange(e.target.value)}
                  placeholder="Write your notes about this video here...&#10;&#10;Tips:&#10;• Summarize key points in your own words&#10;• Note timestamps for important sections&#10;• Write down questions to revisit later"
                  className="w-full h-full bg-atlas-bg-tertiary/50 border border-atlas-border/50 rounded-xl p-4 text-sm text-atlas-text-primary placeholder-atlas-text-muted/50 focus:outline-none focus:border-atlas-gold/30 focus:ring-1 focus:ring-atlas-gold/20 transition-all resize-none font-body leading-relaxed"
                />
              </div>
            </div>
          )}

          {/* Tab Content: Chart (Waypoint List) */}
          {activeTab === 'chart' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Chart Header */}
              <div className="px-6 py-4 border-b border-atlas-border bg-atlas-bg-secondary/50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MapIcon className="w-4 h-4 text-atlas-gold" />
                    <h3 className="font-display font-semibold text-sm text-atlas-text-primary">{expeditionTitle}</h3>
                  </div>
                  <span className="text-[10px] text-atlas-text-muted font-medium">
                    {allWaypoints.filter(w => w.is_charted === 1).length}/{allWaypoints.length} charted
                  </span>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-1 bg-atlas-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-atlas-gold rounded-full transition-all duration-500"
                    style={{ width: allWaypoints.length > 0 ? `${(allWaypoints.filter(w => w.is_charted === 1).length / allWaypoints.length) * 100}%` : '0%' }}
                  />
                </div>
              </div>
              {/* Waypoint List */}
              <div className="flex-1 overflow-auto">
                {allWaypoints.map((wp, idx) => {
                  const isCurrent = wp.id === waypoint?.id;
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
                            const alreadyNumbered = /^\s*\d+[\.\)\-\s]/.test(wp.title);
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
          )}
        </div>
      </div>

      {/* Quiz Modal */}
      <QuizModal
        isOpen={isQuizOpen}
        onClose={() => {
          setIsQuizOpen(false);
          handleResumePlayback();
        }}
        onComplete={handleQuizComplete}
        questions={currentQuizQuestions}
        waypointTitle={waypoint.title}
      />
    </div>
  );
}
