/**
 * 🚀 Unified Export System - 30分-1時間特化ZIP生成API
 * 短時間セッション専用・極限精度・完全文章対応
 */

import JSZip from 'jszip';
import { setSecurityHeaders } from './security-utils.js';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { createSecurityMiddleware } from './middleware/rate-limiter.js';

export const config = {
  maxDuration: 60,
};

/**
 * 完全なテキストファイル生成システム
 */
async function generateTextFiles(sessionData) {
  const files = {};
  
  // 統合マイクロ生成のデータ構造に対応
  let concept = '';
  let title = 'マーダーミステリーシナリオ';
  
  // 新しいstep構造からデータを抽出
  if (sessionData.phases?.step1?.content?.concept) {
    concept = sessionData.phases.step1.content.concept;
    const titleMatch = concept.match(/## 作品タイトル[\s\S]*?\n([^\n]+)/);
    title = titleMatch ? titleMatch[1].trim() : 'マーダーミステリーシナリオ';
  }
  
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\-_]/g, '_');
  
  // 30分-1時間対応メインファイル生成
  files[`${sanitizedTitle}_complete_scenario.txt`] = generateCompleteScenario(sessionData, title);
  files[`${sanitizedTitle}_gamemaster_guide.txt`] = generateGameMasterGuide(sessionData, title);
  files[`${sanitizedTitle}_introduction_handout.txt`] = generateIntroductionHandout(sessionData, title);
  
  // 参加者別個別ハンドアウト生成（短時間特化）
  const participantCount = parseInt(sessionData.formData?.participants || 5);
  for (let i = 1; i <= participantCount; i++) {
    files[`${sanitizedTitle}_player${i}_handout.txt`] = generatePlayerHandout(sessionData, title, i);
  }
  
  // 統合マイクロ生成の個別ステップファイル
  const steps = {
    '01_concept_and_title.txt': sessionData.phases?.step1?.content?.concept,
    '02_characters.txt': sessionData.phases?.step2?.content?.characters,
    '03_incident_truth.txt': sessionData.phases?.step3?.content?.incident_and_truth,
    '04_timeline.txt': sessionData.phases?.step4?.content?.timeline,
    '05_gamemaster_guide.txt': sessionData.phases?.step5?.content?.gamemaster_guide
  };
  
  Object.entries(steps).forEach(([filename, content]) => {
    if (content) {
      files[filename] = content;
    }
  });
  
  files['scenario_info.txt'] = generateScenarioInfo(sessionData);
  return files;
}

/**
 * 完全シナリオテキスト生成
 */
function generateCompleteScenario(sessionData, title) {
  const formData = sessionData.formData || {};
  const phases = sessionData.phases || {};
  
  let content = `
================================================================================
                        ${title}
                30分-1時間特化シナリオドキュメント
================================================================================

【基本情報】
参加人数: ${formData.participants || '未設定'}人
プレイ時間: 30分-1時間（複雑さ：${getDisplayText('complexity', formData.complexity)}）
時代背景: ${getDisplayText('era', formData.era)}
舞台設定: ${getDisplayText('setting', formData.setting)}
トーン: ${getDisplayText('tone', formData.tone)}
生成日時: ${new Date(sessionData.startTime || Date.now()).toLocaleString('ja-JP')}

================================================================================
短時間セッション構成
================================================================================
1. 高密度コンセプト・世界観
2. 効率的キャラクター設定
3. 短時間解決構造
4. 決定的証拠システム
5. 30分-1時間完結タイムライン
6. 完璧ゲームマスターガイド

`;

  // 30分-1時間特化各ステップ内容を追加
  const stepNames = {
    step1: '1. 短時間特化コンセプト・導入',
    step2: '2. 効率的キャラクター・個別ハンドアウト', 
    step3: '3. 30分-1時間解決構造・真相',
    step4: '4. 短時間完結タイムライン',
    step5: '5. 実用GMガイド'
  };

  Object.entries(stepNames).forEach(([stepKey, stepTitle]) => {
    const stepData = phases[stepKey];
    if (stepData && stepData.content) {
      content += `\n${'='.repeat(80)}\n${stepTitle}\n${'='.repeat(80)}\n\n`;
      
      // コンテンツの各プロパティを追加
      Object.entries(stepData.content).forEach(([key, value]) => {
        if (value && typeof value === 'string') {
          content += `${value}\n\n`;
        }
      });
    }
  });
  
  content += `
================================================================================
                        制作情報
================================================================================

このシナリオは30分-1時間特化型人工知能により生成されました。
生成システム: Ultra Integrated Short-Session Murder Mystery Generator
特化仕様: 短時間完結・極限精度・文章完全性保証
生成日時: ${new Date().toLocaleString('ja-JP')}

© AI Generated Short-Session Murder Mystery Scenario
`;
  
  return content;
}

/**
 * ゲームマスターガイド生成
 */
function generateGameMasterGuide(sessionData, title) {
  const formData = sessionData.formData || {};
  const complexity = formData.complexity || 'standard';
  
  // 複雑さ別時間設定
  const timeSettings = {
    'simple': { total: '30分', intro: '5分', investigation: '20分', resolution: '5分' },
    'standard': { total: '45分', intro: '7分', investigation: '30分', resolution: '8分' },
    'complex': { total: '60分', intro: '10分', investigation: '40分', resolution: '10分' }
  };
  
  const time = timeSettings[complexity] || timeSettings['standard'];
  
  return `
================================================================================
                    ${title}
            30分-1時間特化ゲームマスター専用ガイド
================================================================================

【重要警告】このファイルには重大なネタバレが含まれています。
プレイヤーは絶対に見ないでください。

【基本情報】
参加人数: ${formData.participants || '未設定'}人
設定プレイ時間: ${time.total}（複雑さ：${getDisplayText('complexity', complexity)}）
トーン: ${getDisplayText('tone', formData.tone)}

【${time.total}完結進行チェックリスト】
□ 開始前準備（ハンドアウト・証拠・タイマー）
□ 導入（${time.intro}）: ルール説明・事件発生
□ 調査（${time.investigation}）: 証拠収集・推理構築
□ 解決（${time.resolution}）: 真相公開・完結
□ 時間管理の徹底確認

【短時間進行の重要ポイント】
- 情報は段階的だが迅速に提供
- 参加者の理解度を常時チェック
- 行き詰まり時は即座にヒント提供
- 時間配分の厳密な管理

【緊急時対応】
- 進行遅れ: 重要証拠を直接提示
- 推理停滞: 3段階ヒントシステム活用
- 時間不足: 簡潔な真相公開で確実完結

${sessionData.phases?.step5?.content?.gamemaster_guide || '詳細なGM指示は個別ファイルを参照してください。'}
`;
}

/**
 * プレイヤー配布資料生成
 */
/**
 * 個別プレイヤーハンドアウト生成（5時間対応）
 */
function generatePlayerHandout(sessionData, title, playerNumber) {
  const characters = sessionData.phases?.step2?.content?.characters || '';
  const formData = sessionData.formData || {};
  const complexity = formData.complexity || 'standard';
  
  // 複雑さ別時間設定
  const timeSettings = {
    'simple': { total: '30分', phases: ['導入(5分)', '調査(20分)', '解決(5分)'] },
    'standard': { total: '45分', phases: ['導入(7分)', '調査(30分)', '解決(8分)'] },
    'complex': { total: '60分', phases: ['導入(10分)', '調査(40分)', '解決(10分)'] }
  };
  
  const time = timeSettings[complexity] || timeSettings['standard'];
  
  // キャラクター情報から特定プレイヤーの情報を抽出
  const playerPattern = new RegExp(`プレイヤー${playerNumber}[\\s\\S]*?(?=プレイヤー${playerNumber + 1}|$)`, 'i');
  let playerContent = characters.match(playerPattern)?.[0] || '';
  
  if (!playerContent) {
    // 代替パターンで検索
    const altPattern = new RegExp(`キャラクター${playerNumber}[\\s\\S]*?(?=キャラクター${playerNumber + 1}|$)`, 'i');
    playerContent = characters.match(altPattern)?.[0] || '';
  }
  
  return `
================================================================================
                        ${title}
            プレイヤー${playerNumber} 専用ハンドアウト（${time.total}特化）
================================================================================

【絶対警告】
これはプレイヤー${playerNumber}専用の資料です。
他のプレイヤーや他のハンドアウトファイルは絶対に見ないでください！

${playerContent || `プレイヤー${playerNumber}の詳細情報を生成中...`}

【${time.total}セッション完結ガイド】

■ ${time.phases[0]}: キャラクター紹介・事件発生
- あなたのキャラクターを簡潔に紹介
- 他プレイヤーとの関係性を即座に確認
- 事件発生時の初期行動を決定

■ ${time.phases[1]}: 効率的調査・推理構築
- 重要証拠の迅速な収集
- 他キャラクターからの証言聴取
- あなたの秘密情報を戦略的に活用
- 短時間で論理的推理を構築

■ ${time.phases[2]}: 最終推理・真相解明
- 決定的な推理の発表
- 犯人特定・投票参加
- 真相公開・満足のエピローグ

【短時間セッションの重要戦略】
- 時間効率を意識した行動
- 重要情報の見極めと活用
- 他プレイヤーとの効果的な情報交換
- あなたの目標達成への集中
- 秘密の情報は適切なタイミングで活用

【勝利への道筋】
- あなたの特別な情報を最大限活用
- 短時間で確実に推理を構築
- ${time.total}で必ず解決に導く
`;
}

/**
 * 導入ハンドアウト生成（全プレイヤー配布用）
 */
function generateIntroductionHandout(sessionData, title) {
  const concept = sessionData.phases?.step1?.content?.concept || '';
  const formData = sessionData.formData || {};
  const complexity = formData.complexity || 'standard';
  
  // 複雑さ別時間設定
  const timeSettings = {
    'simple': { total: '30分', description: '短時間集中型' },
    'standard': { total: '45分', description: 'バランス型' },
    'complex': { total: '60分', description: '本格長時間型' }
  };
  
  const time = timeSettings[complexity] || timeSettings['standard'];
  
  // 導入シナリオを抽出
  const introPattern = /## 導入シナリオ[^\n]*\n([\s\S]*?)(?=##|$)/;
  const introContent = concept.match(introPattern)?.[1] || '';
  
  return `
================================================================================
                        ${title}
                導入シナリオ（全員配布用・${time.total}特化）
================================================================================

【これは全プレイヤーに配布される共通資料です】

${introContent || '魅力的な導入ストーリーを準備中...'}

【${time.total}セッション概要】
プレイ時間: ${time.total}（${time.description}）
参加人数: ${sessionData.formData?.participants || 5}人
複雑さ: ${getDisplayText('complexity', complexity)}
トーン: ${getDisplayText('tone', formData.tone)}

【${time.total}完結の流れ】
導入: ルール説明・世界観・事件発生
調査: 証拠収集・証言聴取・推理構築
解決: 最終推理・真相公開・完結

【短時間セッション基本ルール】
1. 自分のキャラクターになりきってプレイ
2. 時間効率を意識した行動・発言
3. 他プレイヤーとの効果的な情報交換
4. 個別ハンドアウトの秘密情報は厳守
5. ${time.total}で確実に真犯人を推理

【重要な注意事項】
- 他プレイヤーの個別ハンドアウトは絶対に見ない
- ゲームマスター専用資料も絶対に見ない
- 分からないことは即座にGMに質問
- 時間を意識しながら楽しく参加
- ${time.total}で必ず完結することを意識

準備はよろしいでしょうか？
それでは、${time.total}完結の${title}の世界へようこそ！
`;
}

/**
 * シナリオ情報生成
 */
function generateScenarioInfo(sessionData) {
  const formData = sessionData.formData || {};
  
  return `
================================================================================
                        シナリオ情報
================================================================================

【生成設定】
参加人数: ${formData.participants || '未設定'}人
時代背景: ${getDisplayText('era', formData.era)}
舞台設定: ${getDisplayText('setting', formData.setting)}
世界観: ${getDisplayText('worldview', formData.worldview)}
トーン: ${getDisplayText('tone', formData.tone)}
事件種類: ${getDisplayText('incident_type', formData.incident_type)}
複雑さ: ${getDisplayText('complexity', formData.complexity)}

【特殊要素】
レッドヘリング: ${formData.red_herring ? '有効' : '無効'}
どんでん返し: ${formData.twist_ending ? '有効' : '無効'}
秘密の役割: ${formData.secret_roles ? '有効' : '無効'}

【生成情報】
セッションID: ${sessionData.sessionId || '未設定'}
生成開始: ${sessionData.startTime || '未設定'}
生成完了: ${sessionData.completedAt || '未設定'}
生成システム: Ultra Integrated Murder Mystery Generator

【ファイル構成】
- complete_scenario.txt: 完全シナリオ
- gamemaster_guide.txt: GM専用ガイド
- player_handout.txt: プレイヤー配布資料
- 01-08_*.txt: 個別フェーズファイル
- scenario_info.txt: このファイル
`;
}

// ユーティリティ関数
const displayMappings = {
  era: { 'modern': '現代', 'showa': '昭和', 'near-future': '近未来', 'fantasy': 'ファンタジー' },
  setting: { 'closed-space': '閉鎖空間', 'mountain-villa': '山荘', 'city': '都市部' },
  worldview: { 'realistic': 'リアル志向', 'occult': 'オカルト', 'sci-fi': 'SF', 'mystery': '純粋ミステリー' },
  tone: { 'serious': 'シリアス', 'comedy': 'コメディ', 'horror': 'ホラー', 'adventure': '冒険活劇' },
  incident_type: { 'murder': '殺人事件', 'disappearance': '失踪事件', 'theft': '盗難事件' },
  complexity: { 'simple': 'シンプル', 'standard': '標準', 'complex': '複雑' }
};

function getDisplayText(field, value) {
  return displayMappings[field]?.[value] || value || '未設定';
}

function extractBasicInfo(concept) {
  if (!concept) return '基本情報が生成されていません。';
  
  const sections = concept.split('##');
  const basicSections = sections.filter(section => 
    section.includes('作品タイトル') || 
    section.includes('基本コンセプト') ||
    section.includes('世界観・設定') ||
    section.includes('舞台詳細')
  );
  
  return basicSections.join('\n\n## ').trim() || concept.substring(0, 500) + '...';
}

// メインハンドラー
export default withErrorHandler(async function handler(req, res) {
  
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    throw new AppError('Method not allowed. Use POST.', ErrorTypes.VALIDATION_ERROR);
  }

  // レート制限チェック（APIタイプ - 中程度の制限）
  const securityMiddleware = createSecurityMiddleware('api');
  try {
    await new Promise((resolve, reject) => {
      securityMiddleware(req, res, (error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  } catch (securityError) {
    // Rate limiter already sent response
    return;
  }

  const { sessionData } = req.body;
  
  if (!sessionData) {
    throw new AppError('Session data is required', ErrorTypes.VALIDATION_ERROR);
  }
  
  
  // テキストファイル生成
  const textFiles = await generateTextFiles(sessionData);
  
  // ZIPパッケージ作成
  const zip = new JSZip();
  
  Object.entries(textFiles).forEach(([filename, content]) => {
    zip.file(filename, content);
  });
  
  // 画像情報（もしあれば）
  if (sessionData.generatedImages?.length > 0) {
    const imageFolder = zip.folder('images');
    sessionData.generatedImages.forEach((img, index) => {
      if (img.status === 'success' && img.url) {
        imageFolder.file(`image_${index + 1}_info.txt`, 
          `画像URL: ${img.url}\nプロンプト: ${img.prompt}\n\n※この画像は別途ダウンロードが必要です`);
      }
    });
  }
  
  const zipBuffer = await zip.generateAsync({ 
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });
  
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="murder_mystery_scenario.zip"');
  res.setHeader('Content-Length', zipBuffer.length);
  
  return res.status(200).send(zipBuffer);
}, 'export');