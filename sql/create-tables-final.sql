-- 🎭 Murder Mystery Generator - データベース作成SQL (最終版)
-- UUID形式修正済み

-- ===================================================================
-- 1. scenarios テーブル作成
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

-- ===================================================================
-- 2. user_sessions テーブル作成
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
COMMENT ON COLUMN user_sessions.session_id IS 'セッションID（文字列）';
COMMENT ON COLUMN user_sessions.user_data IS 'ユーザー関連データ（JSON）';

-- ===================================================================
-- 3. インデックス作成
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scenarios_title ON scenarios(title);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_last_activity ON user_sessions(last_activity DESC);

-- ===================================================================
-- 4. Row Level Security (RLS) 設定
-- ===================================================================

-- scenarios テーブル
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous access to scenarios" ON scenarios;
CREATE POLICY "Allow anonymous access to scenarios" ON scenarios
    FOR ALL USING (true) WITH CHECK (true);

-- user_sessions テーブル
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anonymous access to user_sessions" ON user_sessions;
CREATE POLICY "Allow anonymous access to user_sessions" ON user_sessions
    FOR ALL USING (true) WITH CHECK (true);

-- ===================================================================
-- 5. 自動更新トリガー
-- ===================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_scenarios_updated_at ON scenarios;
CREATE TRIGGER update_scenarios_updated_at
    BEFORE UPDATE ON scenarios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ===================================================================
-- 6. サンプルデータ挿入（正しいUUID形式）
-- ===================================================================

INSERT INTO scenarios (
    id, 
    title, 
    description, 
    characters, 
    scenario_data
) VALUES (
    gen_random_uuid(),
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
);

-- 追加のサンプルデータ
INSERT INTO scenarios (
    title, 
    description, 
    characters, 
    scenario_data
) VALUES (
    'サンプルシナリオ: 密室の謎',
    '密室で起こった不可解な殺人事件',
    '[
        {"name": "執事", "role": "使用人", "description": "長年屋敷で働く忠実な執事"},
        {"name": "相続人", "role": "遺族", "description": "財産を相続する予定の親族"},
        {"name": "医師", "role": "専門家", "description": "死因を調査する医師"}
    ]'::jsonb,
    '{
        "title": "密室の謎",
        "setting": "古い洋館",
        "theme": "古典推理",
        "duration": "3時間",
        "players": 3,
        "difficulty": "中級",
        "story": "嵐の夜、屋敷で密室殺人が発生した。",
        "generatedAt": "2025-01-03T00:00:00Z"
    }'::jsonb
);

-- ===================================================================
-- 7. 便利なビュー作成
-- ===================================================================

-- シナリオ一覧ビュー
DROP VIEW IF EXISTS scenarios_summary;
CREATE VIEW scenarios_summary AS
SELECT 
    id,
    title,
    description,
    jsonb_array_length(characters) as character_count,
    scenario_data->>'difficulty' as difficulty,
    scenario_data->>'duration' as duration,
    created_at,
    updated_at
FROM scenarios
ORDER BY created_at DESC;

-- 今日作成されたシナリオビュー
DROP VIEW IF EXISTS todays_scenarios;
CREATE VIEW todays_scenarios AS
SELECT 
    title,
    description,
    created_at
FROM scenarios
WHERE created_at >= CURRENT_DATE
ORDER BY created_at DESC;

-- ===================================================================
-- 完了確認
-- ===================================================================

-- テーブル作成確認
SELECT 
    'テーブル作成完了' as status,
    (SELECT COUNT(*) FROM scenarios) as scenarios_count,
    (SELECT COUNT(*) FROM user_sessions) as sessions_count;

-- 作成されたテーブル一覧
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('scenarios', 'user_sessions')
ORDER BY table_name;

-- RLS設定確認
SELECT 
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN ('scenarios', 'user_sessions');

-- サンプルデータ確認
SELECT 
    title,
    LEFT(description, 50) as description_preview,
    jsonb_array_length(characters) as character_count,
    created_at
FROM scenarios
ORDER BY created_at DESC;