-- 🗄️ Murder Mystery Database - Table Creation SQL
-- Supabase Web UIのSQL Editorで実行してください

-- scenarios テーブルの作成
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Untitled Scenario',
  description TEXT DEFAULT '',
  characters JSONB DEFAULT '[]'::jsonb,
  scenario_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- user_sessions テーブルの作成
CREATE TABLE IF NOT EXISTS user_sessions (
  id TEXT PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_data JSONB DEFAULT '{}'::jsonb,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_title ON scenarios(title);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_activity ON user_sessions(last_activity DESC);

-- Row Level Security (RLS) の設定
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- 匿名ユーザーのアクセス許可ポリシー
CREATE POLICY "Allow anonymous access to scenarios" ON scenarios FOR ALL USING (true);
CREATE POLICY "Allow anonymous access to user_sessions" ON user_sessions FOR ALL USING (true);

-- 確認用クエリ
SELECT 'scenarios table created' as status
UNION ALL
SELECT 'user_sessions table created' as status;