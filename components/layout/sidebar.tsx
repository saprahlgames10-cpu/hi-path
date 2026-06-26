"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/useStore";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  LayoutDashboard, Map, BarChart3, HelpCircle, Target, Settings, MessageSquare,
  X, LogOut, Trophy, BookOpen, Flame, Users, BookmarkCheck, Layers,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/roadmap", icon: Map, label: "My Roadmap" },
  { href: "/dashboard/planner", icon: Target, label: "Daily Plan" },
  { href: "/dashboard/learn", icon: BookOpen, label: "Learn" },
  { href: "/dashboard/projects", icon: Layers, label: "Projects" },
  { href: "/dashboard/quizzes", icon: HelpCircle, label: "Quizzes" },
  { href: "/dashboard/progress", icon: BarChart3, label: "Progress" },
  { href: "/dashboard/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/dashboard/chat", icon: MessageSquare, label: "AI Coach" },
  { href: "/dashboard/community", icon: Users, label: "Community" },
  { href: "/dashboard/achievements", icon: Trophy, label: "Achievements" },
  { href: "/dashboard/resources", icon: BookmarkCheck, label: "Resources" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
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
        "fixed top-0 left-0 z-50 h-full w-64 bg-card border-r border-border transform transition-transform duration-200 lg:translate-x-0 lg:static lg:z-auto",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <Link href="/dashboard"><Logo size="md" /></Link>
            <button onClick={onClose} className="lg:hidden"><X className="h-5 w-5" /></button>
          </div>
          <ScrollArea className="flex-1 py-2">
            <nav className="space-y-1 px-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                return (
                  <Link key={item.href} href={item.href} onClick={onClose}>
                    <div className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                      active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}>
                      <Icon className="h-5 w-5 shrink-0" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
            </nav>
          </ScrollArea>
          <div className="p-4 border-t border-border space-y-3">
            <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-orange-500/10 to-orange-500/5">
              <Flame className="h-5 w-5 text-orange-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold">Study Streak</p>
                <p className="text-lg font-bold text-orange-500">{streakCount} Days</p>
              </div>
            </div>
            <Progress value={Math.min((streakCount / 30) * 100, 100)} className="h-1.5" />
            <Button variant="ghost" className="w-full justify-start text-muted-foreground text-sm" onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
