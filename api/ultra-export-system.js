/**
 * 🚀 Ultra Export System - PDF/ZIP統合出力システム
 * 完全なシナリオパッケージ生成 + 画像統合 + 自動最適化
 */

import './startup.js';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { withErrorHandler, AppError, ErrorTypes } from './utils/error-handler.js';
import { setSecurityHeaders } from './security-utils.js';

export const config = {
  maxDuration: 120,
};

// PDF生成用のスタイル設定
const PDF_STYLES = {
  title: {
    font: StandardFonts.HelveticaBold,
    size: 24,
    color: rgb(0.2, 0.2, 0.8)
  },
  heading: {
    font: StandardFonts.HelveticaBold,
    size: 18,
    color: rgb(0.1, 0.1, 0.1)
  },
  subheading: {
    font: StandardFonts.HelveticaBold,
    size: 14,
    color: rgb(0.3, 0.3, 0.3)
  },
  body: {
    font: StandardFonts.Helvetica,
    size: 12,
    color: rgb(0, 0, 0)
  },
  margin: {
    top: 50,
    bottom: 50,
    left: 50,
    right: 50
  }
};

/**
 * 完全PDFドキュメント生成
 */
async function generateCompletePDF(sessionData) {
  const pdfDoc = await PDFDocument.create();
  
  // フォントを埋め込み
  const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const headingFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  
  // 表紙ページ
  await addCoverPage(pdfDoc, sessionData, titleFont, headingFont, bodyFont);
  
  // 目次ページ
  await addTableOfContents(pdfDoc, sessionData, headingFont, bodyFont);
  
  // 各フェーズの詳細ページ
  const phases = [
    { key: 'phase1', title: 'コンセプト・世界観', content: sessionData.phases?.phase1?.concept },
    { key: 'phase2', title: 'キャラクター設定', content: sessionData.phases?.phase2?.characters },
    { key: 'phase3', title: '人物関係', content: sessionData.phases?.phase3?.relationships },
    { key: 'phase4', title: '事件・謎', content: sessionData.phases?.phase4?.incident },
    { key: 'phase5', title: '手がかり・証拠', content: sessionData.phases?.phase5?.clues },
    { key: 'phase6', title: 'タイムライン', content: sessionData.phases?.phase6?.timeline },
    { key: 'phase7', title: '真相・解決', content: sessionData.phases?.phase7?.solution },
    { key: 'phase8', title: 'ゲームマスターガイド', content: sessionData.phases?.phase8?.gamemaster }
  ];
  
  for (const phase of phases) {
    if (phase.content) {
      await addContentPage(pdfDoc, phase.title, phase.content, headingFont, bodyFont);
    }
  }
  
  // プレイヤー配布用ページ
  await addPlayerHandouts(pdfDoc, sessionData, headingFont, bodyFont);
  
  // GM専用ページ
  await addGMPages(pdfDoc, sessionData, headingFont, bodyFont);
  
  return await pdfDoc.save();
}

/**
 * 表紙ページ追加
 */
async function addCoverPage(pdfDoc, sessionData, titleFont, headingFont, bodyFont) {
  const page = pdfDoc.addPage([595, 842]); // A4サイズ
  const { width, height } = page.getSize();
  
  // タイトル抽出
  const concept = sessionData.phases?.phase1?.concept || '';
  const titleMatch = concept.match(/##\\s*作品タイトル[\\s\\S]*?\\n([^\\n]+)/);
  const scenarioTitle = titleMatch ? titleMatch[1].trim() : 'マーダーミステリーシナリオ';
  
  // タイトル描画
  page.drawText(scenarioTitle, {
    x: 50,
    y: height - 100,
    size: 28,
    font: titleFont,
    color: rgb(0.2, 0.2, 0.8),
  });
  
  // サブタイトル
  page.drawText('完全シナリオパッケージ', {
    x: 50,
    y: height - 140,
    size: 16,
    font: headingFont,
    color: rgb(0.4, 0.4, 0.4),
  });
  
  // 基本情報
  const formData = sessionData.formData || {};
  const infoY = height - 200;
  const infoLines = [
    `参加人数: ${formData.participants || '未設定'}人`,
    `時代背景: ${getDisplayText('era', formData.era)}`,
    `舞台設定: ${getDisplayText('setting', formData.setting)}`,
    `複雑さ: ${getDisplayText('complexity', formData.complexity)}`,
    `生成日時: ${new Date(sessionData.startTime).toLocaleString('ja-JP')}`
  ];
  
  infoLines.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: infoY - (index * 25),
      size: 12,
      font: bodyFont,
      color: rgb(0, 0, 0),
    });
  });
  
  // 注意事項
  const warningY = 200;
  const warningText = [
    '【重要】このシナリオには重大なネタバレが含まれています。',
    'プレイヤーとして参加する予定の方は絶対に閲覧しないでください。',
    '',
    '© AI Generated Murder Mystery Scenario',
    '本シナリオは人工知能により生成されました。'
  ];
  
  warningText.forEach((line, index) => {
    page.drawText(line, {
      x: 50,
      y: warningY - (index * 20),
      size: 10,
      font: bodyFont,
      color: rgb(0.6, 0, 0),
    });
  });
}

/**
 * 目次ページ追加
 */
async function addTableOfContents(pdfDoc, sessionData, headingFont, bodyFont) {
  const page = pdfDoc.addPage([595, 842]);
  const { height } = page.getSize();
  
  page.drawText('目次', {
    x: 50,
    y: height - 80,
    size: 20,
    font: headingFont,
    color: rgb(0, 0, 0),
  });
  
  const tocItems = [
    '1. コンセプト・世界観',
    '2. キャラクター設定',
    '3. 人物関係',
    '4. 事件・謎の構造',
    '5. 手がかり・証拠',
    '6. タイムライン',
    '7. 真相・解決編',
    '8. ゲームマスターガイド',
    '9. プレイヤー配布資料',
    '10. GM専用資料'
  ];
  
  tocItems.forEach((item, index) => {
    page.drawText(item, {
      x: 70,
      y: height - 130 - (index * 25),
      size: 12,
      font: bodyFont,
      color: rgb(0, 0, 0),
    });
  });
}

/**
 * コンテンツページ追加
 */
async function addContentPage(pdfDoc, title, content, headingFont, bodyFont) {
  const page = pdfDoc.addPage([595, 842]);
  const { height } = page.getSize();
  
  // タイトル
  page.drawText(title, {
    x: 50,
    y: height - 80,
    size: 18,
    font: headingFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  // コンテンツを整形して描画
  const lines = formatContentForPDF(content);
  let yPosition = height - 120;
  
  for (const line of lines) {
    if (yPosition < 80) {
      // 新しいページが必要
      const newPage = pdfDoc.addPage([595, 842]);
      yPosition = newPage.getSize().height - 80;
      
      newPage.drawText(line.text, {
        x: 50 + (line.indent || 0),
        y: yPosition,
        size: line.size || 12,
        font: line.bold ? headingFont : bodyFont,
        color: rgb(0, 0, 0),
      });
    } else {
      page.drawText(line.text, {
        x: 50 + (line.indent || 0),
        y: yPosition,
        size: line.size || 12,
        font: line.bold ? headingFont : bodyFont,
        color: rgb(0, 0, 0),
      });
    }
    
    yPosition -= line.height || 18;
  }
}

/**
 * プレイヤー配布資料ページ
 */
async function addPlayerHandouts(pdfDoc, sessionData, headingFont, bodyFont) {
  const page = pdfDoc.addPage([595, 842]);
  const { height } = page.getSize();
  
  page.drawText('プレイヤー配布資料', {
    x: 50,
    y: height - 80,
    size: 18,
    font: headingFont,
    color: rgb(0.1, 0.1, 0.1),
  });
  
  // 基本情報のみを抽出（ネタバレなし）
  const concept = sessionData.phases?.phase1?.concept || '';
  const basicInfo = extractBasicInfo(concept);
  
  const lines = formatContentForPDF(basicInfo);
  let yPosition = height - 120;
  
  for (const line of lines) {
    if (yPosition < 80) break; // ページ内に収める
    
    page.drawText(line.text, {
      x: 50 + (line.indent || 0),
      y: yPosition,
      size: line.size || 12,
      font: line.bold ? headingFont : bodyFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= line.height || 18;
  }
}

/**
 * GM専用ページ
 */
async function addGMPages(pdfDoc, sessionData, headingFont, bodyFont) {
  const page = pdfDoc.addPage([595, 842]);
  const { height } = page.getSize();
  
  page.drawText('ゲームマスター専用資料', {
    x: 50,
    y: height - 80,
    size: 18,
    font: headingFont,
    color: rgb(0.8, 0, 0),
  });
  
  // クイックリファレンス
  const quickRef = generateQuickReference(sessionData);
  const lines = formatContentForPDF(quickRef);
  let yPosition = height - 120;
  
  for (const line of lines) {
    if (yPosition < 80) break;
    
    page.drawText(line.text, {
      x: 50 + (line.indent || 0),
      y: yPosition,
      size: line.size || 12,
      font: line.bold ? headingFont : bodyFont,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= line.height || 18;
  }
}

/**
 * ZIPパッケージ生成
 */
async function generateZIPPackage(sessionData, pdfBuffer) {
  const zip = new JSZip();
  
  // PDFファイル追加
  const title = extractTitle(sessionData.phases?.phase1?.concept) || 'murder_mystery_scenario';
  const sanitizedTitle = title.replace(/[^a-zA-Z0-9\\-_]/g, '_');
  zip.file(`${sanitizedTitle}_complete.pdf`, pdfBuffer);
  
  // 個別テキストファイル
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
      zip.file(filename, content);
    }
  });
  
  // 設定情報
  const configData = {
    scenario_info: {
      title: extractTitle(sessionData.phases?.phase1?.concept),
      generated_at: sessionData.startTime,
      participants: sessionData.formData?.participants,
      settings: sessionData.formData
    },
    generation_log: sessionData.progressUpdates || []
  };
  
  zip.file('scenario_config.json', JSON.stringify(configData, null, 2));
  
  // 画像ファイル（もしあれば）
  if (sessionData.generatedImages?.length > 0) {
    const imageFolder = zip.folder('images');
    sessionData.generatedImages.forEach((img, index) => {
      if (img.status === 'success' && img.url) {
        // 実際の本番環境では画像URLからダウンロードが必要
        imageFolder.file(`image_${index + 1}.txt`, `Image URL: ${img.url}\\nPrompt: ${img.prompt}`);
      }
    });
  }
  
  // プレイヤー用資料
  const playerFolder = zip.folder('player_materials');
  const basicInfo = extractBasicInfo(sessionData.phases?.phase1?.concept || '');
  playerFolder.file('basic_info.txt', basicInfo);
  
  // GM用資料
  const gmFolder = zip.folder('gm_materials');
  const quickRef = generateQuickReference(sessionData);
  gmFolder.file('quick_reference.txt', quickRef);
  
  return await zip.generateAsync({ type: 'nodebuffer' });
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
    complexity: {
      'simple': 'シンプル',
      'standard': '標準',
      'complex': '複雑'
    }
  };
  
  return mappings[field]?.[value] || value || '未設定';
}

function formatContentForPDF(content) {
  const lines = [];
  const textLines = content.split('\\n');
  
  textLines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) {
      lines.push({ text: '', height: 12 });
      return;
    }
    
    if (trimmed.startsWith('##')) {
      lines.push({ 
        text: trimmed.replace(/^##\\s*/, ''), 
        bold: true, 
        size: 14, 
        height: 20 
      });
    } else if (trimmed.startsWith('#')) {
      lines.push({ 
        text: trimmed.replace(/^#\\s*/, ''), 
        bold: true, 
        size: 16, 
        height: 22 
      });
    } else if (trimmed.startsWith('-')) {
      lines.push({ 
        text: `• ${trimmed.replace(/^-\\s*/, '')}`, 
        indent: 20, 
        height: 16 
      });
    } else {
      lines.push({ text: trimmed, height: 16 });
    }
  });
  
  return lines;
}

function extractTitle(concept) {
  if (!concept) return null;
  const match = concept.match(/##\\s*作品タイトル[\\s\\S]*?\\n([^\\n]+)/);
  return match ? match[1].trim() : null;
}

function extractBasicInfo(concept) {
  // ネタバレを除いた基本情報のみ抽出
  const sections = concept.split('##');
  const basicSections = sections.filter(section => 
    section.includes('作品タイトル') || 
    section.includes('基本コンセプト') ||
    section.includes('世界観・設定')
  );
  
  return basicSections.join('\\n\\n## ').trim();
}

function generateQuickReference(sessionData) {
  return `# クイックリファレンス

## 基本情報
- 参加人数: ${sessionData.formData?.participants || '未設定'}人
- 推定プレイ時間: 2-3時間

## 重要ポイント
- 真犯人: [真相セクションを参照]
- 決定的証拠: [手がかりセクションを参照]
- 注意すべき展開: [解決編を参照]

## 進行チェックリスト
□ 開始前準備完了
□ キャラクター配布
□ 基本説明実施
□ 各フェーズ進行
□ 最終推理
□ 真相公開
□ 感想戦

## トラブル対応
- 進行が遅れる場合: タイムライン調整
- 推理が外れる場合: 追加ヒント提供
- 参加者が困る場合: 個別フォロー
`;
}

// メインハンドラー
export default async function handler(req, res) {
  console.log('🚀 Ultra Export System called:', req.method);
  
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
    const { action, sessionData, format } = req.body;
    
    if (!sessionData) {
      throw new AppError('Session data is required', ErrorTypes.VALIDATION_ERROR);
    }
    
    console.log(`🔄 Generating ${format || 'PDF'} export...`);
    
    if (action === 'export_pdf' || format === 'pdf') {
      const pdfBuffer = await generateCompletePDF(sessionData);
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="murder_mystery_complete.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      return res.status(200).send(pdfBuffer);
    }
    
    if (action === 'export_zip' || format === 'zip') {
      const pdfBuffer = await generateCompletePDF(sessionData);
      const zipBuffer = await generateZIPPackage(sessionData, pdfBuffer);
      
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="murder_mystery_package.zip"');
      res.setHeader('Content-Length', zipBuffer.length);
      
      return res.status(200).send(zipBuffer);
    }
    
    if (action === 'export_both') {
      const pdfBuffer = await generateCompletePDF(sessionData);
      const zipBuffer = await generateZIPPackage(sessionData, pdfBuffer);
      
      return res.status(200).json({
        success: true,
        message: 'Both formats generated successfully',
        downloads: {
          pdf: {
            ready: true,
            size: pdfBuffer.length,
            downloadUrl: '/api/ultra-export-system?action=export_pdf'
          },
          zip: {
            ready: true,
            size: zipBuffer.length,
            downloadUrl: '/api/ultra-export-system?action=export_zip'
          }
        }
      });
    }
    
    throw new AppError('Invalid export action', ErrorTypes.VALIDATION_ERROR);
    
  } catch (error) {
    console.error('🚨 Ultra Export System error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Export generation failed',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}