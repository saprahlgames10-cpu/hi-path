export interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  timezone: string | null;
  streak_count: number;
  total_xp: number;
  created_at: string;
  updated_at: string;
}

export interface Roadmap {
  id: string;
  user_id: string;
  title: string;
  goal_description: string;
  duration_weeks: number;
  skill_level: string;
  learning_style: string;
  hours_per_week: number;
  status: 'active' | 'completed' | 'paused' | 'archived';
  ai_summary: string | null;
  total_nodes: number;
  completed_nodes: number;
  overall_progress: number;
  created_at: string;
  updated_at: string;
}

export interface RoadmapPhase {
  id: string;
  roadmap_id: string;
  phase_number: number;
  title: string;
  description: string | null;
  duration_weeks: number;
  order_index: number;
  status: 'locked' | 'active' | 'completed';
  created_at: string;
}

export interface RoadmapNode {
  id: string;
  phase_id: string;
  roadmap_id: string;
  user_id: string;
  title: string;
  description: string | null;
  node_type: 'concept' | 'project' | 'quiz' | 'resource' | 'milestone';
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_hours: number;
  order_index: number;
  status: 'locked' | 'active' | 'in_progress' | 'completed' | 'skipped';
  xp_reward: number;
  ai_explanation: string | null;
  resources: Resource[];
  prerequisites: string[];
  completed_at: string | null;
  created_at: string;
}

export interface Resource {
  title: string;
  url: string;
  type: 'video' | 'article' | 'book' | 'course';
  is_free: boolean;
}

export interface UserProgress {
  id: string;
  user_id: string;
  node_id: string;
  roadmap_id: string;
  status: 'started' | 'completed' | 'struggled' | 'skipped';
  time_spent_minutes: number;
  notes: string | null;
  confidence_level: number | null;
  created_at: string;
  updated_at: string;
}

export interface QuizSession {
  id: string;
  user_id: string;
  node_id: string;
  roadmap_id: string;
  questions: QuizQuestion[];
  user_answers: UserAnswer[];
  score: number;
  passed: boolean;
  time_taken_seconds: number;
  ai_feedback: string | null;
  created_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
  explanation: string;
}

export interface UserAnswer {
  question_id: string;
  selected_answer: string;
}

export interface WeaknessReport {
  id: string;
  user_id: string;
  roadmap_id: string;
  weak_topics: TopicPerformance[];
  strong_topics: TopicPerformance[];
  ai_analysis: string;
  recommendations: Recommendation[];
  generated_at: string;
}

export interface TopicPerformance {
  topic: string;
  score: number;
  suggested_nodes?: string[];
  reason?: string;
}

export interface Recommendation {
  action: string;
  priority: 'high' | 'medium' | 'low';
  node_title?: string;
  node_id?: string;
}

export interface DailyGoal {
  id: string;
  user_id: string;
  roadmap_id: string;
  date: string;
  goal_description: string;
  target_nodes: string[];
  completed: boolean;
  xp_earned: number;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'streak_reminder' | 'goal_completed' | 'weakness_detected' | 'roadmap_adjusted' | 'achievement';
  title: string;
  message: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
  condition_type: 'streak' | 'xp' | 'nodes_completed' | 'roadmaps_completed';
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  earned_at: string;
  achievement?: Achievement;
}

export interface RoadmapFormData {
  goal: string;
  skillLevel: string;
  hoursPerWeek: number;
  durationWeeks: number;
  learningStyle: string;
}

export interface OnboardingData {
  fullName: string;
  timezone: string;
  goal: string;
  skillLevel: string;
  hoursPerWeek: number;
  durationWeeks: number;
  durationLabel: string;
  learningStyle: string;
}

export interface GeneratedRoadmap {
  title: string;
  summary: string;
  phases: GeneratedPhase[];
}

export interface GeneratedPhase {
  phase_number: number;
  title: string;
  description: string;
  duration_weeks: number;
  nodes: GeneratedNode[];
}

export interface GeneratedNode {
  title: string;
  description: string;
  node_type: 'concept' | 'project' | 'quiz' | 'resource' | 'milestone';
  difficulty: 'easy' | 'medium' | 'hard';
  estimated_hours: number;
  xp_reward: number;
  resources: Resource[];
  ai_explanation: string;
}

export interface AIQuizResponse {
  questions: {
    id: string;
    question: string;
    options: string[];
    correct_answer: string;
    explanation: string;
  }[];
}

export interface AIDailyGoal {
  goal_description: string;
  target_nodes: string[];
  estimated_time_minutes: number;
  motivation_message: string;
}
