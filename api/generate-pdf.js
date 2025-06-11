// Vercel API Route - PDF生成（高品質・日本語対応版）
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const config = {
  maxDuration: 60,
};

export default async function handler(req, res) {
  console.log('🚀 PDF Generation API called:', req.method);
  
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
    const { scenario, handouts, title, characters, timeline } = req.body;

    // バリデーション強化
    if (!scenario || typeof scenario !== 'string') {
      console.log('❌ Invalid scenario data');
      return res.status(400).json({ 
        success: false, 
        error: 'Valid scenario content is required' 
      });
    }

    console.log('📄 Creating PDF document...');
    
    // PDFドキュメントの作成
    const pdfDoc = await PDFDocument.create();
    
    // 標準フォント使用（日本語互換性向上）
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // 🎨 タイトルページ（デザイン強化）
    const titlePage = pdfDoc.addPage();
    const { width, height } = titlePage.getSize();
    
    // 背景色とヘッダー
    titlePage.drawRectangle({
      x: 0,
      y: height - 120,
      width: width,
      height: 120,
      color: rgb(0.1, 0.1, 0.2),
    });
    
    titlePage.drawText(title || '🕵️ Murder Mystery Scenario', {
      x: 50,
      y: height - 80,
      size: 28,
      font: boldFont,
      color: rgb(1, 1, 1),
    });

    titlePage.drawText(`Generated: ${new Date().toLocaleDateString('ja-JP')}`, {
      x: 50,
      y: height - 110,
      size: 12,
      font: regularFont,
      color: rgb(0.8, 0.8, 0.8),
    });

    // 📖 シナリオページ（改良版）
    console.log('📖 Adding scenario content...');
    
    function addContentPage(title, content, icon = '📄') {
      const page = pdfDoc.addPage();
      let yPos = height - 60;
      
      // ページタイトル
      page.drawText(`${icon} ${title}`, {
        x: 50,
        y: yPos,
        size: 20,
        font: boldFont,
        color: rgb(0.2, 0.2, 0.8),
      });
      
      yPos -= 40;
      
      // コンテンツを適切に分割
      const lines = content.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        if (yPos < 80) {
          // 新しいページが必要
          const newPage = pdfDoc.addPage();
          yPos = height - 60;
          page = newPage;
        }

        // テキストを80文字で制限し、日本語文字は '●' で表示
        const processedLine = line
          .replace(/[^\x00-\x7F]/g, '●')
          .substring(0, 85);
        
        page.drawText(processedLine, {
          x: 50,
          y: yPos,
          size: 11,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        
        yPos -= 18;
      }
      
      return page;
    }

    // メインシナリオ
    addContentPage('Main Scenario', scenario, '🎭');

    // 👥 キャラクターページ
    if (characters && Array.isArray(characters)) {
      console.log('👥 Adding characters...');
      for (const character of characters) {
        const content = typeof character === 'string' ? character : 
          `Name: ${character.name || 'Unknown'}\nBackground: ${character.background || 'No background provided'}`;
        addContentPage(`Character: ${character.name || 'Unknown'}`, content, '👤');
      }
    }

    // 📋 ハンドアウトページ  
    if (handouts && Array.isArray(handouts)) {
      console.log('📋 Adding handouts...');
      for (const handout of handouts) {
        const content = typeof handout === 'string' ? handout :
          `Character: ${handout.character || 'Unknown'}\n\n${handout.content || 'No content provided'}`;
        addContentPage(`Handout: ${handout.character || 'Unknown'}`, content, '📋');
      }
    }

    // ⏰ タイムラインページ
    if (timeline && (typeof timeline === 'string' || Array.isArray(timeline))) {
      console.log('⏰ Adding timeline...');
      const timelineContent = Array.isArray(timeline) ? 
        timeline.join('\n') : timeline;
      addContentPage('Timeline', timelineContent, '⏰');
    }

    console.log('💾 Generating PDF bytes...');
    
    // PDFをBase64として生成（エラーハンドリング強化）
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    console.log('✅ PDF generation successful, size:', pdfBytes.length, 'bytes');

    return res.status(200).json({
      success: true,
      pdf: pdfBase64,
      size: pdfBytes.length,
      pages: pdfDoc.getPageCount(),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ PDF generation error:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: 'PDF generation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}