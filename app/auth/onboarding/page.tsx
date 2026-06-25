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
import { ArrowRight, ArrowLeft, BookOpen, Eye, Headphones, Pen, Check, Sparkles, Loader2, Target, Clock, Brain } from "lucide-react";
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

const goalPresets = [
  { title: "Python Developer", desc: "Build apps with Python" },
  { title: "AI Engineer", desc: "Machine learning & AI" },
  { title: "Data Analyst", desc: "Analyze data & insights" },
  { title: "Web Developer", desc: "Build websites & apps" },
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

      const { data: newRoadmap, error: roadmapError } = await supabase.from("roadmaps").insert({
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
      }).select().single();

      if (roadmapError) throw roadmapError;

      toast({ title: "Profile saved!", description: "AI is generating your personalized roadmap..." });

      if (newRoadmap) {
        fetch("/api/roadmap/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ roadmapId: newRoadmap.id }),
        }).catch(() => {});
      }

      router.push("/dashboard");
    } catch (error: any) {
      toast({ title: "Something went wrong", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    {
      icon: Target,
      title: "What's your name?",
      desc: "Let us get to know you",
      content: (
        <div className="space-y-5">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Name</Label>
            <Input
              placeholder="Enter your full name"
              value={formData.fullName}
              onChange={(e) => update("fullName", e.target.value)}
              className="h-11 rounded-xl bg-muted/50 border-border focus-visible:ring-primary/30"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Timezone</Label>
            <Input
              value={formData.timezone}
              onChange={(e) => update("timezone", e.target.value)}
              className="h-11 rounded-xl bg-muted/50 border-border focus-visible:ring-primary/30"
            />
          </div>
        </div>
      ),
    },
    {
      icon: Brain,
      title: "What do you want to learn?",
      desc: "Describe your learning goal or pick one below",
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {goalPresets.map((preset) => (
              <button
                key={preset.title}
                type="button"
                onClick={() => {
                  update("goal", preset.title);
                  setGoalParse(null);
                }}
                className={`p-3 rounded-xl border text-left transition-all text-sm ${
                  formData.goal === preset.title
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <div className="font-medium">{preset.title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{preset.desc}</div>
              </button>
            ))}
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">or write your own</span>
            </div>
          </div>
          <textarea
            className="flex min-h-[80px] w-full rounded-xl border border-border bg-muted/50 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            placeholder="e.g., Become a Python developer and build web apps..."
            value={formData.goal}
            onChange={(e) => { update("goal", e.target.value); setGoalParse(null); }}
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="w-full gap-1.5 rounded-xl"
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
            {parsing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {parsing ? "Analyzing..." : "AI Analyze Goal"}
          </Button>
          {goalParse && (
            <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{goalParse.targetRole}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary/10 font-medium capitalize">{goalParse.seniority}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {goalParse.requiredSkills.map((s: string) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border">{s}</span>
                ))}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground pt-1 border-t border-primary/10">
                <span>{goalParse.industry}</span>
                <span>~{goalParse.estimatedMonths} months</span>
                <span className="capitalize">{goalParse.marketDemand} demand</span>
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Experience Level</Label>
            <div className="grid grid-cols-3 gap-2">
              {skillLevels.map((sl) => (
                <button
                  key={sl.value}
                  type="button"
                  onClick={() => update("skillLevel", sl.value)}
                  className={`p-3 rounded-xl border text-sm text-left transition-all ${
                    formData.skillLevel === sl.value ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <div className="font-medium">{sl.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{sl.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Clock,
      title: "Your schedule",
      desc: "How much time can you dedicate?",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label className="text-sm font-medium">Hours per week</Label>
              <span className="text-2xl font-bold text-primary">{formData.hoursPerWeek}h</span>
            </div>
            <Slider min={1} max={40} step={1} value={[formData.hoursPerWeek]} onValueChange={([v]) => update("hoursPerWeek", v)} />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Casual (1h)</span>
              <span>Full-time (40h)</span>
            </div>
          </div>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Target Duration</Label>
            <div className="grid grid-cols-3 gap-2">
              {durations.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => { update("durationWeeks", d.value); update("durationLabel", d.label); }}
                  className={`p-3 rounded-xl border text-sm text-center transition-all ${
                    formData.durationWeeks === d.value ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Custom (weeks)</Label>
              <Input
                type="number"
                min={1}
                max={208}
                value={formData.durationWeeks}
                onChange={(e) => update("durationWeeks", parseInt(e.target.value) || 52)}
                className="h-10 rounded-xl bg-muted/50 border-border"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      icon: Brain,
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
                className={`w-full p-4 rounded-xl border text-left transition-all flex items-center gap-4 ${
                  formData.learningStyle === ls.value
                    ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                    : "border-border hover:border-primary/30 hover:bg-muted/50"
                }`}
              >
                <div className={`p-2.5 rounded-xl transition-all ${
                  formData.learningStyle === ls.value ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                }`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{ls.label}</div>
                  <div className="text-sm text-muted-foreground">{ls.desc}</div>
                </div>
                {formData.learningStyle === ls.value && (
                  <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-grid">
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      <Card className="w-full max-w-lg animate-fade-in border-border/50 shadow-xl relative">
        <CardHeader className="text-center pb-2">
          <div className="p-2.5 rounded-xl bg-primary/10 w-fit mx-auto mb-3">
            {steps[step].icon && (() => { const Icon = steps[step].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
          </div>
          <CardTitle className="text-xl">{steps[step].title}</CardTitle>
          <CardDescription>{steps[step].desc}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i <= step ? "bg-primary" : i === step + 1 ? "bg-muted w-3" : "bg-muted"
                } ${i <= step ? "w-6" : "w-1.5"}`}
              />
            ))}
          </div>

          <div className="animate-fade-in" key={step}>
            {steps[step].content}
          </div>

          <div className="flex gap-3 pt-2">
            {step > 0 && (
              <Button variant="outline" onClick={handleBack} className="flex-1 rounded-xl h-11">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button
                onClick={handleNext}
                className="flex-1 rounded-xl h-11"
                disabled={step === 0 && !formData.fullName || step === 1 && !formData.goal}
              >
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1 rounded-xl h-11 gap-2" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Creating your roadmap...</>
                ) : (
                  <><Sparkles className="h-4 w-4" /> Start Learning</>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
