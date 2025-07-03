-- 🎭 Murder Mystery Generator - データベース作成SQL
-- 実行日: 2025-01-03

-- ===================================================================
-- 1. scenarios テーブル作成 (生成されたシナリオの保存)
-- ===================================================================

CREATE TABLE IF NOT EXISTS scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL DEFAULT '無題のシナリオ',
    description TEXT DEFAULT '',
    characters JSONB DEFAULT '[]'::jsonb,
    scenario_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- scenarios テーブルにコメント追加
COMMENT ON TABLE scenarios IS 'マーダーミステリー生成シナリオの保存テーブル';
COMMENT ON COLUMN scenarios.id IS 'シナリオの一意識別子（UUID）';
COMMENT ON COLUMN scenarios.title IS 'シナリオのタイトル';
COMMENT ON COLUMN scenarios.description IS 'シナリオの説明・概要';
COMMENT ON COLUMN scenarios.characters IS 'キャラクター情報（JSON配列）';
COMMENT ON COLUMN scenarios.scenario_data IS 'シナリオの詳細データ（JSON）';
COMMENT ON COLUMN scenarios.created_at IS '作成日時';
COMMENT ON COLUMN scenarios.updated_at IS '最終更新日時';

-- ===================================================================
-- 2. user_sessions テーブル作成 (ユーザーセッション管理)
-- ===================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT UNIQUE NOT NULL,
    user_data JSONB DEFAULT '{}'::jsonb,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- user_sessions テーブルにコメント追加
COMMENT ON TABLE user_sessions IS 'ユーザーセッション管理テーブル';
COMMENT ON COLUMN user_sessions.id IS 'セッションの一意識別子（UUID）';
COMMENT ON COLUMN user_sessions.session_id IS 'セッションID（文字列）';
COMMENT ON COLUMN user_sessions.user_data IS 'ユーザー関連データ（JSON）';
COMMENT ON COLUMN user_sessions.last_activity IS '最終アクティビティ日時';
COMMENT ON COLUMN user_sessions.created_at IS 'セッション作成日時';

-- ===================================================================
-- 3. インデックス作成 (パフォーマンス最適化)
-- ===================================================================

-- scenarios テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_title ON scenarios(title);
CREATE INDEX IF NOT EXISTS idx_scenarios_updated_at ON scenarios(updated_at DESC);

-- user_sessions テーブルのインデックス
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);

-- ===================================================================
-- 4. Row Level Security (RLS) 設定
-- ===================================================================

-- scenarios テーブルのRLS有効化
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;

-- scenarios テーブルのポリシー（匿名ユーザーによる全操作を許可）
CREATE POLICY IF NOT EXISTS "Allow anonymous access to scenarios" ON scenarios
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- user_sessions テーブルのRLS有効化
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- user_sessions テーブルのポリシー（匿名ユーザーによる全操作を許可）
CREATE POLICY IF NOT EXISTS "Allow anonymous access to user_sessions" ON user_sessions
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- ===================================================================
-- 5. トリガー関数作成 (updated_at自動更新)
-- ===================================================================

-- updated_at 自動更新関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- scenarios テーブルにトリガー設定
DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;
CREATE TRIGGER update_scenarios_updated_at
    BEFORE UPDATE ON scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 6. サンプルデータ挿入 (テスト用)
-- ===================================================================

INSERT INTO scenarios (id, title, description, characters, scenario_data) 
VALUES (
    'sample-scenario-001',
    'サンプルシナリオ: 図書館の謎',
    '静かな図書館で起こった不可解な事件のシナリオ',
    '[
        {"name": "司書", "role": "図書館員", "description": "長年図書館で働く真面目な職員"},
        {"name": "学生", "role": "利用者", "description": "毎日図書館に通う大学生"},
        {"name": "教授", "role": "研究者", "description": "古文書を研究する歴史学教授"}
    ]'::jsonb,
    '{
        "title": "図書館の謎",
        "setting": "市立図書館",
        "theme": "知的探究",
        "duration": "2時間",
        "players": 3,
        "difficulty": "初級",
        "story": "ある雨の日、図書館で貴重な古文書が消失した。犯人は誰なのか？",
        "generatedAt": "2025-01-03T00:00:00Z"
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;

-- ===================================================================
-- 7. データベース確認用ビュー作成
-- ===================================================================

-- シナリオサマリービュー
CREATE OR REPLACE VIEW scenarios_summary AS
SELECT 
    id,
    title,
    description,
    jsonb_array_length(characters) as character_count,
    created_at,
    updated_at,
    CASE 
        WHEN scenario_data ? 'difficulty' THEN scenario_data->>'difficulty'
        ELSE 'Unknown'
    END as difficulty
FROM scenarios
ORDER BY created_at DESC;

-- セッション統計ビュー
CREATE OR REPLACE VIEW session_stats AS
SELECT 
    COUNT(*) as total_sessions,
    COUNT(CASE WHEN last_activity > now() - interval '1 hour' THEN 1 END) as active_sessions,
    COUNT(CASE WHEN created_at > now() - interval '1 day' THEN 1 END) as today_sessions,
    MIN(created_at) as first_session,
    MAX(last_activity) as latest_activity
FROM user_sessions;

-- ===================================================================
-- 完了確認
-- ===================================================================

-- テーブル作成確認
SELECT 
    'scenarios' as table_name,
    COUNT(*) as record_count
FROM scenarios
UNION ALL
SELECT 
    'user_sessions' as table_name,
    COUNT(*) as record_count
FROM user_sessions;

-- インデックス確認
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('scenarios', 'user_sessions')
ORDER BY tablename, indexname;

-- RLS確認
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('scenarios', 'user_sessions');