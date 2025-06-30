// ストリーミング生成API - タイムアウト完全回避
// 長時間処理をチャンク分割して段階的に配信

import { aiClient } from './utils/ai-client.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';

export const config = {
  maxDuration: 300, // Vercel Pro最大制限
};

export default async function handler(request) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers }
    );
  }

  try {
    const body = await request.json();
    const { participants, era, setting, incident_type, worldview, tone } = body;

    // ストリーミング開始
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        
        // ヘルパー関数：データ送信
        const sendData = (data) => {
          const chunk = encoder.encode(`data: ${JSON.stringify(data)}\n\n`);
          controller.enqueue(chunk);
        };

        // ヘルパー関数：エラー送信
        const sendError = (error) => {
          const errorData = {
            type: 'error',
            error: error.message,
            timestamp: new Date().toISOString()
          };
          const chunk = encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`);
          controller.enqueue(chunk);
        };

        try {
          // Phase 1: コンセプト生成
          sendData({
            type: 'progress',
            phase: 1,
            total: 8,
            message: 'コンセプト生成中...',
            progress: 12.5
          });

          const concept = await generateConcept({ participants, era, setting, incident_type, worldview, tone });
          
          sendData({
            type: 'result',
            phase: 1,
            content: concept,
            progress: 12.5
          });

          // Phase 2: キャラクター生成
          sendData({
            type: 'progress',
            phase: 2,
            total: 8,
            message: 'キャラクター生成中...',
            progress: 25
          });

          const characters = await generateCharacters({ concept, participants });
          
          sendData({
            type: 'result',
            phase: 2,
            content: characters,
            progress: 25
          });

          // Phase 3: 関係性生成
          sendData({
            type: 'progress',
            phase: 3,
            total: 8,
            message: '関係性構築中...',
            progress: 37.5
          });

          const relationships = await generateRelationships({ concept, characters });
          
          sendData({
            type: 'result',
            phase: 3,
            content: relationships,
            progress: 37.5
          });

          // Phase 4: 事件生成
          sendData({
            type: 'progress',
            phase: 4,
            total: 8,
            message: '事件詳細生成中...',
            progress: 50
          });

          const incident = await generateIncident({ concept, characters, relationships });
          
          sendData({
            type: 'result',
            phase: 4,
            content: incident,
            progress: 50
          });

          // Phase 5: 手がかり生成
          sendData({
            type: 'progress',
            phase: 5,
            total: 8,
            message: '手がかり配置中...',
            progress: 62.5
          });

          const clues = await generateClues({ concept, characters, relationships, incident });
          
          sendData({
            type: 'result',
            phase: 5,
            content: clues,
            progress: 62.5
          });

          // Phase 6: タイムライン生成
          sendData({
            type: 'progress',
            phase: 6,
            total: 8,
            message: 'タイムライン構築中...',
            progress: 75
          });

          const timeline = await generateTimeline({ concept, characters, incident, clues });
          
          sendData({
            type: 'result',
            phase: 6,
            content: timeline,
            progress: 75
          });

          // Phase 7: 解決生成
          sendData({
            type: 'progress',
            phase: 7,
            total: 8,
            message: '真相解明生成中...',
            progress: 87.5
          });

          const solution = await generateSolution({ concept, characters, incident, clues, timeline });
          
          sendData({
            type: 'result',
            phase: 7,
            content: solution,
            progress: 87.5
          });

          // Phase 8: ゲームマスター生成
          sendData({
            type: 'progress',
            phase: 8,
            total: 8,
            message: 'ゲーム進行ガイド生成中...',
            progress: 100
          });

          const gamemaster = await generateGamemaster({ concept, characters, clues, timeline, solution });
          
          sendData({
            type: 'result',
            phase: 8,
            content: gamemaster,
            progress: 100
          });

          // 完了通知
          sendData({
            type: 'complete',
            message: 'シナリオ生成完了！',
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Streaming generation error:', error);
          sendError(error);
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, { headers });

  } catch (error) {
    console.error('Streaming setup error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `ストリーミング設定エラー: ${error.message}` 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 個別フェーズの生成関数（高速化された最小実装）
async function generateConcept(params) {
  const apiKey = GROQ_API_KEY || OPENAI_API_KEY;
  const apiUrl = GROQ_API_KEY ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions';
  const model = GROQ_API_KEY ? 'llama-3.1-70b-versatile' : 'gpt-3.5-turbo';

  const response = await fetchWithTimeout(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: 'system', content: 'マーダーミステリーのコンセプト作成専門家として簡潔に回答してください。' },
        { role: 'user', content: `${params.participants}人用マーダーミステリーの基本コンセプトを生成。設定：${params.era}/${params.setting}/${params.incident_type}。800文字以内で。` }
      ],
      temperature: 0.8,
      max_tokens: 800,
    })
  }, 30000);

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateCharacters(params) {
  const prompt = `${params.participants}人用の詳細なキャラクター設定を生成してください。

各キャラクターについて以下を含めてください：
- 名前・年齢・職業
- 外見的特徴・性格
- 背景・経歴
- 秘密・動機
- 他キャラクターとの関係性

形式：各キャラクター200-300文字の詳細設定`;

  return await generateWithAI(prompt, 'キャラクター生成');
}

async function generateRelationships(params) {
  const prompt = `${params.participants}人のキャラクター間の複雑な人間関係を生成してください。

以下を含めてください：
- 恋愛関係・家族関係
- 仕事・利益関係
- 対立・敵対関係
- 隠された関係性
- 事件に関わる重要な関係

形式：関係図とそれぞれの詳細説明`;

  return await generateWithAI(prompt, '人間関係生成');
}

async function generateIncident(params) {
  const prompt = `マーダーミステリー事件の詳細を生成してください。

以下を含めてください：
- 被害者の詳細情報
- 殺害方法と状況
- 発見時の現場状況
- 第一発見者
- 現場に残された証拠
- 初期の混乱状況

形式：500-700文字の詳細な事件描写`;

  return await generateWithAI(prompt, '事件詳細生成');
}

async function generateClues(params) {
  const prompt = `推理に必要な手がかり・証拠を生成してください。

以下の種類を含めてください：
- 物理的証拠（7-8個）
- 証言・アリバイ情報（5-6個）
- 隠された手がかり（3-4個）
- ミスリード要素（2-3個）

各手がかりに重要度レベルと発見タイミングを設定してください。`;

  return await generateWithAI(prompt, '手がかり生成');
}

async function generateTimeline(params) {
  const prompt = `事件の詳細なタイムラインを生成してください。

以下の時間軸で詳細に：
- 事件前日：重要な準備・出来事
- 事件当日朝：各キャラクターの行動
- 事件発生前2時間：決定的な動き
- 事件発生：犯行の瞬間
- 事件発生後：発見・混乱

各時間帯で全キャラクターの位置と行動を明記してください。`;

  return await generateWithAI(prompt, 'タイムライン生成');
}

async function generateSolution(params) {
  const prompt = `事件の完全な解決・真相を生成してください。

以下を詳細に：
- 真犯人とその動機
- 犯行の詳細手順
- 使用されたトリック
- アリバイ工作の方法
- 決定的な証拠
- 推理のポイント
- 論理的な解明過程

形式：800-1000文字の完全な真相解明`;

  return await generateWithAI(prompt, '真相・解決生成');
}

async function generateGamemaster(params) {
  const prompt = `ゲームマスター向けの進行ガイドを生成してください。

以下を含めてください：
- セッション開始から終了までの流れ
- 各段階での重要な演出ポイント
- プレイヤーが詰まった時のヒント出し方法
- 盛り上がりを作るタイミング
- 感動的な真相発表の演出方法
- トラブル対応方法

形式：実用的な進行マニュアル`;

  return await generateWithAI(prompt, 'ゲームマスター指南生成');
}

/**
 * 統一AI生成関数
 */
async function generateWithAI(prompt, operation) {
  try {
    const systemPrompt = `あなたは経験豊富なマーダーミステリー作家です。
プロフェッショナル品質の内容を生成してください。
具体的で詳細な内容を日本語で提供してください。`;

    const result = await aiClient.generateWithRetry(systemPrompt, prompt, {
      preferredProvider: 'groq',
      maxRetries: 2
    });

    return result.content;

  } catch (error) {
    throw new AppError(
      `${operation}中にエラーが発生しました: ${error.message}`,
      ErrorTypes.GENERATION,
      500,
      { operation, originalError: error.message }
    );
  }
}