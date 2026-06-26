"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

const navItems = [
  { href: "/dashboard", icon: "chart-pie", label: "Dashboard" },
  { href: "/dashboard/roadmap", icon: "map-signs", label: "My Roadmap" },
  { href: "/dashboard/planner", icon: "calendar-day", label: "Daily Plan" },
  { href: "/dashboard/learn", icon: "graduation-cap", label: "Learn" },
  { href: "/dashboard/projects", icon: "code", label: "Projects" },
  { href: "/dashboard/quizzes", icon: "lightbulb", label: "Quizzes" },
  { href: "/dashboard/progress", icon: "spinner", label: "Progress" },
  { href: "/dashboard/analytics", icon: "chart-line", label: "Analytics" },
  { href: "/dashboard/chat", icon: "robot", label: "AI Coach" },
  { href: "/dashboard/community", icon: "users", label: "Community" },
  { href: "/dashboard/achievements", icon: "award", label: "Achievements" },
  { href: "/dashboard/resources", icon: "folder-open", label: "Resources" },
  { href: "/dashboard/settings", icon: "gear", label: "Settings" },
];

export function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { streakCount } = useStore();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-full w-[260px] bg-[#0f172a] text-white flex flex-col py-6 px-4 transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-3 pl-3 mb-8">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#818cf8] to-[#6366f1] flex items-center justify-center text-lg shrink-0">
            <i className="fa-solid fa-route" />
          </div>
          <span className="text-xl font-bold tracking-tight">Hi-Path</span>
          <button onClick={onClose} className="lg:hidden ml-auto text-white/60"><i className="fa-solid fa-xmark text-xl" /></button>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => {
            const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
            return (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <div className={cn(
                  "flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium transition-all",
                  active ? "bg-[#6366f1] text-white" : "text-[#94a3b8] hover:text-white hover:bg-white/5"
                )}>
                  <i className={cn("fa-solid fa-fw", `fa-${item.icon}`)} />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto rounded-xl bg-white/5 border border-white/10 p-4">
          <div className="flex justify-between items-center mb-2 text-sm text-[#cbd5e1]">
            <span>Study Streak</span>
            <i className="fa-solid fa-fire text-[#f97316]" />
          </div>
          <div className="text-xl font-bold mb-2 flex items-center gap-1.5">
            {streakCount} Days
          </div>
          <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full rounded-full bg-[#6366f1]" style={{ width: `${Math.min((streakCount / 30) * 100, 100)}%` }} />
          </div>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-3 flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-medium text-[#94a3b8] hover:text-white hover:bg-white/5 transition-all w-full"
        >
          <i className="fa-solid fa-fw fa-right-from-bracket" />
          <span>Sign Out</span>
        </button>
      </aside>
    </>
  );
}
