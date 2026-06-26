"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Skeleton } from "@/components/ui/skeleton";
import type { Roadmap } from "@/types";

export default function DashboardHome() {
  const { user, xp, streakCount, setActiveRoadmap, setXp } = useStore();
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [weeklyData, setWeeklyData] = useState<{ day: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        const { data: roadmaps } = await supabase
          .from("roadmaps")
          .select("*")
          .eq("user_id", user.id)
          .eq("status", "active")
          .single();

        if (roadmaps) {
          setRoadmap(roadmaps as Roadmap);
          setActiveRoadmap(roadmaps as Roadmap);
          setXp(roadmaps.overall_progress ? Math.round(roadmaps.overall_progress * 10) : xp);

          await supabase
            .from("roadmap_nodes")
            .select("*")
            .eq("roadmap_id", roadmaps.id)
            .order("order_index", { ascending: true });
        }

        const { data: rawProgress } = await supabase
          .from("user_progress")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayCount: Record<string, number> = {};
        weekDays.forEach((d) => { dayCount[d] = 0; });
        (rawProgress || []).forEach((p: any) => {
          const d = new Date(p.created_at);
          const day = weekDays[d.getDay()];
          const since = (Date.now() - d.getTime()) / 86400000;
          if (since <= 7 && dayCount[day] !== undefined) dayCount[day]++;
        });
        setWeeklyData(weekDays.map((d) => ({ day: d, value: dayCount[d] })));
      } catch {}
      setLoading(false);
    };
    fetchData();
  }, [user, setActiveRoadmap, setXp]);

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-4 gap-4">
          {[1,2,3,4].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-[1.4fr_2fr] gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  const goalParse = roadmap?.goal_parse as { targetRole?: string; estimatedMonths?: number } | null;
  const targetRole = goalParse?.targetRole || "Python Developer";
  const estimatedMonths = goalParse?.estimatedMonths || 12;
  const completedMonths = roadmap ? Math.round((roadmap.overall_progress / 100) * estimatedMonths) : 0;
  const progress = roadmap?.overall_progress || 0;
  const totalNodes = roadmap?.total_nodes || 0;
  const completedNodes = roadmap?.completed_nodes || 0;
  const circumference = 2 * Math.PI * 50;
  const offset = circumference - (progress / 100) * circumference;

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const barHeights = weekDays.map((d) => {
    const found = weeklyData.find((w) => w.day === d);
    return found ? Math.max(found.value * 15, 4) : 4;
  });
  const totalWeekly = weeklyData.reduce((s, w) => s + w.value, 0);

  const timelineNodesData = [
    { label: "Python Basics", status: "completed" as const },
    { label: "Control Flow", status: "completed" as const },
    { label: "Functions", status: "completed" as const },
    { label: "OOP", status: "current" as const },
    { label: "Modules", status: "locked" as const },
    { label: "File Handling", status: "locked" as const },
    { label: "Data Structures", status: "locked" as const },
  ];

  return (
    <div>
      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { icon: "fa-regular fa-clock", bg: "bg-[#e0e7ff]", color: "text-[#4f46e5]", label: "Study Time", value: "128h 45m", trend: "↑ 12% this week" },
          { icon: "fa-regular fa-bookmark", bg: "bg-[#dcfce7]", color: "text-[#16a34a]", label: "Lessons Completed", value: `${completedNodes}`, sub: `/ ${totalNodes}`, trend: "↑ 8% this week" },
          { icon: "fa-solid fa-code", bg: "bg-[#ffedd5]", color: "text-[#ea580c]", label: "Projects Completed", value: "4", sub: "/8", trend: "↑ 2 this week" },
          { icon: "fa-solid fa-fire", bg: "bg-[#fee2e2]", color: "text-[#dc2626]", label: "Current Streak", value: `${streakCount} Days`, trend: "Keep it going!" },
        ].map((stat, i) => (
          <div key={i} className="bg-white border border-[#e2e8f0] rounded-xl p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center text-xl shrink-0`}>
              <i className={stat.icon} />
            </div>
            <div>
              <p className="text-xs text-[#64748b]">{stat.label}</p>
              <h3 className="text-xl font-bold">
                {stat.value}
                {stat.sub && <span className="text-sm text-[#64748b] font-normal">{stat.sub}</span>}
              </h3>
              <p className={`text-xs font-medium mt-1 ${i < 3 ? "text-[#22c55e]" : "text-[#64748b]"}`}>
                {stat.trend}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-[1.4fr_2fr] gap-6">
        {/* Left Column */}
        <div className="flex flex-col gap-6">

          {/* Roadmap Progress */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <h3 className="text-base font-semibold mb-5">Your Roadmap Progress</h3>
            <div className="flex items-center gap-8">
              <div className="relative w-[120px] h-[120px] shrink-0">
                <svg className="w-[120px] h-[120px] -rotate-90">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#eef2ff" strokeWidth="10" strokeLinecap="round" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#6366f1" strokeWidth="10" strokeLinecap="round"
                    strokeDasharray={circumference} strokeDashoffset={offset} className="transition-all duration-700" />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <h2 className="text-[22px] font-bold">{Math.round(progress)}%</h2>
                  <p className="text-[10px] text-[#64748b]">Completed</p>
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold mb-1">{targetRole}</h2>
                <p className="text-sm text-[#64748b] mb-3">Your target: {estimatedMonths} Months</p>
                <div className="h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                  <div className="h-full rounded-full bg-[#22c55e]" style={{ width: `${progress}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-[#64748b] mt-1.5">
                  <span>{completedMonths} Months Completed</span>
                  <span>{estimatedMonths - completedMonths} Months Remaining</span>
                </div>
                <a href="/dashboard/roadmap" className="inline-flex items-center gap-2 mt-3.5 bg-[#6366f1] text-white px-[18px] py-2.5 rounded-lg text-sm font-medium no-underline">
                  View Full Roadmap <i className="fa-solid fa-arrow-right text-xs" />
                </a>
              </div>
            </div>
          </div>

          {/* Today's Plan */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <h3 className="text-base font-semibold">Today's Plan</h3>
                <span className="text-xs text-[#64748b]"><i className="fa-regular fa-calendar mr-1" />{new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              {[
                { badge: "20 min", badgeClass: "bg-[#eef2ff] text-[#6366f1]", title: "Functions in Python", meta: "Learn", completed: true },
                { badge: "30 min", badgeClass: "bg-[#fefce8] text-[#a16207]", title: "Practice: Functions Exercises", meta: "Practice", completed: false },
                { badge: "20 min", badgeClass: "bg-[#f0fdf4] text-[#22c55e]", title: "Mini Project: Tip Calculator", meta: "Project", completed: false },
              ].map((task, i) => (
                <div key={i} className="flex items-center p-3.5 rounded-xl border border-[#e2e8f0]">
                  <div className={`w-[50px] text-center text-xs font-bold mr-4 py-1 rounded-md ${task.badgeClass}`}>
                    {task.badge}
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold mb-0.5">{task.title}</h4>
                    <p className="text-xs text-[#64748b]">{task.meta}</p>
                  </div>
                  <div className={task.completed ? "text-[#22c55e]" : "text-[#64748b]"}>
                    <i className={task.completed ? "fa-solid fa-circle-check text-lg" : "fa-regular fa-circle-right text-lg"} />
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-4">
              <a href="/dashboard/planner" className="text-sm text-[#6366f1] font-semibold no-underline">
                View Full Plan <i className="fa-solid fa-arrow-right text-[11px]" />
              </a>
            </div>
          </div>

        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">

          {/* Skills Overview */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-base font-semibold">Skills Overview</h3>
              <a href="/dashboard/progress" className="text-sm text-[#6366f1] font-medium no-underline">View All</a>
            </div>
            <div className="flex flex-col gap-3.5">
              {[
                { name: "Python Basics", pct: 92, color: "bg-[#22c55e]" },
                { name: "Functions", pct: 85, color: "bg-[#22c55e]" },
                { name: "Data Structures", pct: 70, color: "bg-[#22c55e]" },
                { name: "OOP", pct: 45, color: "bg-[#eab308]" },
                { name: "File Handling", pct: 35, color: "bg-[#ef4444]" },
                { name: "Modules & Packages", pct: 20, color: "bg-[#ef4444]" },
              ].map((skill, i) => (
                <div key={i} className="flex flex-col gap-1.5">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{skill.name}</span>
                    <span style={{ color: skill.pct >= 60 ? "#22c55e" : skill.pct >= 40 ? "#eab308" : "#ef4444" }}>{skill.pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f1f5f9] overflow-hidden">
                    <div className={`h-full rounded-full ${skill.color}`} style={{ width: `${skill.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4.5 bg-[#fefce8] border border-[rgba(234,179,8,0.2)] rounded-lg p-3 flex gap-2.5 text-xs leading-relaxed">
              <i className="fa-solid fa-lightbulb text-[#eab308] text-base mt-0.5" />
              <div>
                <strong>Focus on OOP:</strong> Strengthen this specific area to unlock advanced next-stage learning path topics seamlessly.
              </div>
            </div>
          </div>

          {/* AI Coach */}
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6 flex flex-col items-center text-center">
            <div className="flex items-center gap-2 mb-3 self-start">
              <h3 className="text-base font-semibold">AI Coach</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#eef2ff] text-[#6366f1] uppercase">Beta</span>
            </div>
            <div className="my-4">
              <div className="w-[70px] h-[70px] rounded-full bg-gradient-to-br from-[#e0e7ff] to-[#c7d2fe] flex items-center justify-center text-3xl text-[#6366f1]">
                <i className="fa-solid fa-robot" />
              </div>
            </div>
            <div className="bg-[#f1f5f9] rounded-xl p-3.5 text-sm leading-relaxed text-left mb-5 w-full">
              Hi Arjun! I analyzed your path progress. You&apos;re doing stellar! But I noticed OOP concepts need practice. Shall I suggest tailored learning resources?
            </div>
            <div className="flex gap-2.5 w-full">
              <button className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-[#6366f1] text-white border-none cursor-pointer">
                Yes, suggest
              </button>
              <button className="flex-1 py-2.5 rounded-lg text-sm font-medium bg-white text-[#64748b] border border-[#e2e8f0] cursor-pointer">
                Not now
              </button>
            </div>
          </div>

        </div>

        {/* Timeline - Full Width */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6" style={{ gridColumn: "span 2" }}>
          <h3 className="text-base font-semibold mb-5">Roadmap Timeline</h3>
          <div className="flex items-center justify-between">
            <button className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b] cursor-pointer shrink-0">
              <i className="fa-solid fa-chevron-left text-xs" />
            </button>
            <div className="flex justify-between flex-1 mx-4 relative">
              <div className="absolute top-5 left-0 right-0 h-1 bg-[#e2e8f0] z-0" />
              {timelineNodesData.map((node, i) => {
                const isCompleted = node.status === "completed";
                const isCurrent = node.status === "current";
                return (
                  <div key={i} className="relative z-10 flex flex-col items-center text-center w-20">
                    <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center text-sm font-semibold mb-2 transition-all ${
                      isCompleted ? "border-[#22c55e] bg-[#f0fdf4] text-[#22c55e]" :
                      isCurrent ? "border-[#6366f1] bg-[#eef2ff] text-[#6366f1] shadow-[0_0_0_4px_rgba(99,102,241,0.2)]" :
                      "border-[#cbd5e1] bg-white text-[#64748b]"
                    }`}>
                      {isCompleted ? <i className="fa-solid fa-check" /> : isCurrent ? <i className="fa-solid fa-circle" /> : i + 1}
                    </div>
                    <div className="text-[11px] font-semibold mb-0.5">{node.label}</div>
                    <div className={`text-[10px] ${
                      isCurrent ? "text-[#6366f1] font-semibold" : "text-[#64748b]"
                    }`}>
                      {isCompleted ? "Completed" : isCurrent ? "In Progress" : "Locked"}
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="w-8 h-8 rounded-full bg-white border border-[#e2e8f0] flex items-center justify-center text-[#64748b] cursor-pointer shrink-0">
              <i className="fa-solid fa-chevron-right text-xs" />
            </button>
          </div>
        </div>

        {/* Weekly Goal + Chart */}
        <div className="grid grid-cols-[1fr_1.2fr] gap-6" style={{ gridColumn: "span 2" }}>
          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold">Weekly Goal</h3>
              <a href="/dashboard/settings" className="text-sm text-[#6366f1] font-medium no-underline">Edit</a>
            </div>
            <p className="text-sm font-medium mb-2">Study 10 hours this week</p>
            <div className="h-3 rounded-full bg-[#f1f5f9] overflow-hidden mt-3">
              <div className="h-full rounded-full bg-[#22c55e]" style={{ width: "62%" }} />
            </div>
            <div className="text-sm font-semibold text-right mt-2 text-[#64748b]">6.2 / 10 hours</div>
          </div>

          <div className="bg-white border border-[#e2e8f0] rounded-xl p-6">
            <h3 className="text-base font-semibold mb-4">This Week's Progress</h3>
            <div className="flex items-end justify-between h-[120px] pt-5">
              {weekDays.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-2 flex-1">
                  <div className="w-[14px] bg-[#6366f1] rounded-t" style={{ height: `${barHeights[i]}px` }} />
                  <span className="text-[11px] text-[#64748b] font-medium">{day}</span>
                </div>
              ))}
              <div className="border-l border-[#e2e8f0] pl-5 ml-2.5 flex flex-col justify-center">
                <h3 className="text-lg font-bold">{totalWeekly}h</h3>
                <p className="text-[11px] text-[#64748b]">Total Study Time</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recommended Resources */}
        <div className="bg-white border border-[#e2e8f0] rounded-xl p-6" style={{ gridColumn: "span 2" }}>
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-semibold">Recommended for You</h3>
            <a href="/dashboard/resources" className="text-sm text-[#6366f1] font-medium no-underline">View All</a>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { thumb: "yt", icon: "fa-brands fa-youtube", title: "Object Oriented Programming in Python - Full Course", source: "YouTube", duration: "2h 15m" },
              { thumb: "fcc", icon: "fa-solid fa-code", title: "Python OOP Tutorial for Beginners", source: "freeCodeCamp", duration: "1h 30m" },
              { thumb: "blog", icon: "fa-regular fa-newspaper", title: "Hands-on OOP Exercises (With Solutions)", source: "Blog", duration: "45 min read" },
            ].map((res, i) => (
              <div key={i} className="flex items-center gap-3.5 p-3 rounded-xl border border-[#e2e8f0]">
                <div className={`w-[50px] h-[50px] rounded-md flex items-center justify-center text-white text-xl shrink-0 ${
                  res.thumb === "yt" ? "bg-[#ef4444]" : res.thumb === "fcc" ? "bg-[#0a0a23]" : "bg-[#3b82f6]"
                }`}>
                  <i className={res.icon} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold mb-0.5 truncate">{res.title}</h4>
                  <div className="text-[11px] text-[#64748b] flex gap-2.5">
                    <span>{res.source}</span>
                    <span>•</span>
                    <span>{res.duration}</span>
                  </div>
                </div>
                <div className="text-[#64748b] cursor-pointer">
                  <i className="fa-regular fa-bookmark" />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
