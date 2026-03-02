/**
 * Type definitions for the AtlasED Electron API
 * These types describe the window.atlased object exposed via preload.cjs
 */

// Database entity types
export interface DbExpedition {
    id: string;
    title: string;
    description?: string;
    playlist_url?: string;
    thumbnail_url?: string;
    created_at: string;
    updated_at: string;
    total_waypoints?: number;
    completed_waypoints?: number;
}

export interface DbWaypoint {
    id: string;
    expedition_id: string;
    title: string;
    youtube_id: string;
    thumbnail_url?: string;
    duration_seconds?: number;
    order_index: number;
    last_watched_pos?: number;
    transcript_text?: string;
    is_charted: number; // SQLite uses 0/1 for boolean
    is_unavailable?: number;
    next_review_at?: string;
    created_at: string;
}

export interface DbFieldGuide {
    id: string;
    waypoint_id: string;
    markdown_content?: string;
    quiz_data_json?: string; // JSON string (stores code_examples)
    executive_summary?: string;
    key_takeaways?: string; // JSON string (stores key_concepts)
    created_at: string;
    updated_at?: string;
}

export interface DbTag {
    id: string;
    name: string;
}

export interface DbQuizAttempt {
    id: string;
    waypoint_id: string;
    questions: string; // JSON string
    answers: string; // JSON string
    score: number;
    created_at: string;
}

export interface DbNote {
    id: string;
    waypoint_id: string;
    content: string;
    created_at: string;
    updated_at: string;
}

export interface DbBookmark {
    id: string;
    waypoint_id: string;
    timestamp_seconds: number;
    label: string;
    color: string;
    created_at: string;
}

export interface KnowledgeGraphData {
    waypoints: Array<{
        id: string;
        title: string;
        expedition_id: string;
        is_charted: number;
        key_takeaways?: string;
        executive_summary?: string;
    }>;
    waypointTags: Array<{
        waypoint_id: string;
        tag_id: string;
        tag_name: string;
    }>;
}

export interface SearchResults {
    expeditions: Array<{
        id: string;
        title: string;
        thumbnail_url?: string;
        type: 'expedition';
    }>;
    waypoints: Array<{
        id: string;
        title: string;
        expedition_id: string;
        youtube_id: string;
        order_index: number;
        is_charted: number;
        expedition_title: string;
        type: 'waypoint';
    }>;
    notes: Array<{
        id: string;
        waypoint_id: string;
        content: string;
        waypoint_title: string;
        expedition_id: string;
        expedition_title: string;
        type: 'note';
    }>;
    bookmarks: Array<{
        id: string;
        label: string;
        timestamp_seconds: number;
        waypoint_id: string;
        color: string;
        waypoint_title: string;
        expedition_id: string;
        type: 'bookmark';
    }>;
}

export interface SrsCheckpoint {
    id: string;
    title: string;
    expeditionTitle: string;
    expeditionId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    lastReviewed: string;
    lastReviewedAt: string;
    currentInterval: string;
    nextInterval: string;
    retentionStrength: number;
    dueDate: string;
    nextReviewAt: string;
    isDue: boolean;
    totalAttempts: number;
    correctCount: number;
    accuracy: number;
    sessionCount: number;
}

// API Response types
export interface TranscriptResult {
    success: boolean;
    transcript?: string;
    error?: string;
    supportsManualInput?: boolean;
}

export interface FieldGuideResult {
    success: boolean;
    data?: {
        executive_summary: string;
        key_concepts: Array<{ title: string; explanation: string; tags?: string[] }>;
        code_examples: Array<{ language: string; code: string; explanation: string }>;
        key_takeaways: string[];
        quizzes?: Array<{ question: string; options: string[]; correct_index: number; explanation: string }>;
        markdown_content?: string;
    };
    error?: string;
}

export interface QuizResult {
    success: boolean;
    data?: {
        quizzes: Array<{
            timestamp_seconds?: number;
            question: string;
            options: string[];
            correct_index: number;
            explanation: string;
        }>;
    };
    error?: string;
}

export interface ChatResult {
    success: boolean;
    response?: string;
    error?: string;
}

export interface PlaylistResult {
    success: boolean;
    isPlaylist?: boolean;
    title?: string | null;
    videos?: Array<{
        youtube_id: string;
        title: string | null;
        thumbnail_url: string | null;
        duration_seconds: number;
        order_index: number;
    }>;
    error?: string;
}

export interface ApiKeyValidationResult {
    valid: boolean;
    error?: string;
}

// Settings types
export interface Settings {
    gemini_api_key: string;
    youtube_api_key: string;
    theme: string;
    auto_quiz: boolean;
    auto_field_guide: boolean;
    playback_speed: number;
    srs_enabled: boolean;
    srs_intervals: number[];
}

// Atlased API interface
export interface AtlasedAPI {
    window: {
        minimize: () => Promise<void>;
        maximize: () => Promise<void>;
        close: () => Promise<void>;
    };
    openExternal: (url: string) => Promise<void>;
    settings: {
        get: <K extends keyof Settings>(key: K) => Promise<Settings[K]>;
        set: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
        getAll: () => Promise<Settings>;
    };
    expeditions: {
        create: (data: { title: string; description?: string; playlist_url?: string; thumbnail_url?: string }) => Promise<DbExpedition>;
        getAll: () => Promise<DbExpedition[]>;
        get: (id: string) => Promise<DbExpedition | null>;
        delete: (id: string) => Promise<void>;
        update: (id: string, data: Partial<DbExpedition>) => Promise<void>;
    };
    waypoints: {
        create: (data: { expedition_id: string; title: string; youtube_id: string; order_index: number; thumbnail_url?: string; duration_seconds?: number }) => Promise<DbWaypoint>;
        getAll: (expeditionId: string) => Promise<DbWaypoint[]>;
        get: (id: string) => Promise<DbWaypoint | null>;
        updateProgress: (id: string, position: number) => Promise<void>;
        markCharted: (id: string) => Promise<void>;
        updateTranscript: (id: string, transcript: string) => Promise<void>;
    };
    fieldGuides: {
        create: (data: { waypoint_id: string; executive_summary?: string; markdown_content?: string | null; key_takeaways?: string | null; quiz_data_json?: string | null }) => Promise<string>;
        get: (waypointId: string) => Promise<DbFieldGuide | null>;
        update: (waypointId: string, data: Partial<DbFieldGuide>) => Promise<void>;
    };
    tags: {
        create: (name: string) => Promise<DbTag>;
        getAll: () => Promise<DbTag[]>;
        addToWaypoint: (waypointId: string, tagId: string) => Promise<void>;
        getForWaypoint: (waypointId: string) => Promise<DbTag[]>;
    };
    quizAttempts: {
        create: (data: { waypoint_id: string; questions: string; answers: string; score: number }) => Promise<string>;
        getAll: (waypointId: string) => Promise<DbQuizAttempt[]>;
    };
    memoryCheckpoints: {
        getAll: () => Promise<SrsCheckpoint[]>;
    };
    notes: {
        get: (waypointId: string) => Promise<DbNote | null>;
        upsert: (waypointId: string, content: string) => Promise<DbNote>;
    };
    bookmarks: {
        create: (data: { waypoint_id: string; timestamp_seconds: number; label?: string; color?: string }) => Promise<DbBookmark>;
        getAll: (waypointId: string) => Promise<DbBookmark[]>;
        update: (id: string, data: { label?: string; color?: string }) => Promise<void>;
        delete: (id: string) => Promise<void>;
    };
    knowledgeGraph: {
        getData: () => Promise<KnowledgeGraphData>;
    };
    search: {
        query: (q: string) => Promise<SearchResults>;
    };
    ai: {
        fetchTranscript: (videoId: string) => Promise<TranscriptResult>;
        generateFieldGuide: (transcript: string, videoTitle: string) => Promise<FieldGuideResult>;
        generateQuizzes: (transcript: string, videoTitle: string) => Promise<QuizResult>;
        validateApiKey: (apiKey: string) => Promise<ApiKeyValidationResult>;
        fetchPlaylist: (url: string) => Promise<PlaylistResult>;
        chat: (message: string, transcript: string, videoTitle: string, previousMessages: Array<{ role: string; content: string }>) => Promise<ChatResult>;
        generateExpeditionSummary: (videoTitles: string[]) => Promise<{ success: boolean; summary?: string; error?: string }>;
    };
}

// Extend the Window interface
declare global {
    interface Window {
        atlased?: AtlasedAPI;
    }
}

export { };
