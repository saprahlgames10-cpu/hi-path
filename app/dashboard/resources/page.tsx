"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useStore } from "@/store/useStore";
import { Search, ExternalLink, Video, BookOpen, FileText, Globe2, Star, TrendingUp, Loader2, Sparkles, Filter } from "lucide-react";

export default function ResourcesPage() {
  const { activeRoadmap } = useStore();
  const [topic, setTopic] = useState(activeRoadmap?.goal_description?.split(" ").slice(0, 3).join(" ") || "");
  const [resources, setResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterFree, setFilterFree] = useState(false);

  const searchResources = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch("/api/resources/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          skillLevel: activeRoadmap?.skill_level || "beginner",
          learningStyle: activeRoadmap?.learning_style || "mixed",
          maxResults: 12,
        }),
      });
      const data = await res.json();
      if (!data.error) setResources(data.resources || []);
    } catch {} finally { setLoading(false); }
  };

  const typeIcons: Record<string, any> = { video: Video, article: FileText, book: BookOpen, course: Globe2, documentation: FileText };
  const typeColors: Record<string, string> = { video: "bg-red-500/10 text-red-500", article: "bg-blue-500/10 text-blue-500", book: "bg-green-500/10 text-green-500", course: "bg-purple-500/10 text-purple-500", documentation: "bg-orange-500/10 text-orange-500" };

  let filtered = resources;
  if (filterType) filtered = filtered.filter((r) => r.type === filterType);
  if (filterFree) filtered = filtered.filter((r) => r.is_free);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Resource Finder</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Find the best learning resources for any topic</p>
      </div>

      <Card className="border-primary/10 bg-gradient-to-br from-primary/[0.02] to-transparent">
        <CardContent className="p-5">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="e.g., Python Functions, Machine Learning, APIs..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchResources()}
                className="pl-9 h-11 rounded-xl bg-muted/50 border-border"
              />
            </div>
            <Button onClick={searchResources} disabled={loading || !topic.trim()} className="rounded-xl h-11 gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Searching..." : "Find Resources"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {searched && resources.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground">Filter:</span>
          {["video", "article", "book", "course", "documentation"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(filterType === type ? null : type)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all capitalize ${
                filterType === type ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
              }`}
            >
              {type}
            </button>
          ))}
          <button
            onClick={() => setFilterFree(!filterFree)}
            className={`text-xs px-2.5 py-1 rounded-full border transition-all ${
              filterFree ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
            }`}
          >
            Free only
          </button>
          <span className="text-xs text-muted-foreground ml-auto">{filtered.length} results</span>
        </div>
      )}

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      )}

      {!loading && searched && filtered.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <h3 className="font-medium mb-1">No results found</h3>
            <p className="text-sm text-muted-foreground">Try a different topic or remove filters</p>
          </CardContent>
        </Card>
      )}

      {!loading && filtered.length > 0 && (
        <div className="space-y-3">
          {filtered.map((resource, i) => {
            const Icon = typeIcons[resource.type] || Globe2;
            const colorClass = typeColors[resource.type] || "bg-primary/10 text-primary";
            const score = Math.round((resource.quality || 5) * (resource.beginnerFriendly || 5) / 10);

            return (
              <Card key={i} className="hover:border-primary/30 transition-all group">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2.5 rounded-xl ${colorClass} shrink-0`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{resource.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{resource.platform} · {resource.duration}</p>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                          <span className="text-xs font-medium">{score}/10</span>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{resource.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex flex-wrap gap-1.5">
                          <Badge variant="outline" className="text-[10px] capitalize">{resource.type}</Badge>
                          {resource.is_free && <Badge variant="secondary" className="text-[10px]">Free</Badge>}
                          <Badge variant="outline" className="text-[10px] flex items-center gap-0.5">
                            <TrendingUp className="h-2.5 w-2.5" /> {resource.popularity}/10
                          </Badge>
                        </div>
                        <a href={resource.url} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          Open <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      {resource.why_recommended && (
                        <p className="text-xs text-primary/60 mt-2 italic border-t border-border pt-2">
                          &ldquo;{resource.why_recommended}&rdquo;
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && !searched && (
        <div className="text-center py-16">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-medium mb-1">Search for learning resources</h3>
          <p className="text-sm text-muted-foreground">Enter a topic above to find curated YouTube videos, articles, books, and courses</p>
        </div>
      )}
    </div>
  );
}
