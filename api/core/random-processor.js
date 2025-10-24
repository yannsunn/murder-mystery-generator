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
  logger.debug('🎲 完全ランダムモード検出');
  
  try {
    // ランダム生成の実行（簡易実装）
    const randomResult = generateSimpleRandomMystery(formData);
    
    if (!randomResult.success) {
      throw new Error('ランダム生成に失敗しました: ' + randomResult.error);
    }
    
    // ランダム生成結果を既存のsessionDataフォーマットに変換
    const convertedSessionData = convertRandomToSessionFormat(randomResult.mysteryData, formData, sessionId);
    
    // EventSource is disabled - only JSON response
    if (req.headers.accept?.includes('text/event-stream')) {
      return res.status(400).json({
        success: false,
        error: 'EventSource is not supported. Please use polling mode.'
      });
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
  } catch (error) {
    logger.error('❌ ランダム生成エラー:', error);
    const errorResponse = {
      success: false,
      error: error.message || 'ランダム生成中にエラーが発生しました'
    };
    
    if (req.headers.accept?.includes('text/event-stream')) {
      // EventSource is disabled
      return res.status(400).json({
        success: false,
        error: 'EventSource is not supported'
      });
    } else {
      return res.status(500).json(errorResponse);
    }
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

// 簡易的なランダムミステリー生成関数
function generateSimpleRandomMystery(formData) {
  const titles = ['深夜の館の謎', '消えた遺産', '最後の晩餐', '仮面舞踏会の悲劇'];
  const genres = ['クラシック', 'モダン', 'サスペンス', 'ホラー'];
  const settings = ['洋館', 'クルーズ船', 'ホテル', '別荘'];
  
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];
  const randomGenre = genres[Math.floor(Math.random() * genres.length)];
  const randomSetting = settings[Math.floor(Math.random() * settings.length)];
  
  const characters = [];
  const participantCount = parseInt(formData.participants) || 5;
  
  for (let i = 1; i <= participantCount; i++) {
    characters.push({
      name: `キャラクター${i}`,
      age: 20 + Math.floor(Math.random() * 40),
      profession: ['医師', '弁護士', '作家', '実業家', '秘書'][i % 5],
      personality: '謎めいた人物',
      role: i === 1 ? '被害者' : i === 2 ? '犯人' : '容疑者',
      secret: '秘密がある'
    });
  }
  
  return {
    success: true,
    mysteryData: {
      title: randomTitle,
      genre: randomGenre,
      setting: randomSetting,
      plot: {
        fullStory: '事件の詳細な物語...'
      },
      characters: characters,
      clues: [
        { name: '血痕', type: '物的証拠', importance: '高' },
        { name: '目撃証言', type: '証言', importance: '中' }
      ],
      motive: '怨恨',
      trick: '密室トリック',
      files: {
        'GM用真相解説': {
          filename: 'gm-guide.txt',
          content: 'GM用の真相解説...'
        },
        'プレイヤー導入': {
          filename: 'player-intro.txt',
          content: 'プレイヤー向け導入文...'
        }
      }
    }
  };
}

// CommonJS形式でエクスポート
module.exports = {
  processRandomMode,
  convertRandomToSessionFormat
};