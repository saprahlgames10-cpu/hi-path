import Link from "next/link";
import { ArrowRight, Sparkles, Brain, Target, Zap, BarChart3, MessageSquare, Quote, Check } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-primary">HiPath</span>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">Sign In</Link>
            <Link href="/auth/signup" className="text-sm px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary-600">Get Started Free</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <Sparkles className="h-3 w-3" /> AI-Powered Learning
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Stop guessing what to learn next.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            HiPath creates personalized, adaptive learning roadmaps powered by AI. Set your goal, and let our AI build your perfect path.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth/signup">
              <button className="px-8 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-600 transition-colors shadow-lg shadow-primary/25 flex items-center gap-2">
                Start Learning Free <ArrowRight className="h-4 w-4" />
              </button>
            </Link>
            <button className="px-8 py-3 rounded-xl border border-border font-medium hover:bg-muted transition-colors">
              See How It Works
            </button>
          </div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Learning without direction is hard</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Brain, title: "Overwhelmed", desc: "Too many resources, no clear starting point" },
              { icon: Target, title: "No Structure", desc: "Jumping between topics without a logical progression" },
              { icon: BarChart3, title: "No Feedback", desc: "No way to know what you're weak at" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="text-center p-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">How HiPath Works</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "1", title: "Set Your Goal", desc: "Tell us what you want to learn" },
              { step: "2", title: "AI Builds Your Path", desc: "Our AI creates a structured roadmap" },
              { step: "3", title: "Learn & Track", desc: "Follow nodes, take quizzes, earn XP" },
              { step: "4", title: "AI Adapts", desc: "Your roadmap evolves with your progress" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Everything you need to learn effectively</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "AI Roadmap Generator", desc: "Personalized learning paths generated in seconds" },
              { icon: Brain, title: "Quiz Engine", desc: "AI-generated quizzes to test your knowledge" },
              { icon: Target, title: "Weakness Detector", desc: "Identifies gaps and reinforces weak areas" },
              { icon: Zap, title: "XP Gamification", desc: "Earn XP, level up, unlock achievements" },
              { icon: BarChart3, title: "Progress Tracking", desc: "Visual charts showing your learning journey" },
              { icon: MessageSquare, title: "AI Learning Coach", desc: "Chat with PathForge AI for help anytime" },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="p-6 rounded-xl border border-border hover:border-primary/30 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Loved by learners</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: "Sarah K.", role: "Career Switcher", text: "HiPath helped me transition from marketing to web development in 6 months. The AI roadmap kept me on track." },
              { name: "James R.", role: "Computer Science Student", text: "The weakness detection is incredible. It caught gaps I didn't know I had." },
              { name: "Maria L.", role: "Self-Learner", text: "Finally, a tool that actually adapts to my pace. The daily goals keep me motivated." },
            ].map((t) => (
              <div key={t.name} className="p-6 rounded-xl border border-border bg-card">
                <Quote className="h-6 w-6 text-primary/30 mb-3" />
                <p className="text-sm text-muted-foreground mb-4">{t.text}</p>
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Free Forever</h2>
          <p className="text-muted-foreground mb-8">All features included. No credit card required.</p>
          <div className="max-w-md mx-auto p-8 rounded-2xl border-2 border-primary bg-card">
            <div className="text-5xl font-bold text-primary mb-2">$0</div>
            <p className="text-muted-foreground mb-6">per month</p>
            <ul className="text-left space-y-3 mb-8">
              {["Unlimited roadmaps", "AI-generated quizzes", "Weakness detection", "Daily goals", "Progress tracking", "AI chat coach", "All achievements"].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary flex-shrink-0" /> {f}
                </li>
              ))}
            </ul>
            <Link href="/auth/signup">
              <button className="w-full px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-600 transition-colors">
                Get Started Free
              </button>
            </Link>
            <p className="text-xs text-muted-foreground mt-3">Powered by free open-source AI models</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
          <div className="space-y-4">
            {[
              { q: "How does HiPath create my roadmap?", a: "You tell us your learning goal, skill level, and available time. Our AI generates a structured, step-by-step roadmap with phases, nodes, and resources tailored to you." },
              { q: "Is HiPath really free?", a: "Yes! HiPath is completely free. We use free open-source AI models to keep costs at zero." },
              { q: "Can I change my roadmap after it's created?", a: "Absolutely. You can regenerate your roadmap with new parameters anytime. The AI adapts to your progress." },
              { q: "How does weakness detection work?", a: "After you complete nodes and quizzes, our AI analyzes your performance to identify topics you struggle with and suggests reinforcement." },
              { q: "What kind of learning goals work best?", a: "Any structured learning goal! From 'Learn Python' to 'Become a data scientist' to 'Master guitar basics'." },
            ].map((faq, i) => (
              <details key={i} className="p-4 rounded-xl border border-border bg-card">
                <summary className="font-medium cursor-pointer">{faq.q}</summary>
                <p className="text-sm text-muted-foreground mt-2">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-lg font-bold text-primary">HiPath</span>
          <p className="text-sm text-muted-foreground">Built with free open-source AI models. Your AI co-pilot for learning anything.</p>
          <div className="flex gap-4 text-sm text-muted-foreground">
            <Link href="/auth/login" className="hover:text-foreground">Sign In</Link>
            <Link href="/auth/signup" className="hover:text-foreground">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
