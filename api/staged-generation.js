/**
 * 段階的シナリオ生成API
 * 処理を分割して実行し、タイムアウトを回避
 */

export const config = {
  maxDuration: 60,
};

/**
 * Stage1: シナリオ生成（前半）
 * Phase 1-4を生成
 */
export async function generateStage1(req, res) {
  try {
    const { sessionId, formData } = req.body;
    
    if (!sessionId || !formData) {
      return res.status(400).json({
        success: false,
        error: 'sessionIdとformDataが必要です'
      });
    }

    console.log(`🚀 Stage1開始: ${sessionId}`);

    // 前半フェーズの定義
    const firstHalfPhases = [
      { id: 1, name: 'コンセプト生成', endpoint: '/api/phase1-concept' },
      { id: 2, name: 'キャラクター設定', endpoint: '/api/phase2-characters' },
      { id: 3, name: '人物関係', endpoint: '/api/phase3-relationships' },
      { id: 4, name: '事件詳細', endpoint: '/api/phase4-incident' }
    ];

    const results = {
      metadata: {
        ...formData,
        sessionId,
        stage: 1,
        createdAt: new Date().toISOString()
      },
      phases: {}
    };

    // 各フェーズを順次実行
    for (const phase of firstHalfPhases) {
      try {
        console.log(`📝 Phase ${phase.id}: ${phase.name}`);
        
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${phase.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...formData,
            previousPhases: results.phases
          })
        });

        if (!response.ok) {
          throw new Error(`Phase ${phase.id} failed: ${response.status}`);
        }

        const phaseResult = await response.json();
        results.phases[`phase${phase.id}`] = phaseResult;

      } catch (error) {
        console.error(`❌ Phase ${phase.id} error:`, error);
        // フェールバック処理
        results.phases[`phase${phase.id}`] = {
          content: `Phase ${phase.id}の生成に失敗しました`,
          error: error.message,
          generated_by: 'fallback'
        };
      }
    }

    // 中間結果を保存
    await saveToStorage(sessionId, results, 'stage1');

    return res.status(200).json({
      success: true,
      sessionId,
      stage: 1,
      message: 'Stage1完了（Phase 1-4）',
      nextStage: 'stage1-continue',
      progress: 50
    });

  } catch (error) {
    console.error('Stage1 error:', error);
    return res.status(500).json({
      success: false,
      error: `Stage1エラー: ${error.message}`
    });
  }
}

/**
 * Stage1続き: シナリオ生成（後半）
 * Phase 5-8を生成
 */
export async function generateStage1Continue(req, res) {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionIdが必要です'
      });
    }

    console.log(`🚀 Stage1続き開始: ${sessionId}`);

    // 前半の結果を取得
    const previousResults = await getFromStorage(sessionId);
    if (!previousResults) {
      throw new Error('前半の生成結果が見つかりません');
    }

    // 後半フェーズの定義
    const secondHalfPhases = [
      { id: 5, name: '証拠・手がかり', endpoint: '/api/phase5-clues' },
      { id: 6, name: 'タイムライン', endpoint: '/api/phase6-timeline' },
      { id: 7, name: '真相解決', endpoint: '/api/phase7-solution' },
      { id: 8, name: 'GMガイド', endpoint: '/api/phase8-gamemaster' }
    ];

    // 各フェーズを順次実行
    for (const phase of secondHalfPhases) {
      try {
        console.log(`📝 Phase ${phase.id}: ${phase.name}`);
        
        const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}${phase.endpoint}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            ...previousResults.metadata,
            previousPhases: previousResults.phases
          })
        });

        if (!response.ok) {
          throw new Error(`Phase ${phase.id} failed: ${response.status}`);
        }

        const phaseResult = await response.json();
        previousResults.phases[`phase${phase.id}`] = phaseResult;

      } catch (error) {
        console.error(`❌ Phase ${phase.id} error:`, error);
        previousResults.phases[`phase${phase.id}`] = {
          content: `Phase ${phase.id}の生成に失敗しました`,
          error: error.message,
          generated_by: 'fallback'
        };
      }
    }

    // 完全な結果を保存
    previousResults.isComplete = true;
    previousResults.completedAt = new Date().toISOString();
    await saveToStorage(sessionId, previousResults, 'complete');

    return res.status(200).json({
      success: true,
      sessionId,
      stage: 'complete',
      message: '全フェーズ生成完了',
      nextStage: 'stage2',
      progress: 100
    });

  } catch (error) {
    console.error('Stage1続き error:', error);
    return res.status(500).json({
      success: false,
      error: `Stage1続きエラー: ${error.message}`
    });
  }
}

/**
 * Stage2: PDF生成
 */
export async function generateStage2(req, res) {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionIdが必要です'
      });
    }

    console.log(`📄 Stage2 PDF生成開始: ${sessionId}`);

    // 保存されたシナリオを取得
    const scenario = await getFromStorage(sessionId);
    if (!scenario || !scenario.isComplete) {
      throw new Error('完成したシナリオが見つかりません');
    }

    // 強化版PDF生成APIを呼び出し
    const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/enhanced-pdf-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        scenario,
        title: `マーダーミステリー_${scenario.metadata.participants}人用`
      })
    });

    if (!response.ok) {
      throw new Error(`PDF生成失敗: ${response.status}`);
    }

    // PDFをBase64として保存
    const pdfBuffer = await response.arrayBuffer();
    const pdfBase64 = Buffer.from(pdfBuffer).toString('base64');
    
    await saveToStorage(`${sessionId}_pdf`, {
      data: pdfBase64,
      mimeType: 'application/pdf',
      filename: `murder_mystery_${sessionId}.pdf`,
      createdAt: new Date().toISOString()
    }, 'pdf');

    return res.status(200).json({
      success: true,
      sessionId,
      stage: 2,
      message: 'PDF生成完了',
      nextStage: 'stage3',
      pdfSize: pdfBuffer.byteLength
    });

  } catch (error) {
    console.error('Stage2 error:', error);
    return res.status(500).json({
      success: false,
      error: `Stage2エラー: ${error.message}`
    });
  }
}

/**
 * Stage3: 画像生成（オプション）
 */
export async function generateStage3(req, res) {
  try {
    const { sessionId, options = {} } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'sessionIdが必要です'
      });
    }

    console.log(`🖼️ Stage3 画像生成開始: ${sessionId}`);

    // PDF取得
    const pdfData = await getFromStorage(`${sessionId}_pdf`);
    if (!pdfData) {
      throw new Error('PDFが見つかりません');
    }

    // ここでPDFから画像生成処理を実装
    // 現在は簡易実装として、完了通知のみ返す
    
    return res.status(200).json({
      success: true,
      sessionId,
      stage: 3,
      message: '画像生成完了（将来実装）',
      allStagesComplete: true
    });

  } catch (error) {
    console.error('Stage3 error:', error);
    return res.status(500).json({
      success: false,
      error: `Stage3エラー: ${error.message}`
    });
  }
}

/**
 * ストレージヘルパー関数
 */
async function saveToStorage(sessionId, data, phase) {
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/scenario-storage?action=save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      scenario: data,
      phase
    })
  });
  
  if (!response.ok) {
    throw new Error('ストレージ保存エラー');
  }
}

async function getFromStorage(sessionId) {
  const response = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/scenario-storage?action=get&sessionId=${sessionId}`);
  
  if (!response.ok) {
    return null;
  }
  
  const result = await response.json();
  return result.scenario;
}

/**
 * ルーティング処理
 */
export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { stage } = req.query;

  switch (stage) {
    case '1':
      return generateStage1(req, res);
    case '1-continue':
      return generateStage1Continue(req, res);
    case '2':
      return generateStage2(req, res);
    case '3':
      return generateStage3(req, res);
    default:
      return res.status(400).json({
        success: false,
        error: '無効なステージ'
      });
  }
}