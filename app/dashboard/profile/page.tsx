"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { calculateLevel, calculateXPForNextLevel } from "@/lib/utils";
import { Zap, Trophy, Camera, Save } from "lucide-react";

export default function ProfilePage() {
  const { user, xp, setUser } = useStore();
  const { toast } = useToast();
  const [name, setName] = useState(user?.full_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [saving, setSaving] = useState(false);

  const level = calculateLevel(xp);
  const xpToNext = calculateXPForNextLevel(xp);

  const saveProfile = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("users_profile")
      .update({ full_name: name, bio })
      .eq("id", user?.id);
    if (error) toast({ title: "Failed to save", variant: "destructive" });
    else {
      setUser({ ...user!, full_name: name, bio });
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card>
        <CardContent className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <Avatar className="h-24 w-24">
              <AvatarImage src={user?.avatar_url || undefined} />
              <AvatarFallback className="text-2xl bg-primary text-white">
                {user?.full_name?.split(" ").map((n: string) => n[0]).join("").toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <button className="absolute bottom-0 right-0 p-1.5 rounded-full bg-primary text-white">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold">{user?.full_name || "Learner"}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Zap className="h-3 w-3" /> Level {level}
              </Badge>
              <span className="text-sm text-muted-foreground">{xp} XP</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{xpToNext} XP to next level</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Edit Profile</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Bio</Label>
            <textarea
              className="w-full min-h-[80px] rounded-lg border border-border bg-transparent p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
            />
          </div>
          <Button onClick={saveProfile} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Saving..." : "Save Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">Achievements</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { name: "First Step", desc: "Complete first node", icon: "🎯", earned: false },
              { name: "On a Roll", desc: "7-day streak", icon: "🔥", earned: false },
              { name: "Quiz Master", desc: "5 perfect quizzes", icon: "📝", earned: false },
              { name: "Phase Conqueror", desc: "Complete first phase", icon: "🏆", earned: false },
              { name: "Consistent", desc: "30-day streak", icon: "💪", earned: false },
              { name: "Champion", desc: "Complete roadmap", icon: "👑", earned: false },
            ].map((ach, i) => (
              <div key={i} className={`p-3 rounded-lg border text-center ${ach.earned ? "border-primary/30 bg-primary/5" : "opacity-50"}`}>
                <div className="text-2xl mb-1">{ach.icon}</div>
                <p className="text-sm font-medium">{ach.name}</p>
                <p className="text-xs text-muted-foreground">{ach.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
