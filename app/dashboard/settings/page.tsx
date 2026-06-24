"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useStore } from "@/store/useStore";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/theme-provider";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Moon, Trash2 } from "lucide-react";

export default function SettingsPage() {
  const { user, setUser } = useStore();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [hoursPerWeek, setHoursPerWeek] = useState(user?.total_xp ? 10 : 10);
  const [learningStyle, setLearningStyle] = useState("mixed");
  const [timezone, setTimezone] = useState(user?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);

  const updateEmail = async () => {
    if (!email) return;
    const { error } = await supabase.auth.updateUser({ email });
    if (error) toast({ title: "Failed to update email", description: error.message, variant: "destructive" });
    else toast({ title: "Check your email to confirm the change" });
  };

  const updatePassword = async () => {
    if (password.length < 6) { toast({ title: "Password must be at least 6 characters", variant: "destructive" }); return; }
    const { error } = await supabase.auth.updateUser({ password });
    if (error) toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    else { toast({ title: "Password updated!" }); setPassword(""); }
  };

  const deleteAccount = async () => {
    if (!confirm("Are you sure you want to delete your account? This cannot be undone.")) return;
    const { error } = await supabase.rpc("delete_user");
    if (error) toast({ title: "Failed to delete account", description: error.message, variant: "destructive" });
    else {
      await supabase.auth.signOut();
      router.push("/");
    }
  };

  const updateProfile = async () => {
    const { error } = await supabase
      .from("users_profile")
      .update({ timezone, bio: "" })
      .eq("id", user?.id);
    if (error) toast({ title: "Failed to update", variant: "destructive" });
    else toast({ title: "Settings saved!" });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold">Settings</h1>

      <Tabs defaultValue="account">
        <TabsList>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="preferences">Learning</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Email</CardTitle><CardDescription>Change your email address</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="New email address" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button onClick={updateEmail}>Update Email</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Password</CardTitle><CardDescription>Change your password</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <Input type="password" placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} />
              <Button onClick={updatePassword}>Update Password</Button>
            </CardContent>
          </Card>

          <Card className="border-red-500/20">
            <CardHeader>
              <CardTitle className="text-lg text-red-500">Danger Zone</CardTitle>
              <CardDescription>Permanently delete your account and all data</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={deleteAccount}>
                <Trash2 className="mr-2 h-4 w-4" /> Delete Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Learning Preferences</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Hours per week: {hoursPerWeek}h</Label>
                <Slider min={1} max={40} step={1} value={[hoursPerWeek]} onValueChange={([v]) => setHoursPerWeek(v)} />
              </div>
              <div className="space-y-2">
                <Label>Learning Style</Label>
                <Select value={learningStyle} onValueChange={setLearningStyle}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="visual">Visual</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="hands-on">Hands-on</SelectItem>
                    <SelectItem value="mixed">Mixed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
              <Button onClick={updateProfile}>Save Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4 mt-4">
          <Card>
            <CardHeader><CardTitle className="text-lg">Theme</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span className="text-sm">Light Mode</span>
                </div>
                <Switch
                  checked={theme === "dark"}
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                />
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span className="text-sm">Dark Mode</span>
                </div>
              </div>
              <Separator />
              <Button variant="outline" onClick={() => setTheme("system")}>Use System Preference</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
