/**
 * 強化版PDF生成API - 安定性とエラーハンドリング重視
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { withMemoryOptimization, processLargeContent, getMemoryUsage } from './pdf-memory-optimizer.js';

export const config = {
  maxDuration: 90, // PDF生成用に延長
};

// グローバルフォントキャッシュ
let fontCache = null;

/**
 * フォントを安全に初期化
 */
async function initializeFonts(pdfDoc) {
  if (fontCache) {
    return fontCache;
  }

  try {
    console.log('🔤 フォント初期化開始...');
    
    fontCache = {
      regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
      bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
      italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
      mono: await pdfDoc.embedFont(StandardFonts.Courier)
    };
    
    console.log('✅ フォント初期化完了');
    return fontCache;
  } catch (error) {
    console.error('❌ フォント初期化エラー:', error);
    throw new Error(`フォント読み込み失敗: ${error.message}`);
  }
}

/**
 * テキストを安全に処理
 */
function sanitizeText(text, maxLength = 85) {
  if (!text || typeof text !== 'string') {
    return '';
  }
  
  // 日本語文字を安全な文字に置換
  const sanitized = text
    .replace(/[^\x00-\x7F\s]/g, '●')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();
    
  return sanitized.length > maxLength 
    ? sanitized.substring(0, maxLength) + '...'
    : sanitized;
}

/**
 * メモリ効率的なページ追加
 */
function addContentPage(pdfDoc, fonts, title, content, icon = '📄') {
  try {
    console.log(`📄 ページ追加: ${title}`);
    
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    let yPos = height - 60;
    
    // ページヘッダー
    page.drawRectangle({
      x: 0,
      y: height - 50,
      width: width,
      height: 50,
      color: rgb(0.95, 0.95, 0.98),
    });
    
    // タイトル
    const titleText = sanitizeText(`${icon} ${title}`, 50);
    page.drawText(titleText, {
      x: 50,
      y: height - 35,
      size: 18,
      font: fonts.bold,
      color: rgb(0.2, 0.2, 0.8),
    });
    
    yPos = height - 80;
    
    // 大容量コンテンツの分割処理
    const contentChunks = processLargeContent(content, 5000);
    const lines = contentChunks.join('\n').split('\n').filter(line => line.trim()) || ['コンテンツなし'];
    
    for (const line of lines) {
      if (yPos < 80) {
        // 新しいページが必要
        page = pdfDoc.addPage();
        yPos = height - 60;
        
        // 継続ページのマーカー
        page.drawText(`${title} (続き)`, {
          x: 50,
          y: height - 30,
          size: 12,
          font: fonts.italic,
          color: rgb(0.5, 0.5, 0.5),
        });
        
        yPos = height - 60;
      }

      const processedLine = sanitizeText(line, 85);
      
      // 見出し判定（#で始まる行）
      const isHeader = line.trim().startsWith('#');
      const font = isHeader ? fonts.bold : fonts.regular;
      const size = isHeader ? 14 : 11;
      const color = isHeader ? rgb(0.1, 0.1, 0.7) : rgb(0, 0, 0);
      
      page.drawText(processedLine, {
        x: 50,
        y: yPos,
        size: size,
        font: font,
        color: color,
      });
      
      yPos -= isHeader ? 25 : 18;
    }
    
    return page;
  } catch (error) {
    console.error(`❌ ページ追加エラー (${title}):`, error);
    throw error;
  }
}

/**
 * シナリオデータを安全に解析
 */
function parseScenarioData(scenario) {
  try {
    if (typeof scenario === 'string') {
      // 文字列の場合はそのまま使用
      return {
        mainContent: scenario,
        phases: {},
        metadata: {}
      };
    }
    
    if (scenario && typeof scenario === 'object') {
      return {
        mainContent: scenario.content || JSON.stringify(scenario, null, 2),
        phases: scenario.phases || {},
        metadata: scenario.metadata || {}
      };
    }
    
    return {
      mainContent: 'シナリオデータが見つかりません',
      phases: {},
      metadata: {}
    };
  } catch (error) {
    console.error('❌ シナリオデータ解析エラー:', error);
    return {
      mainContent: 'シナリオデータの解析に失敗しました',
      phases: {},
      metadata: {}
    };
  }
}

export default async function handler(req, res) {
  const startTime = Date.now();
  
  console.log('🚀 強化版PDF生成API開始');
  
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  // メモリ最適化ラッパーで実行
  return withMemoryOptimization(async () => {
    let pdfDoc = null;
    
      const { scenario, title = 'マーダーミステリーシナリオ' } = req.body;

    // 入力バリデーション
    if (!scenario) {
      return res.status(400).json({ 
        success: false, 
        error: 'シナリオデータが必要です' 
      });
    }

    console.log('📊 PDF生成開始:', title);
    
    // PDFドキュメント作成
    pdfDoc = await PDFDocument.create();
    console.log('✅ PDFドキュメント作成完了');
    
    // フォント初期化
    const fonts = await initializeFonts(pdfDoc);
    
    // シナリオデータ解析
    const parsedScenario = parseScenarioData(scenario);
    
    // タイトルページ作成
    const titlePage = pdfDoc.addPage();
    const { width, height } = titlePage.getSize();
    
    // グラデーション背景
    titlePage.drawRectangle({
      x: 0,
      y: height - 200,
      width: width,
      height: 200,
      color: rgb(0.1, 0.1, 0.3),
    });
    
    // メインタイトル
    const titleText = sanitizeText(title, 40);
    titlePage.drawText(titleText, {
      x: 50,
      y: height - 100,
      size: 24,
      font: fonts.bold,
      color: rgb(1, 1, 1),
    });

    // サブタイトル
    titlePage.drawText('AI Generated Murder Mystery', {
      x: 50,
      y: height - 130,
      size: 14,
      font: fonts.italic,
      color: rgb(0.8, 0.8, 1),
    });

    // 生成日時
    titlePage.drawText(`Generated: ${new Date().toLocaleString('ja-JP')}`, {
      x: 50,
      y: height - 160,
      size: 12,
      font: fonts.regular,
      color: rgb(0.7, 0.7, 0.7),
    });

    // 参加者数（メタデータから取得）
    if (parsedScenario.metadata.participants) {
      titlePage.drawText(`Players: ${parsedScenario.metadata.participants}`, {
        x: 50,
        y: height - 180,
        size: 12,
        font: fonts.regular,
        color: rgb(0.7, 0.7, 0.7),
      });
    }

    console.log('📄 コンテンツページ追加開始');

    // メインシナリオページ
    addContentPage(pdfDoc, fonts, 'シナリオ概要', parsedScenario.mainContent, '🎭');

    // フェーズ別コンテンツ
    if (parsedScenario.phases && Object.keys(parsedScenario.phases).length > 0) {
      console.log('📋 フェーズ別コンテンツ追加');
      
      const phaseNames = {
        phase1: 'コンセプト',
        phase2: 'キャラクター',
        phase3: '人間関係',
        phase4: '事件詳細',
        phase5: '証拠・手がかり',
        phase6: 'タイムライン',
        phase7: '解決',
        phase8: 'ゲームマスターガイド'
      };

      for (const [phaseKey, phaseData] of Object.entries(parsedScenario.phases)) {
        const phaseName = phaseNames[phaseKey] || phaseKey;
        const content = phaseData.content || JSON.stringify(phaseData, null, 2);
        
        addContentPage(pdfDoc, fonts, phaseName, content, '📋');
      }
    }

    console.log('💾 PDF保存処理開始');
    
    // PDF生成とバイナリ化
    const pdfBytes = await pdfDoc.save();
    const pageCount = pdfDoc.getPageCount();
    
    console.log(`✅ PDF生成完了: ${pdfBytes.length}bytes, ${pageCount}ページ`);

    // レスポンス（Base64ではなくバイナリで返す）
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(title)}.pdf"`);
    res.setHeader('Content-Length', pdfBytes.length);
    
      return res.status(200).send(Buffer.from(pdfBytes));

    } catch (error) {
      console.error('❌ PDF生成エラー:', error);
      
      // メモリクリーンアップ
      if (pdfDoc) {
        try {
          pdfDoc = null;
        } catch (cleanupError) {
          console.error('❌ PDF クリーンアップエラー:', cleanupError);
        }
      }
      
      const processingTime = Date.now() - startTime;
      const memoryUsage = getMemoryUsage();
      
      return res.status(500).json({ 
        success: false, 
        error: 'PDF生成に失敗しました',
        details: error.message,
        processingTime: `${processingTime}ms`,
        memoryUsage,
        timestamp: new Date().toISOString()
      });
    }
  });
}