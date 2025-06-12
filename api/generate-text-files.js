// 📝 Text File Generators for ZIP Package
// Generates individual text files for timeline, clues, relationships, and scenario data

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  console.log('📝 Text Files Generation API called:', req.method);
  
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
    console.log('📝 Processing text file generation request...');
    const { 
      scenario, 
      characters, 
      timeline, 
      clues, 
      relationships, 
      solution, 
      gamemaster,
      title,
      quality,
      generationStats 
    } = req.body;

    // Validation
    if (!scenario) {
      return res.status(400).json({ 
        success: false, 
        error: 'Scenario data is required' 
      });
    }

    const textFiles = {};
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');

    // 🕵️ 1. Scenario Overview (README.txt)
    console.log('📄 Generating README.txt...');
    textFiles['README.txt'] = generateReadmeFile(title, quality, generationStats, timestamp);

    // 📊 2. Scenario Data (JSON)
    console.log('💾 Generating scenario_data.json...');
    textFiles['scenario_data.json'] = JSON.stringify({
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
    }, null, 2);

    // ⏰ 3. Timeline Text File
    if (timeline) {
      console.log('⏰ Generating timeline.txt...');
      textFiles['timeline.txt'] = generateTimelineFile(timeline, title);
    }

    // 🔍 4. Clues List Text File
    if (clues) {
      console.log('🔍 Generating clues_list.txt...');
      textFiles['clues_list.txt'] = generateCluesFile(clues, title);
    }

    // 🤝 5. Character Relationships Text File
    if (relationships) {
      console.log('🤝 Generating character_relationships.txt...');
      textFiles['character_relationships.txt'] = generateRelationshipsFile(relationships, title);
    }

    // 👥 6. Characters Summary Text File
    if (characters && Array.isArray(characters)) {
      console.log('👥 Generating characters_summary.txt...');
      textFiles['characters_summary.txt'] = generateCharactersFile(characters, title);
    }

    // 🎯 7. Solution Text File
    if (solution) {
      console.log('🎯 Generating solution.txt...');
      textFiles['solution.txt'] = generateSolutionFile(solution, title);
    }

    // 🎮 8. Game Master Guide Text File
    if (gamemaster) {
      console.log('🎮 Generating gm_guide.txt...');
      textFiles['gm_guide.txt'] = generateGameMasterFile(gamemaster, title);
    }

    // 📋 9. Quick Reference Sheet
    console.log('📋 Generating quick_reference.txt...');
    textFiles['quick_reference.txt'] = generateQuickReferenceFile({
      title, characters, timeline, clues, relationships, quality
    });

    console.log(`✅ Text files generation successful. Generated ${Object.keys(textFiles).length} files.`);

    return res.status(200).json({
      success: true,
      textFiles,
      fileCount: Object.keys(textFiles).length,
      totalSize: Object.values(textFiles).reduce((sum, content) => sum + content.length, 0),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Text files generation error:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({ 
      success: false, 
      error: 'Text files generation failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// 📄 README file generator
function generateReadmeFile(title, quality, stats, timestamp) {
  return `🕵️ MURDER MYSTERY SCENARIO PACKAGE
=====================================

Scenario: ${title || 'Murder Mystery Scenario'}
Quality: ${quality || 'STANDARD'} Grade
Generated: ${new Date().toLocaleString('ja-JP')}
Package ID: ${timestamp}

📁 PACKAGE CONTENTS
==================
• scenario_overview.pdf     - Complete scenario document
• gm_guide.pdf             - Game Master instructions
• complete_scenario.pdf    - All-in-one PDF package
• handouts/                - Individual character handouts
• timeline.txt             - Event chronology
• clues_list.txt          - Investigation evidence
• character_relationships.txt - Character connections
• characters_summary.txt   - Character profiles
• solution.txt            - Case solution (SPOILER!)
• gm_guide.txt            - Game Master reference
• scenario_data.json      - Raw scenario data
• quick_reference.txt     - Quick GM reference

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

🔧 TECHNICAL INFO
================
${stats ? `Generation Time: ${stats.processingTime || 'Unknown'}
Generation Strategy: ${stats.strategy || 'Unknown'}
Total Characters: ${stats.characterCount || 'Unknown'}
Quality Score: ${stats.qualityScore || 'Unknown'}/100` : 'Generation stats not available'}

📞 SUPPORT
==========
For questions about this scenario package,
visit: https://github.com/yannsunn/murder-mystery-generator

🎭 Enjoy your Murder Mystery session!
Generated with Claude Code AI Assistant
`;
}

// ⏰ Timeline file generator
function generateTimelineFile(timeline, title) {
  const header = `⏰ TIMELINE - ${title || 'Murder Mystery Scenario'}
${'='.repeat(50)}
Generated: ${new Date().toLocaleString('ja-JP')}

📅 CHRONOLOGICAL SEQUENCE OF EVENTS
===================================

`;

  const timelineText = Array.isArray(timeline) ? timeline.join('\n\n') : timeline;
  
  return header + timelineText + `

📝 GAME MASTER NOTES
===================
• Use this timeline to track character actions
• Cross-reference with character alibis
• Pay attention to timing inconsistencies
• Note opportunities for evidence discovery

🎮 Generated with Murder Mystery Generator
`;
}

// 🔍 Clues file generator
function generateCluesFile(clues, title) {
  const header = `🔍 CLUES & EVIDENCE - ${title || 'Murder Mystery Scenario'}
${'='.repeat(50)}
Generated: ${new Date().toLocaleString('ja-JP')}

🧩 INVESTIGATION EVIDENCE
========================

`;

  const cluesText = Array.isArray(clues) ? clues.join('\n\n') : clues;
  
  return header + cluesText + `

🎯 INVESTIGATION TIPS
====================
• Present clues gradually during gameplay
• Allow players to make connections
• Some clues may be red herrings
• Timing of clue revelation is crucial

🎮 Generated with Murder Mystery Generator
`;
}

// 🤝 Relationships file generator
function generateRelationshipsFile(relationships, title) {
  const header = `🤝 CHARACTER RELATIONSHIPS - ${title || 'Murder Mystery Scenario'}
${'='.repeat(50)}
Generated: ${new Date().toLocaleString('ja-JP')}

👥 INTERPERSONAL CONNECTIONS
===========================

`;

  const relationshipsText = Array.isArray(relationships) ? relationships.join('\n\n') : relationships;
  
  return header + relationshipsText + `

💡 RELATIONSHIP DYNAMICS
=======================
• These relationships drive character motivations
• Pay attention to conflicts and alliances
• Hidden connections may be revealed during play
• Use relationships to create dramatic tension

🎮 Generated with Murder Mystery Generator
`;
}

// 👥 Characters file generator
function generateCharactersFile(characters, title) {
  const header = `👥 CHARACTER PROFILES - ${title || 'Murder Mystery Scenario'}
${'='.repeat(50)}
Generated: ${new Date().toLocaleString('ja-JP')}

🎭 CAST OF CHARACTERS
====================

`;

  let charactersText = '';
  characters.forEach((character, index) => {
    const charName = typeof character === 'string' ? character : character.name || `Character ${index + 1}`;
    const charDetails = typeof character === 'object' ? 
      `Age: ${character.age || 'Unknown'}
Occupation: ${character.occupation || 'Unknown'}
Personality: ${character.personality || 'Unknown'}
Background: ${character.background || 'No background provided'}` : character;
    
    charactersText += `${index + 1}. ${charName}
${'-'.repeat(30)}
${charDetails}

`;
  });
  
  return header + charactersText + `

🎪 CHARACTER MANAGEMENT
======================
• Each character has unique motivations
• Players should embody their character's personality
• Encourage character interactions
• Secrets should be revealed strategically

🎮 Generated with Murder Mystery Generator
`;
}

// 🎯 Solution file generator
function generateSolutionFile(solution, title) {
  const header = `🎯 CASE SOLUTION - ${title || 'Murder Mystery Scenario'}
${'='.repeat(50)}
⚠️  SPOILER ALERT - READ ONLY AFTER GAME SESSION ⚠️
Generated: ${new Date().toLocaleString('ja-JP')}

🔓 THE TRUTH REVEALED
====================

`;

  const solutionText = Array.isArray(solution) ? solution.join('\n\n') : solution;
  
  return header + solutionText + `

🎭 SOLUTION REVEAL TIPS
======================
• Build suspense before revealing
• Allow players to present their theories first
• Explain the logical deduction process
• Highlight key evidence that proves the solution
• Celebrate successful deductions

🏆 CONCLUSION
============
Thank you for playing this Murder Mystery scenario!
Share your experience and feedback.

🎮 Generated with Murder Mystery Generator
`;
}

// 🎮 Game Master file generator
function generateGameMasterFile(gamemaster, title) {
  const header = `🎮 GAME MASTER GUIDE - ${title || 'Murder Mystery Scenario'}
${'='.repeat(50)}
Generated: ${new Date().toLocaleString('ja-JP')}

🎪 SESSION MANAGEMENT
====================

`;

  const gmText = Array.isArray(gamemaster) ? gamemaster.join('\n\n') : gamemaster;
  
  return header + gmText + `

⚡ QUICK GM CHECKLIST
====================
□ Read complete scenario before session
□ Print all character handouts
□ Prepare clue revelation schedule
□ Set up play area and materials
□ Brief players on rules and objectives
□ Monitor game flow and timing
□ Guide discussions when needed
□ Reveal solution dramatically

🎯 SUCCESS TIPS
==============
• Keep energy high throughout session
• Encourage player interaction
• Adapt pacing to group dynamics
• Have backup clues ready if players get stuck
• Focus on fun rather than perfect execution

🎮 Generated with Murder Mystery Generator
`;
}

// 📋 Quick reference generator
function generateQuickReferenceFile(data) {
  const { title, characters, timeline, clues, relationships, quality } = data;
  
  return `📋 QUICK REFERENCE SHEET - ${title || 'Murder Mystery Scenario'}
${'='.repeat(50)}
Generated: ${new Date().toLocaleString('ja-JP')}

🎯 AT-A-GLANCE INFO
==================
Scenario Quality: ${quality || 'STANDARD'} Grade
Number of Characters: ${characters ? characters.length : 'Unknown'}
Estimated Play Time: 2-4 hours
Difficulty Level: Intermediate

👥 CHARACTER QUICK LIST
======================
${characters ? characters.map((char, i) => {
  const name = typeof char === 'string' ? char : char.name || `Character ${i + 1}`;
  return `${i + 1}. ${name}`;
}).join('\n') : 'Characters not available'}

🔍 KEY INVESTIGATION POINTS
==========================
• Follow the timeline carefully
• Cross-reference character alibis
• Pay attention to relationship dynamics
• Look for motive, means, and opportunity
• Watch for red herrings

⚠️  SPOILER-FREE ZONE
====================
This quick reference contains NO SPOILERS.
Safe for Game Masters to reference during play.

🎮 Generated with Murder Mystery Generator
`;
}