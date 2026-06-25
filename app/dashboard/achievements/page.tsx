"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Lock, Star, Award, Zap } from "lucide-react";
import type { Achievement, UserAchievement } from "@/types";

export default function AchievementsPage() {
  const { user } = useStore();
  const [allAchievements, setAllAchievements] = useState<Achievement[]>([]);
  const [earned, setEarned] = useState<UserAchievement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      if (!user) return;
      const [{ data: achievements }, { data: userAchievements }] = await Promise.all([
        supabase.from("achievements").select("*"),
        supabase.from("user_achievements").select("*, achievement:achievements(*)").eq("user_id", user.id),
      ]);
      setAllAchievements((achievements || []) as Achievement[]);
      setEarned((userAchievements || []) as UserAchievement[]);
      setLoading(false);
    };
    fetch();
  }, [user]);

  const earnedIds = new Set(earned.map((ua) => ua.achievement_id));
  const total = allAchievements.length;
  const earnedCount = earned.length;

  if (loading) return <div className="space-y-4"><Skeleton className="h-32" /><Skeleton className="h-32" /></div>;

  const iconMap: Record<string, any> = {
    "🎯": Trophy,
    "🔥": Zap,
    "📝": Award,
    "🏆": Trophy,
    "💪": Zap,
    "👑": Star,
    "⚡": Zap,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Achievements</h1>
        <span className="text-sm text-muted-foreground">{earnedCount}/{total} unlocked</span>
      </div>

      <Card>
        <CardContent className="p-6 text-center">
          <Trophy className="h-12 w-12 mx-auto text-yellow-500 mb-2" />
          <p className="text-3xl font-bold">{earnedCount}/{total}</p>
          <p className="text-sm text-muted-foreground">achievements unlocked</p>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {allAchievements.map((achievement) => {
          const Icon = iconMap[achievement.icon] || Trophy;
          const isEarned = earnedIds.has(achievement.id);
          const earnInfo = earned.find((ua) => ua.achievement_id === achievement.id);

          return (
            <Card key={achievement.id} className={`transition-all ${isEarned ? "border-yellow-500/30 bg-yellow-500/5" : "opacity-60"}`}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isEarned ? "bg-yellow-500/10" : "bg-muted"}`}>
                    {isEarned ? <Icon className="h-6 w-6 text-yellow-500" /> : <Lock className="h-6 w-6 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{achievement.name}</p>
                    <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Star className="h-3 w-3" /> +{achievement.xp_reward} XP
                  </span>
                  {isEarned && earnInfo && (
                    <span className="text-[10px] text-green-500">
                      {new Date(earnInfo.earned_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
