export interface Expedition {
  id: string;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  thumbnailGradient: string;
  waypoints: number;
  completedWaypoints: number;
  progress: number;
  hasMemoryCheckpoint?: boolean;
  isNew?: boolean;
  startedAt?: string;
  lastActiveAt?: string;
}

export interface Waypoint {
  id: string;
  expeditionId: string;
  order: number;
  title: string;
  description: string;
  duration: string;
  status: 'completed' | 'in-progress' | 'not-started';
  hasFieldGuide: boolean;
  quizCompleted: boolean;
  lastViewed?: string;
  videoUrl?: string;
}

export interface FieldGuide {
  summary: string;
  keyConcepts: Array<{
    id: number;
    text: string;
  }>;
  codeExample?: {
    language: string;
    code: string;
  };
  importantNote?: {
    title: string;
    content: string;
  };
}

export interface QuizQuestion {
  id: string;
  question: string;
  codeContext?: string;
  options: Array<{
    label: string;
    value: string;
    text: string;
  }>;
  correctAnswer: string;
  explanation: string;
}

export interface MemoryCheckpoint {
  id: string;
  title: string;
  expeditionTitle: string;
  difficulty: 'easy' | 'medium' | 'hard';
  lastReviewed: string;
  currentInterval: string;
  nextInterval: string;
  retentionStrength: number;
  dueDate?: string;
  isDue: boolean;
}

export interface KnowledgeNode {
  id: number;
  name: string;
  category: 'fundamentals' | 'advanced' | 'practical' | 'theory';
  definition: string;
  keypoints: string[];
  waypoints: string[];
  references?: string[];
}

export interface KnowledgeLink {
  source: number;
  target: number;
  type: 'prerequisite' | 'related';
}

export interface Activity {
  id: string;
  type: 'completed' | 'checkpoint' | 'started' | 'created';
  title: string;
  subtitle: string;
  timestamp: string;
}
