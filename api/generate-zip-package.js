// 📦 Ultimate ZIP Package Generator - Enterprise Level
// Generates comprehensive ZIP packages with all scenario components

import JSZip from 'jszip';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const config = {
  maxDuration: 300, // Maximum time for complete package generation
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
    console.log('📦 Starting comprehensive ZIP package generation...');
    const startTime = Date.now();
    
    const { 
      scenario, 
      characters, 
      handouts,
      timeline, 
      clues, 
      relationships, 
      solution, 
      gamemaster,
      title,
      quality,
      generationStats,
      completePdf
    } = req.body;

    // Enhanced validation
    if (!scenario) {
      return res.status(400).json({ 
        success: false, 
        error: 'Scenario data is required for ZIP package generation' 
      });
    }

    // Initialize JSZip
    const zip = new JSZip();
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    
    console.log('🏗️ Building ZIP package structure...');

    // 📁 1. Create main directories
    const handoutsFolder = zip.folder('handouts');
    const resourcesFolder = zip.folder('resources');
    
    // 📄 2. Add main PDF files
    console.log('📄 Adding main PDF files...');
    
    // Complete scenario PDF (if provided)
    if (completePdf) {
      zip.file('complete_scenario.pdf', completePdf, { base64: true });
    }
    
    // Generate scenario overview PDF
    const scenarioOverviewPdf = await generateScenarioOverviewPDF(scenario, title, quality);
    zip.file('scenario_overview.pdf', scenarioOverviewPdf, { base64: true });
    
    // Generate GM guide PDF
    if (gamemaster) {
      const gmGuidePdf = await generateGMGuidePDF(gamemaster, title, quality);
      zip.file('gm_guide.pdf', gmGuidePdf, { base64: true });
    }

    // 📋 3. Generate individual handout PDFs
    console.log('📋 Generating individual handout PDFs...');
    if (handouts && Array.isArray(handouts)) {
      for (const handout of handouts) {
        try {
          const characterName = typeof handout === 'string' ? 'Unknown' : handout.character || 'Unknown';
          const handoutContent = typeof handout === 'string' ? handout : handout.content || '';
          
          const individualPdf = await generateIndividualHandoutPDF(
            characterName, 
            handoutContent, 
            title, 
            quality
          );
          
          const filename = `character_${characterName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
          handoutsFolder.file(filename, individualPdf, { base64: true });
          
          console.log(`✅ Generated handout for ${characterName}`);
        } catch (error) {
          console.error(`❌ Failed to generate handout PDF for character:`, error.message);
        }
      }
    }

    // 📝 4. Generate text files
    console.log('📝 Generating text resource files...');
    
    // README file
    const readmeContent = generateReadmeFile(title, quality, generationStats, timestamp);
    zip.file('README.txt', readmeContent);
    
    // Scenario data JSON
    const scenarioData = {
      title: title || 'Murder Mystery Scenario',
      quality: quality || 'STANDARD',
      generationDate: new Date().toISOString(),
      scenario,
      characters,
      timeline,
      clues,
      relationships,
      solution,
      gamemaster,
      stats: generationStats
    };
    resourcesFolder.file('scenario_data.json', JSON.stringify(scenarioData, null, 2));
    
    // Individual text files
    if (timeline) {
      const timelineText = generateTimelineFile(timeline, title);
      resourcesFolder.file('timeline.txt', timelineText);
    }
    
    if (clues) {
      const cluesText = generateCluesFile(clues, title);
      resourcesFolder.file('clues_list.txt', cluesText);
    }
    
    if (relationships) {
      const relationshipsText = generateRelationshipsFile(relationships, title);
      resourcesFolder.file('character_relationships.txt', relationshipsText);
    }
    
    if (characters && Array.isArray(characters)) {
      const charactersText = generateCharactersFile(characters, title);
      resourcesFolder.file('characters_summary.txt', charactersText);
    }
    
    if (solution) {
      const solutionText = generateSolutionFile(solution, title);
      resourcesFolder.file('solution.txt', solutionText);
    }
    
    if (gamemaster) {
      const gmText = generateGameMasterFile(gamemaster, title);
      resourcesFolder.file('gm_guide.txt', gmText);
    }
    
    // Quick reference
    const quickRefText = generateQuickReferenceFile({
      title, characters, timeline, clues, relationships, quality
    });
    resourcesFolder.file('quick_reference.txt', quickRefText);

    // 💾 5. Generate ZIP file
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

    const packageName = `murder_mystery_${title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'scenario'}_${timestamp}.zip`;

    return res.status(200).json({
      success: true,
      zipPackage: zipBase64,
      packageName,
      size: zipBuffer.length,
      processingTime,
      contents: {
        pdfs: ['scenario_overview.pdf', 'gm_guide.pdf', 'complete_scenario.pdf'].filter(Boolean),
        handouts: handouts ? handouts.length : 0,
        textFiles: ['README.txt', 'timeline.txt', 'clues_list.txt', 'character_relationships.txt', 'characters_summary.txt', 'solution.txt', 'gm_guide.txt', 'quick_reference.txt', 'scenario_data.json'].filter(Boolean),
        totalFiles: Object.keys(await zip.generateAsync({type: 'object'})).length
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

// 📄 Scenario Overview PDF Generator
async function generateScenarioOverviewPDF(scenario, title, quality) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Quality-based color scheme
  const qualityColors = {
    'PLATINUM': rgb(0.9, 0.9, 0.95),
    'GOLD': rgb(1, 0.95, 0.8),
    'SILVER': rgb(0.95, 0.95, 0.95),
    'PREMIUM': rgb(0.85, 0.9, 1),
    'STANDARD': rgb(0.9, 0.95, 0.9)
  };
  
  const bgColor = qualityColors[quality] || rgb(0.98, 0.98, 1);
  
  // Background
  page.drawRectangle({
    x: 0, y: 0, width, height,
    color: bgColor
  });
  
  // Header
  page.drawRectangle({
    x: 0, y: height - 120, width, height: 120,
    color: rgb(0.1, 0.1, 0.3)
  });
  
  page.drawText(title || '🕵️ Murder Mystery Scenario', {
    x: 30, y: height - 60,
    size: 24, font: boldFont,
    color: rgb(1, 1, 1)
  });
  
  page.drawText('Scenario Overview', {
    x: 30, y: height - 90,
    size: 16, font: regularFont,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  // Content
  let yPos = height - 160;
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

// 🎮 GM Guide PDF Generator
async function generateGMGuidePDF(gamemaster, title, quality) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Header
  page.drawRectangle({
    x: 0, y: height - 100, width, height: 100,
    color: rgb(0.2, 0.4, 0.2)
  });
  
  page.drawText('🎮 Game Master Guide', {
    x: 30, y: height - 50,
    size: 22, font: boldFont,
    color: rgb(1, 1, 1)
  });
  
  page.drawText(title || 'Murder Mystery Scenario', {
    x: 30, y: height - 75,
    size: 14, font: regularFont,
    color: rgb(0.9, 0.9, 0.9)
  });
  
  // Content
  let yPos = height - 130;
  const gmText = Array.isArray(gamemaster) ? gamemaster.join('\n\n') : gamemaster;
  const lines = gmText.split('\n').filter(line => line.trim());
  
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

// 📋 Individual Handout PDF Generator (Simplified for ZIP)
async function generateIndividualHandoutPDF(characterName, handoutContent, title, quality) {
  const pdfDoc = await PDFDocument.create();
  const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  
  // Header
  page.drawRectangle({
    x: 0, y: height - 80, width, height: 80,
    color: rgb(0.3, 0.2, 0.5)
  });
  
  page.drawText(`🎭 ${characterName}`, {
    x: 30, y: height - 40,
    size: 20, font: boldFont,
    color: rgb(1, 1, 1)
  });
  
  page.drawText('Character Handout', {
    x: 30, y: height - 65,
    size: 12, font: regularFont,
    color: rgb(0.8, 0.8, 0.8)
  });
  
  // Content
  let yPos = height - 110;
  const lines = handoutContent.split('\n').filter(line => line.trim());
  
  for (const line of lines) {
    if (yPos < 50) break;
    
    const processedLine = line.replace(/[^\x00-\x7F]/g, '●').substring(0, 85);
    
    page.drawText(processedLine, {
      x: 30, y: yPos,
      size: 10, font: regularFont,
      color: rgb(0.1, 0.1, 0.1)
    });
    
    yPos -= 16;
  }
  
  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes).toString('base64');
}

// Text file generators (reused from generate-text-files.js)
function generateReadmeFile(title, quality, stats, timestamp) {
  return `🕵️ MURDER MYSTERY SCENARIO PACKAGE
=====================================

Scenario: ${title || 'Murder Mystery Scenario'}
Quality: ${quality || 'STANDARD'} Grade
Generated: ${new Date().toLocaleString('ja-JP')}
Package ID: ${timestamp}

📁 PACKAGE CONTENTS
==================
• scenario_overview.pdf     - Main scenario document
• gm_guide.pdf             - Game Master instructions
• complete_scenario.pdf    - All-in-one PDF package
• handouts/                - Individual character handouts
• resources/               - Text files and data
  ├── timeline.txt         - Event chronology
  ├── clues_list.txt      - Investigation evidence
  ├── character_relationships.txt - Character connections
  ├── characters_summary.txt - Character profiles
  ├── solution.txt        - Case solution (SPOILER!)
  ├── gm_guide.txt        - Game Master reference
  ├── scenario_data.json  - Raw scenario data
  └── quick_reference.txt - Quick GM reference

🎮 HOW TO USE
=============
1. Game Master should read gm_guide.pdf first
2. Print individual handouts for each player
3. Use timeline.txt and clues_list.txt during play
4. Refer to solution.txt only when revealing the answer

⚠️  SPOILER WARNING
===================
solution.txt contains the complete case solution.
Do not read until the end of the game session!

🎭 Enjoy your Murder Mystery session!
Generated with Claude Code AI Assistant
`;
}

function generateTimelineFile(timeline, title) {
  const timelineText = Array.isArray(timeline) ? timeline.join('\n\n') : timeline;
  return `⏰ TIMELINE - ${title || 'Murder Mystery Scenario'}\n${'='.repeat(50)}\n\n${timelineText}`;
}

function generateCluesFile(clues, title) {
  const cluesText = Array.isArray(clues) ? clues.join('\n\n') : clues;
  return `🔍 CLUES & EVIDENCE - ${title || 'Murder Mystery Scenario'}\n${'='.repeat(50)}\n\n${cluesText}`;
}

function generateRelationshipsFile(relationships, title) {
  const relationshipsText = Array.isArray(relationships) ? relationships.join('\n\n') : relationships;
  return `🤝 CHARACTER RELATIONSHIPS - ${title || 'Murder Mystery Scenario'}\n${'='.repeat(50)}\n\n${relationshipsText}`;
}

function generateCharactersFile(characters, title) {
  let charactersText = '';
  characters.forEach((character, index) => {
    const charName = typeof character === 'string' ? character : character.name || `Character ${index + 1}`;
    charactersText += `${index + 1}. ${charName}\n`;
  });
  return `👥 CHARACTER PROFILES - ${title || 'Murder Mystery Scenario'}\n${'='.repeat(50)}\n\n${charactersText}`;
}

function generateSolutionFile(solution, title) {
  const solutionText = Array.isArray(solution) ? solution.join('\n\n') : solution;
  return `🎯 CASE SOLUTION - ${title || 'Murder Mystery Scenario'}\n${'='.repeat(50)}\n⚠️  SPOILER ALERT ⚠️\n\n${solutionText}`;
}

function generateGameMasterFile(gamemaster, title) {
  const gmText = Array.isArray(gamemaster) ? gamemaster.join('\n\n') : gamemaster;
  return `🎮 GAME MASTER GUIDE - ${title || 'Murder Mystery Scenario'}\n${'='.repeat(50)}\n\n${gmText}`;
}

function generateQuickReferenceFile(data) {
  const { title, characters, quality } = data;
  return `📋 QUICK REFERENCE - ${title || 'Murder Mystery Scenario'}\n${'='.repeat(50)}\n\nQuality: ${quality || 'STANDARD'}\nCharacters: ${characters ? characters.length : 'Unknown'}\n\nThis is a spoiler-free quick reference for Game Masters.`;
}