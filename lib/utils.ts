import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatTimeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getTimeOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}

export function getNodeTypeIcon(nodeType: string): string {
  const icons: Record<string, string> = {
    concept: "BookOpen",
    project: "Code2",
    quiz: "HelpCircle",
    resource: "Link",
    milestone: "Award",
  };
  return icons[nodeType] || "FileText";
}

export function getDifficultyColor(difficulty: string): string {
  const colors: Record<string, string> = {
    easy: "text-green-500 bg-green-500/10",
    medium: "text-yellow-500 bg-yellow-500/10",
    hard: "text-red-500 bg-red-500/10",
  };
  return colors[difficulty] || "text-gray-500 bg-gray-500/10";
}

export function calculateLevel(xp: number): number {
  return Math.floor(xp / 1000) + 1;
}

export function calculateXPForNextLevel(xp: number): number {
  return 1000 - (xp % 1000);
}

export const XP_REWARDS = {
  CONCEPT_COMPLETE: 50,
  PROJECT_COMPLETE: 150,
  MILESTONE_COMPLETE: 300,
  QUIZ_PASS: 100,
  QUIZ_PERFECT: 200,
  STREAK_7_DAY: 500,
  PHASE_COMPLETE: 500,
} as const;

export function generateId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
}
