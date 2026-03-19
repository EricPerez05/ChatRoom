CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_channel_created_at
  ON messages(channel_id, created_at);

CREATE TABLE IF NOT EXISTS question_status (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  question_message_id TEXT UNIQUE NOT NULL REFERENCES messages(id),
  question_content TEXT NOT NULL,
  asked_by_user_id TEXT NOT NULL,
  asked_by TEXT NOT NULL,
  asked_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('unanswered', 'answered')),
  answered_at TIMESTAMPTZ,
  answered_by_user_id TEXT,
  answered_message_id TEXT REFERENCES messages(id)
);

CREATE INDEX IF NOT EXISTS idx_question_status_channel_status
  ON question_status(channel_id, status);

CREATE TABLE IF NOT EXISTS discussion_state_override (
  discussion_id TEXT PRIMARY KEY,
  status TEXT NOT NULL CHECK (status IN ('active', 'detected', 'resolved', 'archived')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('question_answered')),
  user_id TEXT NOT NULL,
  question_message_id TEXT NOT NULL REFERENCES messages(id),
  channel_id TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_created_at
  ON notifications(user_id, created_at DESC);
