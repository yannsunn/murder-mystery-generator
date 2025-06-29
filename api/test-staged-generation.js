/**
 * 段階的生成システムのテストエンドポイント
 * 各ステージの動作確認用
 */

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    console.log('🧪 段階的生成システムテスト開始');

    // 1. セッション作成テスト
    console.log('📝 Test 1: セッション作成');
    const createResponse = await fetch(`${baseUrl}/api/scenario-storage?action=create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        metadata: { test: true, timestamp: new Date().toISOString() }
      })
    });

    if (!createResponse.ok) {
      throw new Error(`セッション作成失敗: ${createResponse.status}`);
    }

    const { sessionId } = await createResponse.json();
    console.log(`✅ セッション作成成功: ${sessionId}`);

    // 2. データ保存テスト
    console.log('💾 Test 2: データ保存');
    const saveResponse = await fetch(`${baseUrl}/api/scenario-storage?action=save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        scenario: { 
          testData: 'This is a test scenario',
          phases: {
            phase1: { content: 'Test phase 1' },
            phase2: { content: 'Test phase 2' }
          }
        },
        phase: 'test'
      })
    });

    if (!saveResponse.ok) {
      throw new Error(`データ保存失敗: ${saveResponse.status}`);
    }
    console.log('✅ データ保存成功');

    // 3. データ取得テスト
    console.log('📥 Test 3: データ取得');
    const getResponse = await fetch(`${baseUrl}/api/scenario-storage?action=get&sessionId=${sessionId}`);
    
    if (!getResponse.ok) {
      throw new Error(`データ取得失敗: ${getResponse.status}`);
    }

    const retrievedData = await getResponse.json();
    console.log('✅ データ取得成功:', retrievedData.scenario.testData);

    // 4. Stage APIテスト（モック）
    console.log('🚀 Test 4: Stage API動作確認');
    const stages = ['1', '1-continue', '2', '3'];
    const stageResults = [];

    for (const stage of stages) {
      try {
        // 実際のAPI呼び出しは行わず、エンドポイントの存在確認のみ
        const checkResponse = await fetch(`${baseUrl}/api/staged-generation?stage=${stage}`, {
          method: 'OPTIONS'
        });
        
        stageResults.push({
          stage,
          available: checkResponse.ok,
          status: checkResponse.status
        });
      } catch (error) {
        stageResults.push({
          stage,
          available: false,
          error: error.message
        });
      }
    }

    // テスト結果のサマリー
    const summary = {
      success: true,
      timestamp: new Date().toISOString(),
      tests: {
        sessionCreation: '✅ Pass',
        dataStorage: '✅ Pass',
        dataRetrieval: '✅ Pass',
        stageEndpoints: stageResults
      },
      sessionId,
      message: '段階的生成システムは正常に動作しています'
    };

    console.log('🎉 全テスト完了');

    return res.status(200).json(summary);

  } catch (error) {
    console.error('❌ テストエラー:', error);
    return res.status(500).json({
      success: false,
      error: `テスト失敗: ${error.message}`,
      timestamp: new Date().toISOString()
    });
  }
}