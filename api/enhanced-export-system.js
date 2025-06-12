// 🚀 Enhanced Export System API - Multiple Format Support
// Provides advanced export capabilities for different file formats and custom packages

export const config = {
  maxDuration: 120,
};

export default async function handler(req, res) {
  console.log('🚀 Enhanced Export System API called:', req.method);
  
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
    console.log('🔄 Processing enhanced export request...');
    const { 
      exportType,
      format,
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
      customOptions
    } = req.body;

    // Validation
    if (!exportType || !scenario) {
      return res.status(400).json({ 
        success: false, 
        error: 'Export type and scenario data are required' 
      });
    }

    let exportResult = {};

    switch (exportType) {
      case 'json':
        exportResult = await exportAsJSON(scenario, characters, handouts, timeline, clues, relationships, solution, gamemaster, title, quality);
        break;
      
      case 'text':
        exportResult = await exportAsTextBundle(scenario, characters, handouts, timeline, clues, relationships, solution, gamemaster, title, quality);
        break;
      
      case 'csv':
        exportResult = await exportAsCSV(characters, handouts, timeline, clues, relationships, title);
        break;
      
      case 'markdown':
        exportResult = await exportAsMarkdown(scenario, characters, handouts, timeline, clues, relationships, solution, gamemaster, title, quality);
        break;
      
      case 'custom':
        exportResult = await createCustomExport(req.body, customOptions);
        break;
      
      case 'template':
        exportResult = await createReusableTemplate(scenario, characters, title, quality);
        break;
      
      default:
        return res.status(400).json({ 
          success: false, 
          error: `Unsupported export type: ${exportType}` 
        });
    }

    console.log(`✅ Enhanced export successful for type: ${exportType}`);

    return res.status(200).json({
      success: true,
      exportType,
      format: format || 'default',
      ...exportResult,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Enhanced export error:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Enhanced export failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 📄 JSON Export
async function exportAsJSON(scenario, characters, handouts, timeline, clues, relationships, solution, gamemaster, title, quality) {
  const jsonData = {
    metadata: {
      title: title || 'Murder Mystery Scenario',
      quality: quality || 'STANDARD',
      exportedAt: new Date().toISOString(),
      version: '3.0',
      format: 'Murder Mystery JSON Export'
    },
    scenario: {
      overview: scenario,
      timeline: timeline || null,
      solution: solution || null
    },
    characters: characters || [],
    handouts: handouts || [],
    evidence: {
      clues: clues || null,
      relationships: relationships || null
    },
    gamemaster: {
      guide: gamemaster || null,
      notes: 'Generated with Murder Mystery Generator'
    },
    structure: {
      totalCharacters: characters ? characters.length : 0,
      hasTimeline: !!timeline,
      hasClues: !!clues,
      hasRelationships: !!relationships,
      hasSolution: !!solution,
      hasGameMasterGuide: !!gamemaster
    }
  };

  return {
    content: JSON.stringify(jsonData, null, 2),
    filename: `murder_mystery_${title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'scenario'}_${new Date().toISOString().slice(0, 10)}.json`,
    mimeType: 'application/json',
    size: JSON.stringify(jsonData).length
  };
}

// 📝 Text Bundle Export
async function exportAsTextBundle(scenario, characters, handouts, timeline, clues, relationships, solution, gamemaster, title, quality) {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  
  let textBundle = `🕵️ MURDER MYSTERY SCENARIO - TEXT EXPORT
${'='.repeat(60)}
Title: ${title || 'Murder Mystery Scenario'}
Quality: ${quality || 'STANDARD'}
Export Date: ${new Date().toLocaleString('ja-JP')}
Export ID: ${timestamp}

📖 SCENARIO OVERVIEW
${'='.repeat(30)}
${scenario}

`;

  if (characters && characters.length > 0) {
    textBundle += `👥 CHARACTERS (${characters.length})
${'='.repeat(30)}
`;
    characters.forEach((char, index) => {
      const charName = typeof char === 'string' ? char : char.name || `Character ${index + 1}`;
      textBundle += `${index + 1}. ${charName}\n`;
      if (typeof char === 'object') {
        if (char.age) textBundle += `   Age: ${char.age}\n`;
        if (char.occupation) textBundle += `   Occupation: ${char.occupation}\n`;
        if (char.personality) textBundle += `   Personality: ${char.personality}\n`;
      }
      textBundle += '\n';
    });
  }

  if (timeline) {
    textBundle += `⏰ TIMELINE
${'='.repeat(30)}
${Array.isArray(timeline) ? timeline.join('\n\n') : timeline}

`;
  }

  if (clues) {
    textBundle += `🔍 CLUES & EVIDENCE
${'='.repeat(30)}
${Array.isArray(clues) ? clues.join('\n\n') : clues}

`;
  }

  if (relationships) {
    textBundle += `🤝 CHARACTER RELATIONSHIPS
${'='.repeat(30)}
${Array.isArray(relationships) ? relationships.join('\n\n') : relationships}

`;
  }

  if (handouts && handouts.length > 0) {
    textBundle += `📋 CHARACTER HANDOUTS
${'='.repeat(30)}
`;
    handouts.forEach((handout, index) => {
      const charName = typeof handout === 'string' ? `Character ${index + 1}` : handout.character || `Character ${index + 1}`;
      const content = typeof handout === 'string' ? handout : handout.content || 'No content available';
      textBundle += `\n--- ${charName} ---\n${content}\n`;
    });
    textBundle += '\n';
  }

  if (solution) {
    textBundle += `🎯 SOLUTION (SPOILER ALERT!)
${'='.repeat(30)}
${Array.isArray(solution) ? solution.join('\n\n') : solution}

`;
  }

  if (gamemaster) {
    textBundle += `🎮 GAME MASTER GUIDE
${'='.repeat(30)}
${Array.isArray(gamemaster) ? gamemaster.join('\n\n') : gamemaster}

`;
  }

  textBundle += `${'='.repeat(60)}
Generated with Murder Mystery Generator - Claude Code AI Assistant
`;

  return {
    content: textBundle,
    filename: `murder_mystery_${title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'scenario'}_${timestamp}.txt`,
    mimeType: 'text/plain',
    size: textBundle.length
  };
}

// 📊 CSV Export
async function exportAsCSV(characters, handouts, timeline, clues, relationships, title) {
  let csvContent = '';
  
  // Characters CSV
  if (characters && characters.length > 0) {
    csvContent += 'CHARACTER DATA\n';
    csvContent += 'Name,Age,Occupation,Personality,Background\n';
    
    characters.forEach(char => {
      const name = typeof char === 'string' ? char : char.name || 'Unknown';
      const age = typeof char === 'object' ? char.age || 'Unknown' : 'Unknown';
      const occupation = typeof char === 'object' ? char.occupation || 'Unknown' : 'Unknown';
      const personality = typeof char === 'object' ? char.personality || 'Unknown' : 'Unknown';
      const background = typeof char === 'object' ? char.background || 'Unknown' : 'Unknown';
      
      csvContent += `"${name}","${age}","${occupation}","${personality}","${background}"\n`;
    });
    csvContent += '\n';
  }

  // Handouts CSV
  if (handouts && handouts.length > 0) {
    csvContent += 'HANDOUT DATA\n';
    csvContent += 'Character,Content Length,Has Content\n';
    
    handouts.forEach(handout => {
      const character = typeof handout === 'string' ? 'Unknown' : handout.character || 'Unknown';
      const content = typeof handout === 'string' ? handout : handout.content || '';
      const contentLength = content.length;
      const hasContent = content.length > 0 ? 'Yes' : 'No';
      
      csvContent += `"${character}","${contentLength}","${hasContent}"\n`;
    });
  }

  return {
    content: csvContent,
    filename: `murder_mystery_data_${title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'scenario'}_${new Date().toISOString().slice(0, 10)}.csv`,
    mimeType: 'text/csv',
    size: csvContent.length
  };
}

// 📝 Markdown Export
async function exportAsMarkdown(scenario, characters, handouts, timeline, clues, relationships, solution, gamemaster, title, quality) {
  const timestamp = new Date().toISOString().slice(0, 10);
  
  let markdown = `# 🕵️ ${title || 'Murder Mystery Scenario'}

**Quality Grade:** ${quality || 'STANDARD'}  
**Generated:** ${new Date().toLocaleDateString('ja-JP')}  
**Export Format:** Markdown

---

## 📖 Scenario Overview

${scenario}

`;

  if (characters && characters.length > 0) {
    markdown += `## 👥 Characters

`;
    characters.forEach((char, index) => {
      const charName = typeof char === 'string' ? char : char.name || `Character ${index + 1}`;
      markdown += `### ${index + 1}. ${charName}

`;
      if (typeof char === 'object') {
        if (char.age) markdown += `**Age:** ${char.age}  \n`;
        if (char.occupation) markdown += `**Occupation:** ${char.occupation}  \n`;
        if (char.personality) markdown += `**Personality:** ${char.personality}  \n`;
        if (char.background) markdown += `**Background:** ${char.background}  \n`;
      }
      markdown += '\n';
    });
  }

  if (timeline) {
    markdown += `## ⏰ Timeline

${Array.isArray(timeline) ? timeline.join('\n\n') : timeline}

`;
  }

  if (clues) {
    markdown += `## 🔍 Clues & Evidence

${Array.isArray(clues) ? clues.join('\n\n') : clues}

`;
  }

  if (relationships) {
    markdown += `## 🤝 Character Relationships

${Array.isArray(relationships) ? relationships.join('\n\n') : relationships}

`;
  }

  if (handouts && handouts.length > 0) {
    markdown += `## 📋 Character Handouts

`;
    handouts.forEach((handout, index) => {
      const charName = typeof handout === 'string' ? `Character ${index + 1}` : handout.character || `Character ${index + 1}`;
      const content = typeof handout === 'string' ? handout : handout.content || 'No content available';
      markdown += `### ${charName}

${content}

`;
    });
  }

  if (solution) {
    markdown += `## 🎯 Solution

> **⚠️ SPOILER ALERT!** Read only after the game session.

${Array.isArray(solution) ? solution.join('\n\n') : solution}

`;
  }

  if (gamemaster) {
    markdown += `## 🎮 Game Master Guide

${Array.isArray(gamemaster) ? gamemaster.join('\n\n') : gamemaster}

`;
  }

  markdown += `---

*Generated with Murder Mystery Generator - Claude Code AI Assistant*
`;

  return {
    content: markdown,
    filename: `murder_mystery_${title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'scenario'}_${timestamp}.md`,
    mimeType: 'text/markdown',
    size: markdown.length
  };
}

// 🎨 Custom Export
async function createCustomExport(data, customOptions) {
  const { includeFields, formatOptions, outputName } = customOptions || {};
  
  let customContent = '';
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
  
  // Custom field inclusion logic
  if (!includeFields || includeFields.includes('header')) {
    customContent += `Custom Murder Mystery Export\n`;
    customContent += `Generated: ${new Date().toLocaleString()}\n\n`;
  }
  
  if (!includeFields || includeFields.includes('scenario')) {
    customContent += `SCENARIO:\n${data.scenario}\n\n`;
  }
  
  if ((!includeFields || includeFields.includes('characters')) && data.characters) {
    customContent += `CHARACTERS:\n`;
    data.characters.forEach((char, i) => {
      const name = typeof char === 'string' ? char : char.name || `Character ${i + 1}`;
      customContent += `${i + 1}. ${name}\n`;
    });
    customContent += '\n';
  }
  
  return {
    content: customContent,
    filename: outputName || `custom_export_${timestamp}.txt`,
    mimeType: 'text/plain',
    size: customContent.length
  };
}

// 📋 Reusable Template Export
async function createReusableTemplate(scenario, characters, title, quality) {
  const template = {
    templateVersion: '1.0',
    templateName: title || 'Murder Mystery Template',
    quality: quality || 'STANDARD',
    createdAt: new Date().toISOString(),
    structure: {
      participantCount: characters ? characters.length : 0,
      hasTimeline: true,
      hasClues: true,
      hasRelationships: true,
      hasSolution: true
    },
    template: {
      scenarioPattern: extractScenarioPattern(scenario),
      characterTypes: extractCharacterTypes(characters),
      relationships: 'Standard relationship web',
      plotStructure: 'Three-act murder mystery structure'
    },
    usage: {
      instructions: 'This template can be customized with different settings',
      parameters: ['participant_count', 'era', 'setting', 'incident_type'],
      estimatedGenerationTime: '60-120 seconds'
    }
  };

  return {
    content: JSON.stringify(template, null, 2),
    filename: `template_${title ? title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase() : 'scenario'}_${new Date().toISOString().slice(0, 10)}.json`,
    mimeType: 'application/json',
    size: JSON.stringify(template).length
  };
}

// Helper functions
function extractScenarioPattern(scenario) {
  // Extract structural patterns from scenario
  return 'Complex multi-character mystery with timeline and evidence system';
}

function extractCharacterTypes(characters) {
  if (!characters) return [];
  return characters.map((char, i) => ({
    id: i + 1,
    type: typeof char === 'object' ? char.occupation || 'Unknown' : 'Character',
    role: 'Participant'
  }));
}