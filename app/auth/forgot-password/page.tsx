"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import { Logo } from "@/components/logo";

const resetSchema = z.object({ email: z.string().email("Please enter a valid email") });
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, formState: { errors } } = useForm<ResetForm>({ resolver: zodResolver(resetSchema) });

  const onSubmit = async (data: ResetForm) => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/auth/login`,
      });
      if (error) throw error;
      setSent(true);
    } catch (error: any) {
      toast({ title: "Failed to send reset email", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary-50 to-background dark:from-background dark:to-primary-900/10">
      <Card className="w-full max-w-md animate-fade-in">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2"><Logo size="lg" /></div>
          <CardTitle>Reset your password</CardTitle>
          <CardDescription>Enter your email and we'll send you a reset link</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="text-center space-y-4">
              <div className="flex justify-center"><Mail className="h-12 w-12 text-primary" /></div>
              <p className="text-muted-foreground">Check your email for the reset link. It may take a few minutes.</p>
              <Link href="/auth/login">
                <Button variant="outline" className="w-full"><ArrowLeft className="mr-2 h-4 w-4" /> Back to login</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" placeholder="you@example.com" {...register("email")} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Reset Link"}
              </Button>
              <Link href="/auth/login" className="flex items-center justify-center text-sm text-primary hover:underline">
                <ArrowLeft className="mr-1 h-4 w-4" /> Back to login
              </Link>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
