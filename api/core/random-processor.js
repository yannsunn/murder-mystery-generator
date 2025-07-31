/**
 * 🎲 Random Mode Processor
 * 完全ランダムモードの処理を管理
 */

const { logger } = require('../utils/logger.js');
// const { randomMysteryGenerator } = require('../utils/random-mystery-generator.js'); // File removed
// Event source handlers removed - using polling mode instead
// const { 
//   setEventSourceHeaders, 
//   sendEventSourceMessage,
//   simulateRandomProgress 
// } = require('./event-source-handler.js');

/**
 * ランダムモードの処理
 */
async function processRandomMode(req, res, formData, sessionId) {
  logger.debug('🎲 完全ランダムモード検出 - RandomMysteryGeneratorを使用');
  
  try {
    // ランダム生成の実行
    const randomResult = await randomMysteryGenerator.generateCompleteRandomMystery();
    
    if (!randomResult.success) {
      throw new Error('ランダム生成に失敗しました: ' + randomResult.error);
    }
    
    // ランダム生成結果を既存のsessionDataフォーマットに変換
    const convertedSessionData = convertRandomToSessionFormat(randomResult.mysteryData, formData, sessionId);
    
    // EventSource対応のレスポンス処理
    if (req.headers.accept?.includes('text/event-stream')) {
      // EventSource用のヘッダー設定
      setEventSourceHeaders(res);
      
      // 進捗通知を送信
      sendEventSourceMessage(res, 'start', { message: '🎲 完全ランダム生成を開始します' });
      
      // 9段階進捗をシミュレートして送信
      await simulateRandomProgress(res);
      
      // 完了通知を送信
      const finalResponse = {
        success: true,
        sessionData: convertedSessionData,
        message: '🎲 完全ランダム生成が完了しました！',
        downloadReady: true,
        generationType: 'random',
        isComplete: true
      };
      
      sendEventSourceMessage(res, 'complete', finalResponse);
      res.end();
    } else {
      // POST用のレスポンス
      return res.status(200).json({
        success: true,
        sessionData: convertedSessionData,
        message: '🎲 完全ランダム生成が完了しました！',
        downloadReady: true,
        generationType: 'random'
      });
    }
    
    return true; // 処理完了
  } catch (error) {
    logger.error('❌ ランダム生成エラー:', error);
    const errorResponse = {
      success: false,
      error: error.message || 'ランダム生成中にエラーが発生しました'
    };
    
    if (req.headers.accept?.includes('text/event-stream')) {
      // EventSource対応のエラーレスポンス
      setEventSourceHeaders(res);
      sendEventSourceMessage(res, 'error', errorResponse);
      res.end();
    } else {
      return res.status(500).json(errorResponse);
    }
    return true; // エラー処理完了
  }
}

/**
 * 🎲 ランダム生成結果を既存のsessionDataフォーマットに変換
 */
function convertRandomToSessionFormat(randomData, formData, sessionId) {
  const { title, genre, setting, plot, characters, clues, files } = randomData;
  
  // キャラクターハンドアウトの構築
  const characterHandouts = characters.map((char, index) => `
## 【プレイヤー${index + 1}専用ハンドアウト】

### あなたのキャラクター
**氏名**: ${char.name}
**年齢**: ${char.age}歳
**職業**: ${char.profession}
**性格**: ${char.personality}
**役割**: ${char.role}

### あなたの背景と動機
${char.secret || '特になし'}

### 他のプレイヤーとの関係性
${char.relationship || '初期段階では不明'}
`).join('\n\n---\n\n');

  // 証拠システムの構築
  const evidenceSystem = `
## 証拠配置・手がかり体系

### 重要な証拠
${clues.map((clue, i) => `
${i + 1}. **${clue.name}**
   - 種類: ${clue.type}
   - 発見場所: ${clue.location || '現場付近'}
   - 重要度: ${clue.importance || '中'}
`).join('\n')}

### 真相への道筋
${plot.chapters ? plot.chapters.join('\n\n') : plot.fullStory}
`;

  // sessionDataフォーマットに変換
  return {
    sessionId: sessionId || `random_${Date.now()}`,
    formData: {
      ...formData,
      generationType: 'random'
    },
    startTime: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'completed',
    generationType: 'random',
    phases: {
      step0: {
        name: 'ランダム全体構造',
        content: {
          randomOutline: `## 作品基本情報（ランダム生成）\n**作品タイトル**: ${title}\n**基本コンセプト**: ${genre}を舞台とした${setting}のミステリー\n**舞台設定**: ${setting}`
        },
        status: 'completed'
      },
      step1: {
        name: '基本コンセプト',
        content: {
          concept: `## 作品タイトル\n${title}\n\n## 作品コンセプト\nジャンル: ${genre}\n舞台: ${setting}\n\n${plot.fullStory || ''}`
        },
        status: 'completed'
      },
      step2: {
        name: '事件核心',
        content: {
          incidentCore: `## 事件の核心\n動機: ${randomData.motive}\nトリック: ${randomData.trick}\n\n被害者: ${characters.find(c => c.role === '被害者')?.name || '不明'}\n犯人: ${characters.find(c => c.role === '犯人')?.name || '不明'}`
        },
        status: 'completed'
      },
      step3: {
        name: '事件詳細',
        content: {
          incidentDetails: plot.fullStory || '詳細なプロットは生成されました'
        },
        status: 'completed'
      },
      step4: {
        name: 'キャラクター生成',
        content: {
          characters: characterHandouts,
          character_count: characters.length
        },
        status: 'completed'
      },
      step5: {
        name: '証拠配置',
        content: {
          evidence_system: evidenceSystem
        },
        status: 'completed'
      },
      step6: {
        name: 'GM進行ガイド',
        content: {
          gamemaster_guide: files['GM用真相解説']?.content || ''
        },
        status: 'completed'
      },
      step7: {
        name: '配布資料準備',
        content: {
          handouts: files['プレイヤー導入']?.content || '',
          downloadableFiles: Object.keys(files).map(key => ({
            name: files[key].filename,
            path: files[key].path,
            content: files[key].content
          }))
        },
        status: 'completed'
      }
    },
    context: randomData,
    files: files,
    images: [],
    hasImages: false
  };
}

// CommonJS形式でエクスポート
module.exports = {
  processRandomMode,
  convertRandomToSessionFormat
};