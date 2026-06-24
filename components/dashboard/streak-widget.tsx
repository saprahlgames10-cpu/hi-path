"use client";

import { useStore } from "@/store/useStore";
import { Flame } from "lucide-react";

export function StreakWidget() {
  const { streakCount } = useStore();
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (29 - i));
    return d;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Flame className="h-5 w-5 text-orange-500" />
        <span className="text-lg font-bold">{streakCount} day streak</span>
      </div>
      <div className="grid grid-cols-10 gap-1">
        {days.map((day, i) => {
          const isToday = i === 29;
          const isActive = i >= 29 - Math.min(streakCount, 29);
          return (
            <div
              key={i}
              className={`aspect-square rounded-sm ${isToday ? "ring-2 ring-primary" : ""} ${isActive ? "bg-primary" : "bg-muted"}`}
              title={day.toDateString()}
            />
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">Last 30 days</p>
    </div>
  );
}
