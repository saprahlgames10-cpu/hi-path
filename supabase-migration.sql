-- Migration: Add Learning DNA, Goal Parse, and advanced analytics columns

-- Add learning_dna to users_profile (behavioral profile)
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS learning_dna jsonb DEFAULT '{}'::jsonb;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS focus_minutes int DEFAULT 0;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS distracted_minutes int DEFAULT 0;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
ALTER TABLE users_profile ADD COLUMN IF NOT EXISTS efficiency_score float DEFAULT 0.0;

-- Add goal_parse and roadmap versioning to roadmaps
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS goal_parse jsonb DEFAULT '{}'::jsonb;
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS version int DEFAULT 1;
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS previous_version_id uuid REFERENCES roadmaps(id);
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS change_log jsonb DEFAULT '[]'::jsonb;
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS predicted_completion_date date;
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS dropout_risk float DEFAULT 0.0;

-- Add review queue for spaced repetition
CREATE TABLE IF NOT EXISTS review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  node_id uuid REFERENCES roadmap_nodes NOT NULL,
  roadmap_id uuid REFERENCES roadmaps NOT NULL,
  due_at timestamptz NOT NULL DEFAULT now(),
  interval_days int DEFAULT 3,
  ease_factor float DEFAULT 2.5,
  repetitions int DEFAULT 0,
  last_reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own review queue" ON review_queue FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own review queue" ON review_queue FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own review queue" ON review_queue FOR UPDATE USING (auth.uid() = user_id);

-- Add focus_sessions for tracking study time
CREATE TABLE IF NOT EXISTS focus_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  node_id uuid REFERENCES roadmap_nodes,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds int DEFAULT 0,
  distracted_seconds int DEFAULT 0,
  energy_level int,
  mood int,
  completed boolean DEFAULT false
);

ALTER TABLE focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own focus sessions" ON focus_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own focus sessions" ON focus_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own focus sessions" ON focus_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Add real_world_applications for logging practical work
CREATE TABLE IF NOT EXISTS real_world_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users_profile NOT NULL,
  node_id uuid REFERENCES roadmap_nodes,
  title text NOT NULL,
  description text,
  application_type text DEFAULT 'project',
  skills_used text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE real_world_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own applications" ON real_world_applications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own applications" ON real_world_applications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add roadmap_id to notifications for coach interventions
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS roadmap_id uuid REFERENCES roadmaps;

-- Add last_active_at to roadmaps for tracking learner engagement
ALTER TABLE roadmaps ADD COLUMN IF NOT EXISTS last_active_at timestamptz;
