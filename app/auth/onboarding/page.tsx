"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, ArrowLeft, BookOpen, Eye, Headphones, Pen, Check, Sparkles, Loader2 } from "lucide-react";
import type { GoalParse } from "@/types";

const learningStyles = [
  { value: "visual", label: "Visual", icon: Eye, desc: "Diagrams, videos, and images" },
  { value: "reading", label: "Reading", icon: BookOpen, desc: "Books, articles, and docs" },
  { value: "hands-on", label: "Hands-on", icon: Pen, desc: "Practice and projects" },
  { value: "mixed", label: "Mixed", icon: Headphones, desc: "A bit of everything" },
];

const skillLevels = [
  { value: "beginner", label: "Beginner", desc: "New to this topic" },
  { value: "intermediate", label: "Intermediate", desc: "Some experience" },
  { value: "advanced", label: "Advanced", desc: "Deep expertise" },
];

const durations = [
  { value: 12, label: "3 months" },
  { value: 24, label: "6 months" },
  { value: 52, label: "1 year" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [goalParse, setGoalParse] = useState<GoalParse | null>(null);
  const [formData, setFormData] = useState({
    fullName: "",
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    goal: "",
    skillLevel: "beginner",
    hoursPerWeek: 10,
    durationWeeks: 52,
    durationLabel: "1 year",
    learningStyle: "mixed",
  });
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push("/auth/login");
    };
    checkUser();
  }, [router]);

  const update = (key: string, value: any) => setFormData((prev) => ({ ...prev, [key]: value }));

  const handleNext = () => setStep((s) => Math.min(s + 1, 3));
  const handleBack = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error: profileError } = await supabase.from("users_profile").insert({
        id: user.id,
        full_name: formData.fullName,
        timezone: formData.timezone,
      });
      if (profileError) throw profileError;

      const { error: roadmapError } = await supabase.from("roadmaps").insert({
        user_id: user.id,
        title: `Learn ${formData.goal.substring(0, 50)}`,
        goal_description: formData.goal,
        duration_weeks: formData.durationWeeks,
        skill_level: formData.skillLevel,
        learning_style: formData.learningStyle,
        hours_per_week: formData.hoursPerWeek,
        predicted_completion_date: new Date(Date.now() + formData.durationWeeks * 7 * 86400000).toISOString().split("T")[0],
        goal_parse: goalParse || {},
        status: "active",
      });

      if (roadmapError) throw roadmapError;

      toast({ title: "Profile saved!", description: "Now let's generate your roadmap..." });
      router.push("/dashboard");
    } catch (error: any) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      title: "What's your name?",
      desc: "Let us know who you are",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Your Name</Label>
            <Input placeholder="Enter your full name" value={formData.fullName} onChange={(e) => update("fullName", e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Timezone</Label>
            <Input value={formData.timezone} onChange={(e) => update("timezone", e.target.value)} />
          </div>
        </div>
      ),
    },
    {
      title: "What do you want to learn?",
      desc: "Describe your learning goal",
      content: (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Learning Goal</Label>
            <textarea
              className="flex min-h-[100px] w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="e.g., Become a Python developer in 12 months. I want to build web apps and have basic coding experience."
              value={formData.goal}
              onChange={(e) => { update("goal", e.target.value); setGoalParse(null); }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-1"
              disabled={!formData.goal || parsing}
              onClick={async () => {
                setParsing(true);
                try {
                  const res = await fetch("/api/goals/parse", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ goal: formData.goal }),
                  });
                  const data = await res.json();
                  if (!data.error) {
                    setGoalParse(data);
                    update("skillLevel", data.seniority === "senior" ? "advanced" : data.seniority === "mid" ? "intermediate" : "beginner");
                    toast({ title: "Goal analyzed!", description: `Target role: ${data.targetRole}` });
                  } else toast({ title: "Parse failed", description: data.error, variant: "destructive" });
                } catch { toast({ title: "Error", description: "Failed to analyze goal", variant: "destructive" }); }
                finally { setParsing(false); }
              }}
            >
              {parsing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
              AI Analyze Goal
            </Button>
          </div>
          {goalParse && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-2 text-sm animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-medium">{goalParse.targetRole}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10">{goalParse.seniority}</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {goalParse.requiredSkills.map((s: string) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-muted">{s}</span>
                ))}
              </div>
              <div className="text-xs text-muted-foreground flex justify-between">
                <span>Industry: {goalParse.industry}</span>
                <span>Est. {goalParse.estimatedMonths} months</span>
                <span>Demand: {goalParse.marketDemand}</span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label>Skill Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {skillLevels.map((sl) => (
                <button
                  key={sl.value}
                  type="button"
                  onClick={() => update("skillLevel", sl.value)}
                  className={`p-3 rounded-lg border text-sm text-left transition-all ${formData.skillLevel === sl.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  <div className="font-medium">{sl.label}</div>
                  <div className="text-xs text-muted-foreground">{sl.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Your schedule",
      desc: "How much time can you dedicate?",
      content: (
        <div className="space-y-6">
          <div className="space-y-2">
            <Label>Hours per week: {formData.hoursPerWeek}h</Label>
            <Slider min={1} max={40} step={1} value={[formData.hoursPerWeek]} onValueChange={([v]) => update("hoursPerWeek", v)} />
            <div className="flex justify-between text-xs text-muted-foreground"><span>1h</span><span>40h</span></div>
          </div>
          <div className="space-y-2">
            <Label>Target Duration</Label>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => { update("durationWeeks", d.value); update("durationLabel", d.label); }}
                  className={`p-3 rounded-lg border text-sm transition-all ${formData.durationWeeks === d.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="space-y-2 mt-2">
              <Label>Or custom (weeks)</Label>
              <Input type="number" min={1} max={208} value={formData.durationWeeks} onChange={(e) => update("durationWeeks", parseInt(e.target.value) || 52)} />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "How do you learn best?",
      desc: "Choose your preferred learning style",
      content: (
        <div className="space-y-3">
          {learningStyles.map((ls) => {
            const Icon = ls.icon;
            return (
              <button
                key={ls.value}
                type="button"
                onClick={() => update("learningStyle", ls.value)}
                className={`w-full p-4 rounded-lg border text-left transition-all flex items-center gap-4 ${formData.learningStyle === ls.value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}
              >
                <div className={`p-2 rounded-lg ${formData.learningStyle === ls.value ? "bg-primary text-white" : "bg-muted"}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{ls.label}</div>
                  <div className="text-sm text-muted-foreground">{ls.desc}</div>
                </div>
                {formData.learningStyle === ls.value && <Check className="h-5 w-5 text-primary" />}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-lg animate-fade-in">
        <CardHeader className="text-center">
          <CardTitle>{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-2 w-2 rounded-full transition-all ${i <= step ? "bg-primary w-6" : "bg-muted"}`} />
            ))}
          </div>

          {steps[step].content}

          <div className="flex gap-3 pt-4">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} className="flex-1" disabled={step === 0 && !formData.fullName || step === 1 && !formData.goal}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
                {loading ? "Creating your roadmap..." : "Start Learning"} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
