#!/usr/bin/env node
/**
 * Fix Critical Comma Syntax Errors
 * Fixes TS1005 ',' expected errors
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

async function fixCommaErrors(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    // Fix object property syntax - add missing commas
    const lines = content.split('\n');
    const fixedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const nextLine = lines[i + 1];
      
      // If current line ends with a value and next line starts with a property, add comma
      if (nextLine && 
          line.trim() && 
          !line.trim().endsWith(',') && 
          !line.trim().endsWith('{') && 
          !line.trim().endsWith('[') && 
          !line.includes('//') &&
          !line.includes('/*') &&
          nextLine.trim() &&
          (nextLine.trim().match(/^[a-zA-Z_$][a-zA-Z0-9_$]*\s*:/) || 
           nextLine.trim().match(/^['"][^'"]*['"]\s*:/))) {
        // Add comma to current line
        line = line + ',';
        changed = true;
      }
      
      fixedLines.push(line);
    }
    
    if (changed) {
      const newContent = fixedLines.join('\n');
      await fs.writeFile(filePath, newContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message);
    return false;
  }
}

async function findFilesWithCommaErrors() {
  const errorFiles = [
    'src/components/ai/ConsistencyChecker.tsx',
    'src/components/ai/writing/AIWritingAssistant.tsx',
    'src/components/ai/writing/CharacterVoiceAnalyzer.tsx',
    'src/components/ai/writing/CreativeExpansion.tsx',
    'src/components/ai/writing/PlotAssistant.tsx',
    'src/components/ai/writing/ResearchAssistant.tsx',
    'src/components/ai/writing/StyleMentor.tsx'
  ];
  
  let totalFixed = 0;
  
  for (const file of errorFiles) {
    const filePath = path.join(rootDir, file);
    console.log(`Fixing comma errors in: ${file}`);
    
    if (await fixCommaErrors(filePath)) {
      console.log(`  ✅ Fixed comma syntax in ${file}`);
      totalFixed++;
    }
  }
  
  console.log(`\n✨ Fixed comma syntax in ${totalFixed} files`);
}

findFilesWithCommaErrors().catch(console.error);