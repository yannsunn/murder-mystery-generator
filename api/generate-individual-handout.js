// 🎭 Individual Handout PDF Generator - Ultra Enhanced
// Generates single-character PDF handouts with professional styling

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const config = {
  maxDuration: 45,
};

export default async function handler(req, res) {
  console.log('🎭 Individual Handout PDF Generation API called:', req.method);
  
  // Enhanced CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight handled');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    console.log('❌ Method not allowed:', req.method);
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    console.log('📝 Request body:', req.body);
    const { character, handout, scenarioTitle, quality } = req.body;

    // Enhanced validation
    if (!character || !handout) {
      console.log('❌ Invalid character or handout data');
      return res.status(400).json({ 
        success: false, 
        error: 'Character and handout data are required' 
      });
    }

    console.log(`📄 Creating individual PDF for: ${character.name || character}`);
    
    // PDFドキュメントの作成
    const pdfDoc = await PDFDocument.create();
    
    // 標準フォント使用（日本語互換性向上）
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const italicFont = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

    // 🎨 キャラクターハンドアウトページ（プロ仕様デザイン）
    let page = pdfDoc.addPage();
    const { width, height } = page.getSize();
    
    // Quality badge color
    const qualityColors = {
      'PLATINUM': rgb(0.9, 0.9, 0.95),
      'GOLD': rgb(1, 0.95, 0.8),
      'SILVER': rgb(0.95, 0.95, 0.95),
      'BRONZE': rgb(0.9, 0.85, 0.8),
      'PREMIUM': rgb(0.85, 0.9, 1),
      'STANDARD': rgb(0.9, 0.95, 0.9),
      'BASIC': rgb(0.95, 0.95, 0.9)
    };
    
    const bgColor = qualityColors[quality] || rgb(0.98, 0.98, 1);
    
    // 背景色
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: bgColor,
    });
    
    // ヘッダー背景
    page.drawRectangle({
      x: 0,
      y: height - 150,
      width: width,
      height: 150,
      color: rgb(0.1, 0.1, 0.3),
    });
    
    // 品質バッジ
    if (quality) {
      page.drawRectangle({
        x: width - 120,
        y: height - 40,
        width: 110,
        height: 30,
        color: rgb(0.2, 0.6, 0.9),
        borderColor: rgb(1, 1, 1),
        borderWidth: 2,
      });
      
      page.drawText(`🏆 ${quality}`, {
        x: width - 115,
        y: height - 32,
        size: 12,
        font: boldFont,
        color: rgb(1, 1, 1),
      });
    }
    
    // シナリオタイトル
    page.drawText(scenarioTitle || '🕵️ Murder Mystery Scenario', {
      x: 30,
      y: height - 50,
      size: 16,
      font: boldFont,
      color: rgb(0.7, 0.7, 0.7),
    });
    
    // キャラクター名（メインタイトル）
    const characterName = typeof character === 'string' ? character : character.name || 'Unknown Character';
    page.drawText(`🎭 ${characterName}`, {
      x: 30,
      y: height - 90,
      size: 24,
      font: boldFont,
      color: rgb(1, 1, 1),
    });
    
    page.drawText('キャラクターハンドアウト', {
      x: 30,
      y: height - 115,
      size: 14,
      font: regularFont,
      color: rgb(0.8, 0.8, 0.8),
    });
    
    // 生成日時
    page.drawText(`Generated: ${new Date().toLocaleDateString('ja-JP')} ${new Date().toLocaleTimeString('ja-JP')}`, {
      x: 30,
      y: height - 140,
      size: 10,
      font: italicFont,
      color: rgb(0.6, 0.6, 0.6),
    });

    // 📝 ハンドアウトコンテンツ
    let yPos = height - 200;
    
    // ハンドアウトテキストの処理
    const handoutText = typeof handout === 'string' ? handout : handout.content || 'No handout content available';
    const lines = handoutText.split('\n').filter(line => line.trim());
    
    let currentSection = '';
    
    for (const line of lines) {
      if (yPos < 80) {
        // 新しいページが必要
        const newPage = pdfDoc.addPage();
        const { width: newWidth, height: newHeight } = newPage.getSize();
        
        // 新ページの背景
        newPage.drawRectangle({
          x: 0,
          y: 0,
          width: newWidth,
          height: newHeight,
          color: bgColor,
        });
        
        yPos = newHeight - 60;
        page = newPage;
      }

      // セクション見出しの検出
      if (line.startsWith('##') || line.startsWith('###')) {
        yPos -= 15;
        const sectionTitle = line.replace(/^#+\s*/, '');
        
        // セクション背景
        page.drawRectangle({
          x: 20,
          y: yPos - 5,
          width: width - 40,
          height: 25,
          color: rgb(0.9, 0.95, 1),
          borderColor: rgb(0.7, 0.8, 0.9),
          borderWidth: 1,
        });
        
        page.drawText(sectionTitle, {
          x: 30,
          y: yPos + 5,
          size: 14,
          font: boldFont,
          color: rgb(0.2, 0.3, 0.7),
        });
        
        yPos -= 35;
        continue;
      }
      
      // 箇条書きの処理
      if (line.startsWith('-') || line.startsWith('*') || line.startsWith('•')) {
        const bulletText = line.replace(/^[-*•]\s*/, '');
        const processedText = bulletText
          .replace(/[^\x00-\x7F]/g, '●')
          .substring(0, 90);
        
        page.drawText('•', {
          x: 40,
          y: yPos,
          size: 12,
          font: boldFont,
          color: rgb(0.4, 0.4, 0.7),
        });
        
        page.drawText(processedText, {
          x: 55,
          y: yPos,
          size: 11,
          font: regularFont,
          color: rgb(0.2, 0.2, 0.2),
        });
        
        yPos -= 20;
        continue;
      }
      
      // 通常のテキスト
      const processedLine = line
        .replace(/[^\x00-\x7F]/g, '●')
        .substring(0, 85);
      
      if (processedLine.trim()) {
        page.drawText(processedLine, {
          x: 30,
          y: yPos,
          size: 11,
          font: regularFont,
          color: rgb(0.1, 0.1, 0.1),
        });
        
        yPos -= 18;
      }
    }
    
    // フッター
    page.drawText('🎮 Murder Mystery Generator - Individual Character Handout', {
      x: 30,
      y: 30,
      size: 9,
      font: italicFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    console.log('💾 Generating individual PDF bytes...');
    
    // PDFをBase64として生成
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    console.log(`✅ Individual PDF generation successful for ${characterName}, size:`, pdfBytes.length, 'bytes');

    return res.status(200).json({
      success: true,
      pdf: pdfBase64,
      character: characterName,
      size: pdfBytes.length,
      pages: pdfDoc.getPageCount(),
      filename: `handout_${characterName.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Individual PDF generation error:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Individual PDF generation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}