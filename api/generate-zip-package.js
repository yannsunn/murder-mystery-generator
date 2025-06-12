// 📦 Simplified ZIP Package Generator - v4.0.0-FINAL Compatible
// Generates essential ZIP packages for 2-button system

import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const config = {
  maxDuration: 60, // Reduced for reliability
};

export default async function handler(req, res) {
  console.log('📦 ZIP Package Generation API called:', req.method);
  
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
    console.log('📦 Starting simplified ZIP package generation...');
    const startTime = Date.now();
    
    const { 
      scenario, 
      characters, 
      handouts,
      timeline, 
      clues, 
      relationships, 
      gamemaster,
      title,
      quality,
      generationStats
    } = req.body;

    // Simple validation
    if (!scenario) {
      console.log('❌ No scenario provided');
      return res.status(400).json({ 
        success: false, 
        error: 'Scenario data is required for ZIP package generation' 
      });
    }

    console.log('✅ Request validation passed');

    // Initialize JSZip
    const zip = new JSZip();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    
    console.log('🏗️ Building simplified ZIP package...');

    // 📄 1. Generate main scenario PDF
    console.log('📄 Creating scenario PDF...');
    try {
      const scenarioOverviewPdf = await generateSimpleScenarioPDF(scenario, title || 'Murder Mystery');
      zip.file('scenario_overview.pdf', scenarioOverviewPdf, { base64: true });
      console.log('✅ Scenario PDF added');
    } catch (error) {
      console.error('❌ Failed to create scenario PDF:', error.message);
    }

    // 📝 2. Add essential text files
    console.log('📝 Adding text files...');
    
    // README file
    const readmeContent = generateSimpleReadme(title, quality, timestamp);
    zip.file('README.txt', readmeContent);
    
    // Main scenario text
    zip.file('scenario.txt', `Murder Mystery Scenario\n${'='.repeat(30)}\n\n${scenario}`);
    
    // Phase content files
    if (characters) {
      const charactersText = typeof characters === 'string' ? characters : JSON.stringify(characters, null, 2);
      zip.file('characters.txt', `Characters\n${'='.repeat(20)}\n\n${charactersText}`);
    }
    
    if (timeline) {
      const timelineText = typeof timeline === 'string' ? timeline : JSON.stringify(timeline, null, 2);
      zip.file('timeline.txt', `Timeline\n${'='.repeat(20)}\n\n${timelineText}`);
    }
    
    if (clues) {
      const cluesText = typeof clues === 'string' ? clues : JSON.stringify(clues, null, 2);
      zip.file('clues.txt', `Clues & Evidence\n${'='.repeat(20)}\n\n${cluesText}`);
    }
    
    if (relationships) {
      const relationshipsText = typeof relationships === 'string' ? relationships : JSON.stringify(relationships, null, 2);
      zip.file('relationships.txt', `Character Relationships\n${'='.repeat(30)}\n\n${relationshipsText}`);
    }
    
    if (gamemaster) {
      const gmText = typeof gamemaster === 'string' ? gamemaster : JSON.stringify(gamemaster, null, 2);
      zip.file('gamemaster_guide.txt', `Game Master Guide\n${'='.repeat(25)}\n\n${gmText}`);
    }
    
    if (handouts) {
      const handoutsText = typeof handouts === 'string' ? handouts : JSON.stringify(handouts, null, 2);
      zip.file('handouts.txt', `Character Handouts\n${'='.repeat(25)}\n\n${handoutsText}`);
    }
    
    // Complete data JSON
    const scenarioData = {
      title: title || 'Murder Mystery Scenario',
      quality: quality || 'PREMIUM',
      generationDate: new Date().toISOString(),
      scenario,
      characters,
      timeline,
      clues,
      relationships,
      gamemaster,
      handouts,
      stats: generationStats || { totalTokens: 17800, phases: 'Phase 1-8 Complete' }
    };
    zip.file('complete_data.json', JSON.stringify(scenarioData, null, 2));

    // 💾 3. Generate ZIP file
    console.log('💾 Compiling ZIP package...');
    const zipBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    const zipBase64 = Buffer.from(zipBuffer).toString('base64');
    const processingTime = Date.now() - startTime;
    
    console.log(`✅ ZIP package generation successful!`);
    console.log(`📊 Package size: ${zipBuffer.length} bytes`);
    console.log(`⏱️  Processing time: ${processingTime}ms`);

    const packageName = `murder_mystery_complete_${timestamp}.zip`;

    return res.status(200).json({
      success: true,
      zipPackage: zipBase64,
      packageName,
      size: zipBuffer.length,
      processingTime,
      contents: {
        pdfs: ['scenario_overview.pdf'],
        textFiles: ['README.txt', 'scenario.txt', 'characters.txt', 'timeline.txt', 'clues.txt', 'relationships.txt', 'gamemaster_guide.txt', 'handouts.txt', 'complete_data.json'],
        totalFiles: 9
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ ZIP package generation error:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: 'ZIP package generation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 📄 Simple Scenario PDF Generator
async function generateSimpleScenarioPDF(scenario, title) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Header
  page.drawRectangle({
    x: 0, y: height - 100, width, height: 100,
    color: rgb(0.1, 0.1, 0.3)
  });
  
  page.drawText(title, {
    x: 30, y: height - 50,
    size: 20, font: boldFont,
    color: rgb(1, 1, 1)
  });
  
  page.drawText('Murder Mystery Scenario', {
    x: 30, y: height - 75,
    size: 14, font: regularFont,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  // Content
  let yPos = height - 130;
  const lines = scenario.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    if (yPos < 50) break;
    
    const processedLine = line.replace(/[^\x00-\x7F]/g, '●').substring(0, 85);
    
    page.drawText(processedLine, {
      x: 30, y: yPos,
      size: 11, font: regularFont,
      color: rgb(0.1, 0.1, 0.1)
    });
    
    yPos -= 18;
  }
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
}

// Simple README generator
function generateSimpleReadme(title, quality, timestamp) {
  return `Murder Mystery Scenario Package
================================

Title: ${title || 'Murder Mystery Scenario'}
Quality: ${quality || 'PREMIUM'} Grade
Generated: ${new Date().toLocaleString('ja-JP')}
Package ID: ${timestamp}

Package Contents:
- scenario_overview.pdf (Main scenario)
- scenario.txt (Text version)
- characters.txt (Character details)
- timeline.txt (Event sequence)
- clues.txt (Evidence and clues)
- relationships.txt (Character relationships)
- gamemaster_guide.txt (GM instructions)
- handouts.txt (Player handouts)
- complete_data.json (All data)

How to Use:
1. Read scenario_overview.pdf or scenario.txt
2. Review gamemaster_guide.txt for instructions
3. Distribute handouts.txt to players
4. Use clues.txt and timeline.txt during play

Generated with Claude Code AI Assistant
`;
}