-- Notification Preferences Table (CR-011 Phase 3.1)
-- Stores per-user, per-section, per-channel notification settings.
-- Apply to DEV first, then PROD after verification.

-- Prep: ensure user_roles.email is unique (needed for FK)
ALTER TABLE user_roles ADD CONSTRAINT user_roles_email_unique UNIQUE (email);

-- Main table
CREATE TABLE notification_preferences (
  id serial PRIMARY KEY,
  user_email text NOT NULL REFERENCES user_roles(email),
  section text NOT NULL CHECK (section IN ('sales', 'cs', 'internal', 'all')),
  channel text NOT NULL CHECK (channel IN ('slack', 'email')),
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('realtime', 'hourly', 'daily', 'weekly')),
  slack_channel_id text,
  is_active boolean DEFAULT true,
  thresholds jsonb DEFAULT '{"low_score": 5, "health_drop": 2}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_email, section, channel)
);

-- RLS policies
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own preferences" ON notification_preferences
  FOR SELECT USING (user_email = auth.jwt()->>'email');

CREATE POLICY "Users update own preferences" ON notification_preferences
  FOR UPDATE USING (user_email = auth.jwt()->>'email');

CREATE POLICY "Users insert own preferences" ON notification_preferences
  FOR INSERT WITH CHECK (user_email = auth.jwt()->>'email');

CREATE POLICY "Service role full access" ON notification_preferences
  FOR ALL USING (auth.role() = 'service_role');
