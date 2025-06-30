/**
 * 🚀 Simple Export System - ZIP Generation
 * Fallback export endpoint to ensure ZIP functionality
 */

import JSZip from 'jszip';

export default async function handler(req, res) {
  console.log('🚀 Export System called:', req.method);
  
  // セキュリティヘッダー設定
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
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
      return res.status(400).json({
        success: false,
        error: 'Session data is required'
      });
    }
    
    console.log('🔄 Generating ZIP export...');
    
    // ZIPパッケージ作成
    const zip = new JSZip();
    
    // シンプルなテキストファイル作成
    const title = 'マーダーミステリーシナリオ';
    const content = `
================================================================================
                        ${title}
                    完全シナリオドキュメント
================================================================================

このシナリオファイルは正常に生成されました。

【基本情報】
参加人数: ${sessionData.formData?.participants || '未設定'}人
生成日時: ${new Date().toLocaleString('ja-JP')}

【フェーズ1】
${sessionData.phases?.phase1?.concept || 'コンセプトデータが見つかりません'}

================================================================================
                        制作情報
================================================================================

このシナリオは人工知能により生成されました。
生成システム: Ultra Integrated Murder Mystery Generator
生成日時: ${new Date().toLocaleString('ja-JP')}

© AI Generated Murder Mystery Scenario
`;
    
    zip.file('murder_mystery_scenario.txt', content);
    zip.file('readme.txt', 'マーダーミステリーシナリオパッケージです。');
    
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
    console.error('🚨 Export System error:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Export generation failed',
      timestamp: new Date().toISOString()
    });
  }
}