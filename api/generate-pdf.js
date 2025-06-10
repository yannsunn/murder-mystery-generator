// Vercel API Route - PDF生成
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const config = {
  maxDuration: 90, // PDF生成用に適切な時間設定
};

export default async function handler(req, res) {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { scenario, handouts, title } = req.body;

    if (!scenario) {
      return res.status(400).json({ 
        success: false, 
        error: 'シナリオが指定されていません' 
      });
    }

    // PDFドキュメントの作成
    const pdfDoc = await PDFDocument.create();
    
    // 日本語フォントの埋め込み（ブラウザ環境では制限あり）
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // タイトルページ
    const titlePage = pdfDoc.addPage();
    const { width, height } = titlePage.getSize();
    
    titlePage.drawText(title || 'Murder Mystery Scenario', {
      x: 50,
      y: height - 100,
      size: 24,
      font: font,
      color: rgb(0, 0, 0),
    });

    titlePage.drawText(new Date().toLocaleDateString('ja-JP'), {
      x: 50,
      y: height - 150,
      size: 12,
      font: font,
      color: rgb(0.5, 0.5, 0.5),
    });

    // シナリオページ
    const scenarioLines = scenario.split('\n');
    let currentPage = pdfDoc.addPage();
    let yPosition = height - 50;
    
    currentPage.drawText('Scenario', {
      x: 50,
      y: yPosition,
      size: 18,
      font: font,
      color: rgb(0, 0, 0),
    });
    
    yPosition -= 30;

    for (const line of scenarioLines) {
      if (yPosition < 50) {
        currentPage = pdfDoc.addPage();
        yPosition = height - 50;
      }

      // 日本語の文字化けを避けるため、ASCII文字のみ表示
      const asciiLine = line.replace(/[^\x00-\x7F]/g, '?');
      
      currentPage.drawText(asciiLine.substring(0, 80), {
        x: 50,
        y: yPosition,
        size: 10,
        font: font,
        color: rgb(0, 0, 0),
      });
      
      yPosition -= 15;
    }

    // ハンドアウトページ
    if (handouts && handouts.length > 0) {
      for (const handout of handouts) {
        const handoutPage = pdfDoc.addPage();
        let handoutY = height - 50;
        
        handoutPage.drawText(`Character: ${handout.character}`, {
          x: 50,
          y: handoutY,
          size: 16,
          font: font,
          color: rgb(0, 0, 0),
        });
        
        handoutY -= 30;
        
        const handoutLines = handout.content.split('\n');
        for (const line of handoutLines) {
          if (handoutY < 50) {
            break;
          }
          
          const asciiLine = line.replace(/[^\x00-\x7F]/g, '?');
          
          handoutPage.drawText(asciiLine.substring(0, 80), {
            x: 50,
            y: handoutY,
            size: 10,
            font: font,
            color: rgb(0, 0, 0),
          });
          
          handoutY -= 15;
        }
      }
    }

    // PDFをBase64として生成
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString('base64');

    return res.status(200).json({
      success: true,
      pdf: pdfBase64
    });

  } catch (error) {
    console.error('PDF generation error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'PDF生成中にエラーが発生しました' 
    });
  }
}