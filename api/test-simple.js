// シンプルテスト API - 基本動作確認用
// Vercel Pro環境での基本的なAPI動作を検証

export const config = {
  maxDuration: 10,
};

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  const startTime = Date.now();

  try {
    // 短いシナリオ生成のテスト
    const testScenario = {
      title: "🆘 テストシナリオ",
      concept: "テスト用の簡単なマーダーミステリー",
      characters: [
        { name: "田中", role: "探偵", secret: "実は元警察官" },
        { name: "佐藤", role: "容疑者", secret: "アリバイがない" },
        { name: "鈴木", role: "証人", secret: "重要な情報を隠している" }
      ],
      incident: "書斎で発見された謎の事件",
      clues: [
        "破られた日記のページ",
        "血痕の付いたペン",
        "開いたままの窓"
      ],
      solution: "真犯人は意外な人物でした"
    };

    const executionTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        message: "API動作正常",
        scenario: testScenario,
        execution_time_ms: executionTime,
        timestamp: new Date().toISOString(),
        vercel_info: {
          region: process.env.VERCEL_REGION || 'unknown',
          node_env: process.env.NODE_ENV || 'unknown',
        }
      }, null, 2),
      { status: 200, headers }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        execution_time_ms: Date.now() - startTime,
      }),
      { status: 500, headers }
    );
  }
}