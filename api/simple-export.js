/**
 * 🚀 Simple Export System - テキストファイル出力専用
 * PDF複雑さを排除し、シンプルなテキスト出力に特化
 */

import './startup.js';
import JSZip from 'jszip';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 60,
};

/**
 * シンプルなテキストファイル出力システム
 */
async function generateTextFiles(sessionData) {
  const files = {};
  
  // タイトル抽出
  const concept = sessionData.phases?.phase1?.concept || '';
  const titleMatch = concept.match(/## 作品タイトル[\s\S]*?\n([^\n]+)/);
  const title = titleMatch ? titleMatch[1].trim() : 'マーダーミステリーシナリオ';
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\\-_]/g, '_');
  
  // メインシナリオファイル
  files[`${sanitizedTitle}_complete_scenario.txt`] = generateCompleteScenario(sessionData, title);
  
  // ゲームマスター用ファイル
  files[`${sanitizedTitle}_gamemaster_guide.txt`] = generateGameMasterGuide(sessionData, title);
  
  // プレイヤー配布用ファイル
  files[`${sanitizedTitle}_player_handout.txt`] = generatePlayerHandout(sessionData, title);
  
  // 個別フェーズファイル
  const phases = {
    '01_concept.txt': sessionData.phases?.phase1?.concept,
    '02_characters.txt': sessionData.phases?.phase2?.characters,
    '03_relationships.txt': sessionData.phases?.phase3?.relationships,
    '04_incident.txt': sessionData.phases?.phase4?.incident,
    '05_clues.txt': sessionData.phases?.phase5?.clues,
    '06_timeline.txt': sessionData.phases?.phase6?.timeline,
    '07_solution.txt': sessionData.phases?.phase7?.solution,
    '08_gamemaster.txt': sessionData.phases?.phase8?.gamemaster
  };
  
  Object.entries(phases).forEach(([filename, content]) => {
    if (content) {
      files[filename] = content;
    }
  });
  
  // 設定情報
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
生成日時: ${new Date(sessionData.startTime).toLocaleString('ja-JP')}

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

  // 各フェーズの内容を追加
  const phaseNames = {
    phase1: '1. コンセプト・世界観',
    phase2: '2. キャラクター設定', 
    phase3: '3. 人物関係',
    phase4: '4. 事件・謎の構造',
    phase5: '5. 手がかり・証拠',
    phase6: '6. タイムライン',
    phase7: '7. 真相・解決編',
    phase8: '8. ゲームマスターガイド'
  };
  
  Object.entries(phaseNames).forEach(([phaseKey, phaseName]) => {
    const phaseContent = phases[phaseKey]?.concept || phases[phaseKey]?.characters || 
                        phases[phaseKey]?.relationships || phases[phaseKey]?.incident ||
                        phases[phaseKey]?.clues || phases[phaseKey]?.timeline ||
                        phases[phaseKey]?.solution || phases[phaseKey]?.gamemaster;
    
    if (phaseContent) {
      content += `
================================================================================
${phaseName}
================================================================================

${phaseContent}

`;
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

【トラブル対応】
- 進行が遅れる場合: タイムライン調整
- 推理が外れる場合: 追加ヒント提供
- 参加者が困る場合: 個別フォロー
- 議論が停滞する場合: 新しい情報提供

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
function generatePlayerHandout(sessionData, title) {
  const concept = sessionData.phases?.phase1?.concept || '';
  const basicInfo = extractBasicInfo(concept);
  
  return `
================================================================================
                        ${title}
                    プレイヤー配布資料
================================================================================

【重要】これはプレイヤー用の資料です。
ゲームマスター専用ファイルは絶対に見ないでください。

${basicInfo}

【ゲームの流れ】
1. キャラクター紹介
2. 事件発生の説明
3. 調査・情報収集
4. 議論・推理
5. 最終推理発表
6. 真相公開

【注意事項】
- 自分のキャラクターになりきってプレイしてください
- 他のプレイヤーとの会話や交渉を楽しんでください
- 嘘をつくことも戦略の一部です
- 最後まで楽しんでください

【禁止事項】
- ゲームマスター専用資料の閲覧
- メタ情報の使用
- ゲーム外の知識の持ち込み
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

【使用方法】
1. GMは gamemaster_guide.txt を最初に読んでください
2. プレイヤーには player_handout.txt のみを配布してください
3. 詳細情報は個別フェーズファイルを参照してください
`;
}

// ユーティリティ関数
function getDisplayText(field, value) {
  const mappings = {
    era: {
      'modern': '現代',
      'showa': '昭和',
      'near-future': '近未来',
      'fantasy': 'ファンタジー'
    },
    setting: {
      'closed-space': '閉鎖空間',
      'mountain-villa': '山荘',
      'city': '都市部'
    },
    worldview: {
      'realistic': 'リアル志向',
      'occult': 'オカルト',
      'sci-fi': 'SF',
      'mystery': '純粋ミステリー'
    },
    tone: {
      'serious': 'シリアス',
      'comedy': 'コメディ',
      'horror': 'ホラー',
      'adventure': '冒険活劇'
    },
    incident_type: {
      'murder': '殺人事件',
      'disappearance': '失踪事件',
      'theft': '盗難事件',
      'blackmail': '恐喝事件',
      'fraud': '詐欺事件'
    },
    complexity: {
      'simple': 'シンプル',
      'standard': '標準',
      'complex': '複雑'
    }
  };
  
  return mappings[field]?.[value] || value || '未設定';
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
export default async function handler(req, res) {
  console.log('🚀 Simple Export System called:', req.method);
  
  setSecurityHeaders(res);
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { sessionData } = req.body;
    
    if (!sessionData) {
      throw new AppError('Session data is required', ErrorTypes.VALIDATION_ERROR);
    }
    
    console.log('🔄 Generating text files export...');
    
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
    
  } catch (error) {
    console.error('🚨 Simple Export System error:', error);
    
    // より詳細なエラー情報
    const errorResponse = {
      success: false,
      error: error.message || 'Export generation failed',
      errorType: error.constructor.name,
      timestamp: new Date().toISOString(),
      sessionDataKeys: sessionData ? Object.keys(sessionData) : 'missing'
    };
    
    if (process.env.NODE_ENV === 'development') {
      errorResponse.details = error.stack;
      errorResponse.sessionDataSample = sessionData ? JSON.stringify(sessionData).substring(0, 200) + '...' : 'no data';
    }
    
    return res.status(500).json(errorResponse);
  }
}