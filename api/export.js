/**
 * 🚀 Unified Export System - 統合ZIP生成API
 * 全機能統合・最適化済み・プロダクション対応
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
  
  // 5時間対応メインファイル生成
  files[`${sanitizedTitle}_complete_scenario.txt`] = generateCompleteScenario(sessionData, title);
  files[`${sanitizedTitle}_gamemaster_guide.txt`] = generateGameMasterGuide(sessionData, title);
  files[`${sanitizedTitle}_introduction_handout.txt`] = generateIntroductionHandout(sessionData, title);
  
  // 参加者別個別ハンドアウト生成
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
                    完全シナリオドキュメント
================================================================================

【基本情報】
参加人数: ${formData.participants || '未設定'}人
時代背景: ${getDisplayText('era', formData.era)}
舞台設定: ${getDisplayText('setting', formData.setting)}
複雑さ: ${getDisplayText('complexity', formData.complexity)}
生成日時: ${new Date(sessionData.startTime || Date.now()).toLocaleString('ja-JP')}

================================================================================
目次
================================================================================
1. コンセプト・世界観
2. キャラクター設定
3. 人物関係
4. 事件・謎の構造
5. 手がかり・証拠
6. タイムライン
7. 真相・解決編
8. ゲームマスターガイド

`;

  // 統合マイクロ生成の各ステップ内容を追加
  const stepNames = {
    step1: '1. 作品タイトル・コンセプト',
    step2: '2. キャラクター完全設計', 
    step3: '3. 事件・謎・真相構築',
    step4: '4. タイムライン・進行管理',
    step5: '5. ゲームマスター完全ガイド'
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

このシナリオは人工知能により生成されました。
生成システム: Ultra Integrated Murder Mystery Generator
生成日時: ${new Date().toLocaleString('ja-JP')}

© AI Generated Murder Mystery Scenario
`;
  
  return content;
}

/**
 * ゲームマスターガイド生成
 */
function generateGameMasterGuide(sessionData, title) {
  const formData = sessionData.formData || {};
  
  return `
================================================================================
                    ${title}
                ゲームマスター専用ガイド
================================================================================

【重要】このファイルには重大なネタバレが含まれています。
プレイヤーは絶対に見ないでください。

【基本情報】
参加人数: ${formData.participants || '未設定'}人
推定プレイ時間: 2-3時間

【クイックリファレンス】
真犯人: [真相セクションを参照]
決定的証拠: [手がかりセクションを参照]
重要なタイミング: [タイムラインセクションを参照]

【進行チェックリスト】
□ 開始前準備完了
□ キャラクター配布
□ 基本ルール説明
□ 各フェーズ進行
□ 最終推理タイム
□ 真相公開
□ 感想戦

【タイムマネジメント】
- 開始: 15分（説明・準備）
- 調査フェーズ: 60分
- 議論フェーズ: 45分
- 推理発表: 30分
- 真相公開: 15分
- 感想戦: 15分

${sessionData.phases?.phase8?.gamemaster || '詳細なGM指示は個別ファイルを参照してください。'}
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
                プレイヤー${playerNumber} 専用ハンドアウト
================================================================================

【重要警告】
これはプレイヤー${playerNumber}専用の資料です。
他のプレイヤーや他のハンドアウトファイルは絶対に見ないでください！

${playerContent || `プレイヤー${playerNumber}の詳細情報を生成中...`}

【5時間セッション専用ガイド】

■ 第1時間 (0-60分): 導入・キャラクター紹介
- あなたのキャラクターを他のプレイヤーに紹介
- 初期の関係性を確認
- 事件発生時の行動を決定

■ 第2時間 (60-120分): 初期調査
- 基本的な証拠収集
- 他キャラクターからの初期証言聴取
- あなたの秘密情報を活用

■ 第3時間 (120-180分): 詳細調査
- より深い調査を実行
- 隠された情報の発見
- 他プレイヤーとの情報交換

■ 第4時間 (180-240分): 推理・議論
- これまでの情報を整理
- 仮説を構築して発表
- 他プレイヤーの推理を検証

■ 第5時間 (240-300分): 最終推理・真相
- 最終的な犯人推理
- 投票・決定
- 真相公開・エピローグ

【重要な注意事項】
- あなたの秘密は絶対に守る
- 目標達成のために戦略的に行動
- 他プレイヤーとの会話・交渉を活用
- 最後まで諦めずに推理を続ける
`;
}

/**
 * 導入ハンドアウト生成（全プレイヤー配布用）
 */
function generateIntroductionHandout(sessionData, title) {
  const concept = sessionData.phases?.step1?.content?.concept || '';
  
  // 導入シナリオを抽出
  const introPattern = /## 導入シナリオ[^\n]*\n([\s\S]*?)(?=##|$)/;
  const introContent = concept.match(introPattern)?.[1] || '';
  
  return `
================================================================================
                        ${title}
                    導入シナリオ（全員配布用）
================================================================================

【これは全プレイヤーに配布される共通資料です】

${introContent || '魅力的な導入ストーリーを準備中...'}

【ゲームセッション概要】
プレイ時間: 5時間（300分）
参加人数: ${sessionData.formData?.participants || 5}人
複雑さ: ${sessionData.formData?.complexity || '標準'}
トーン: ${sessionData.formData?.tone || 'シリアス'}

【5時間の流れ】
第1時間: 導入・キャラクター紹介・事件発生
第2時間: 初期調査・基本証拠収集
第3時間: 詳細調査・深層情報収集
第4時間: 推理・議論・仮説構築
第5時間: 最終推理・真相公開・エピローグ

【基本ルール】
1. 自分のキャラクターになりきってプレイ
2. 他プレイヤーとの会話・交渉は自由
3. 嘘をつくことも戦略として有効
4. 個別ハンドアウトの情報は秘密を守る
5. 最終的に真犯人を推理して投票

【注意事項】
- 他プレイヤーの個別ハンドアウトは見てはいけません
- ゲームマスター専用資料も見てはいけません
- 分からないことはゲームマスターに質問
- 楽しみながら最後まで参加してください

準備はよろしいでしょうか？
それでは、${title}の世界へようこそ！
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
  console.log('🚀 Unified Export System called:', req.method);
  
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
  
  console.log('🔄 Generating optimized text files export...');
  
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