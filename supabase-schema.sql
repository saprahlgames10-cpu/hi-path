-- HiPath Supabase Database Schema
-- Run this in the Supabase SQL Editor

-- Users Profile
CREATE TABLE IF NOT EXISTS users_profile (
  id uuid REFERENCES auth.users PRIMARY KEY,
  full_name text,
  avatar_url text,
  bio text,
  timezone text,
  streak_count int DEFAULT 0,
  total_xp int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Roadmaps
CREATE TABLE IF NOT EXISTS roadmaps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  title text NOT NULL,
  goal_description text,
  duration_weeks int,
  skill_level text,
  learning_style text,
  hours_per_week int,
  status text DEFAULT 'active',
  ai_summary text,
  total_nodes int DEFAULT 0,
  completed_nodes int DEFAULT 0,
  overall_progress float DEFAULT 0.0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Roadmap Phases
CREATE TABLE IF NOT EXISTS roadmap_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  roadmap_id uuid REFERENCES roadmaps NOT NULL,
  phase_number int,
  title text,
  description text,
  duration_weeks int,
  order_index int,
  status text DEFAULT 'locked',
  created_at timestamptz DEFAULT now()
);

-- Roadmap Nodes
CREATE TABLE IF NOT EXISTS roadmap_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid REFERENCES roadmap_phases NOT NULL,
  roadmap_id uuid REFERENCES roadmaps NOT NULL,
  user_id uuid REFERENCES users_profile NOT NULL,
  title text NOT NULL,
  description text,
  node_type text,
  difficulty text,
  estimated_hours float,
  order_index int,
  status text DEFAULT 'locked',
  xp_reward int DEFAULT 50,
  ai_explanation text,
  resources jsonb DEFAULT '[]',
  prerequisites uuid[] DEFAULT '{}',
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- User Progress
CREATE TABLE IF NOT EXISTS user_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  node_id uuid REFERENCES roadmap_nodes NOT NULL,
  roadmap_id uuid REFERENCES roadmaps NOT NULL,
  status text DEFAULT 'started',
  time_spent_minutes int DEFAULT 0,
  notes text,
  confidence_level int,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Quiz Sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  node_id uuid REFERENCES roadmap_nodes NOT NULL,
  roadmap_id uuid REFERENCES roadmaps NOT NULL,
  questions jsonb DEFAULT '[]',
  user_answers jsonb DEFAULT '[]',
  score float DEFAULT 0,
  passed boolean DEFAULT false,
  time_taken_seconds int DEFAULT 0,
  ai_feedback text,
  created_at timestamptz DEFAULT now()
);

-- Weakness Reports
CREATE TABLE IF NOT EXISTS weakness_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  roadmap_id uuid REFERENCES roadmaps NOT NULL,
  weak_topics jsonb DEFAULT '[]',
  strong_topics jsonb DEFAULT '[]',
  ai_analysis text,
  recommendations jsonb DEFAULT '[]',
  generated_at timestamptz DEFAULT now()
);

-- Daily Goals
CREATE TABLE IF NOT EXISTS daily_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  roadmap_id uuid REFERENCES roadmaps NOT NULL,
  date date NOT NULL,
  goal_description text,
  target_nodes uuid[] DEFAULT '{}',
  completed boolean DEFAULT false,
  xp_earned int DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  type text,
  title text,
  message text,
  read boolean DEFAULT false,
  action_url text,
  created_at timestamptz DEFAULT now()
);

-- Achievements
CREATE TABLE IF NOT EXISTS achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  icon text,
  xp_reward int DEFAULT 0,
  condition_type text
);

-- User Achievements
CREATE TABLE IF NOT EXISTS user_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  achievement_id uuid REFERENCES achievements NOT NULL,
  earned_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE roadmap_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE weakness_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see their own data
CREATE POLICY "Users can view own profile" ON users_profile FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users_profile FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users_profile FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own roadmaps" ON roadmaps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roadmaps" ON roadmaps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roadmaps" ON roadmaps FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own phases" ON roadmap_phases FOR SELECT USING (EXISTS (SELECT 1 FROM roadmaps WHERE roadmaps.id = roadmap_phases.roadmap_id AND roadmaps.user_id = auth.uid()));
CREATE POLICY "Users can insert phases" ON roadmap_phases FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM roadmaps WHERE roadmaps.id = roadmap_phases.roadmap_id AND roadmaps.user_id = auth.uid()));

CREATE POLICY "Users can view own nodes" ON roadmap_nodes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own nodes" ON roadmap_nodes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own nodes" ON roadmap_nodes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own quizzes" ON quiz_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own quizzes" ON quiz_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own quizzes" ON quiz_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own weakness reports" ON weakness_reports FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weakness reports" ON weakness_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own goals" ON daily_goals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON daily_goals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON daily_goals FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view achievements" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can view own user achievements" ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Seed achievements
INSERT INTO achievements (name, description, icon, xp_reward, condition_type) VALUES
  ('First Step', 'Complete your first node', '🎯', 50, 'nodes_completed'),
  ('On a Roll', '7-day streak', '🔥', 200, 'streak'),
  ('Quiz Master', '5 perfect quizzes', '📝', 300, 'nodes_completed'),
  ('Phase Conqueror', 'Complete your first phase', '🏆', 500, 'nodes_completed'),
  ('Consistent Learner', '30-day streak', '💪', 1000, 'streak'),
  ('Roadmap Champion', 'Complete an entire roadmap', '👑', 2000, 'roadmaps_completed'),
  ('Speed Runner', 'Complete 5 nodes in one day', '⚡', 150, 'nodes_completed')
ON CONFLICT DO NOTHING;

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_profile_updated_at BEFORE UPDATE ON users_profile FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER roadmaps_updated_at BEFORE UPDATE ON roadmaps FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER user_progress_updated_at BEFORE UPDATE ON user_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at();
