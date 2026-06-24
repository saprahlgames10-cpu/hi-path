import { create } from "zustand";
import type {
  UserProfile,
  Roadmap,
  RoadmapPhase,
  RoadmapNode,
  Notification,
  WeaknessReport,
  DailyGoal,
  QuizSession,
} from "@/types";

interface AppState {
  // User
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;

  // Roadmap
  activeRoadmap: Roadmap | null;
  setActiveRoadmap: (roadmap: Roadmap | null) => void;
  phases: RoadmapPhase[];
  setPhases: (phases: RoadmapPhase[]) => void;
  nodes: RoadmapNode[];
  setNodes: (nodes: RoadmapNode[]) => void;

  // Progress
  overallProgress: number;
  setOverallProgress: (progress: number) => void;
  xp: number;
  setXp: (xp: number) => void;
  streakCount: number;
  setStreakCount: (count: number) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (notifications: Notification[]) => void;
  unreadCount: number;
  setUnreadCount: (count: number) => void;

  // Weaknesses
  weaknessReport: WeaknessReport | null;
  setWeaknessReport: (report: WeaknessReport | null) => void;

  // Daily Goals
  todayGoal: DailyGoal | null;
  setTodayGoal: (goal: DailyGoal | null) => void;

  // Quiz
  currentQuiz: QuizSession | null;
  setCurrentQuiz: (quiz: QuizSession | null) => void;

  // UI
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  chatOpen: boolean;
  setChatOpen: (open: boolean) => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  // User
  user: null,
  setUser: (user) => set({ user }),

  // Roadmap
  activeRoadmap: null,
  setActiveRoadmap: (roadmap) => set({ activeRoadmap: roadmap }),
  phases: [],
  setPhases: (phases) => set({ phases }),
  nodes: [],
  setNodes: (nodes) => set({ nodes }),

  // Progress
  overallProgress: 0,
  setOverallProgress: (progress) => set({ overallProgress: progress }),
  xp: 0,
  setXp: (xp) => set({ xp }),
  streakCount: 0,
  setStreakCount: (count) => set({ streakCount: count }),

  // Notifications
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  unreadCount: 0,
  setUnreadCount: (count) => set({ unreadCount: count }),

  // Weaknesses
  weaknessReport: null,
  setWeaknessReport: (report) => set({ weaknessReport: report }),

  // Daily Goals
  todayGoal: null,
  setTodayGoal: (goal) => set({ todayGoal: goal }),

  // Quiz
  currentQuiz: null,
  setCurrentQuiz: (quiz) => set({ currentQuiz: quiz }),

  // UI
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  chatOpen: false,
  setChatOpen: (open) => set({ chatOpen: open }),
  darkMode: false,
  setDarkMode: (dark) => set({ darkMode: dark }),
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
}));
