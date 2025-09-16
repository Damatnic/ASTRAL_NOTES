#!/usr/bin/env node
/**
 * NUCLEAR FIX - Fixes ALL TypeScript errors systematically
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.dirname(__dirname);

async function getTypeScriptErrors() {
  try {
    const { stdout } = await execAsync('npm run typecheck 2>&1', { 
      cwd: rootDir,
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    return stdout;
  } catch (error) {
    return error.stdout || '';
  }
}

async function parseErrors(output) {
  const lines = output.split('\n');
  const errors = new Map();
  
  for (const line of lines) {
    const match = line.match(/^(.*?)\((\d+),(\d+)\): error (TS\d+): (.*)$/);
    if (match) {
      const [, file, lineNum, col, code, message] = match;
      if (!errors.has(file)) {
        errors.set(file, []);
      }
      errors.get(file).push({
        line: parseInt(lineNum),
        col: parseInt(col),
        code,
        message
      });
    }
  }
  
  return errors;
}

async function fixUnusedImports(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    const lines = content.split('\n');
    const importRegex = /^import\s+(?:{([^}]+)}|([^{}\s]+))\s+from\s+['"]([^'"]+)['"]/;
    const usedIdentifiers = new Set();
    
    // Collect all used identifiers (excluding import lines)
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].trim().startsWith('import')) {
        // Simple identifier extraction (could be improved)
        const matches = lines[i].matchAll(/\b([A-Z][a-zA-Z0-9]*)\b/g);
        for (const match of matches) {
          usedIdentifiers.add(match[1]);
        }
      }
    }
    
    // Process imports
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim().startsWith('import') && line.includes('{')) {
        const match = line.match(/import\s+{([^}]+)}\s+from/);
        if (match) {
          const imports = match[1].split(',').map(s => s.trim());
          const usedImports = imports.filter(imp => {
            const name = imp.split(' as ')[0].trim();
            return usedIdentifiers.has(name);
          });
          
          if (usedImports.length === 0) {
            // Remove the entire import line
            lines[i] = '';
          } else if (usedImports.length < imports.length) {
            // Update with only used imports
            lines[i] = line.replace(/{[^}]+}/, `{ ${usedImports.join(', ')} }`);
          }
        }
      }
    }
    
    const newContent = lines.filter(line => line !== '').join('\n');
    if (newContent !== content) {
      await fs.writeFile(filePath, newContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing unused imports in ${filePath}:`, error.message);
    return false;
  }
}

async function fixTitlePropsOnIcons(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    let changed = false;
    
    // Remove title prop from Lucide icons
    const titlePropRegex = /(<[A-Z][a-zA-Z]*(?:Icon)?\s+[^>]*)\s+title=["'][^"']*["']([^>]*>)/g;
    const newContent = content.replace(titlePropRegex, (match, before, after) => {
      if (match.includes('lucide-react') || match.match(/<(Check|Alert|X|Copy|Share|Save|History|Filter|Search|Star|Heart|Brain|Eye|Music|Globe|Database|Clock|Users|BookOpen|Settings|Info|ChevronDown|ChevronRight|MessageSquare|RefreshCw|Sparkles|TrendingUp|Target|Lightbulb|Wand2|Brain|Type|Bold|Italic|Quote|Hash|List|ListOrdered|Palette|Download|Save|Copy|Share2|Filter|Search|AlertCircle|CheckCircle|X)\s/)) {
        changed = true;
        return before + after;
      }
      return match;
    });
    
    if (changed) {
      await fs.writeFile(filePath, newContent, 'utf8');
      return true;
    }
    return false;
  } catch (error) {
    console.error(`Error fixing title props in ${filePath}:`, error.message);
    return false;
  }
}

async function fixExportErrors(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf8');
    
    // Check if this is an index.ts file with export errors
    if (path.basename(filePath) === 'index.ts' && content.includes('export type {')) {
      // Get the actual exports from source files
      const dir = path.dirname(filePath);
      const sourceFiles = await fs.readdir(dir);
      const validExports = new Set();
      
      for (const file of sourceFiles) {
        if (file.endsWith('.tsx') && file !== 'index.ts') {
          const sourcePath = path.join(dir, file);
          const sourceContent = await fs.readFile(sourcePath, 'utf8');
          
          // Find exported types
          const typeExports = sourceContent.matchAll(/export\s+(?:type|interface)\s+([A-Z][a-zA-Z0-9]*)/g);
          for (const match of typeExports) {
            validExports.add(match[1]);
          }
        }
      }
      
      // Remove invalid exports
      const lines = content.split('\n');
      const newLines = [];
      
      for (const line of lines) {
        if (line.includes('export type {')) {
          const match = line.match(/export type {([^}]+)}/);
          if (match) {
            const exports = match[1].split(',').map(s => s.trim());
            const validOnes = exports.filter(exp => {
              const name = exp.split(' as ')[0].trim();
              return validExports.has(name);
            });
            
            if (validOnes.length > 0) {
              newLines.push(line.replace(/{[^}]+}/, `{ ${validOnes.join(', ')} }`));
            }
          }
        } else {
          newLines.push(line);
        }
      }
      
      const newContent = newLines.join('\n');
      if (newContent !== content) {
        await fs.writeFile(filePath, newContent, 'utf8');
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`Error fixing exports in ${filePath}:`, error.message);
    return false;
  }
}

async function processFile(filePath, errors) {
  let fixed = false;
  
  // Fix based on error types
  for (const error of errors) {
    if (error.code === 'TS6133') {
      // Unused variable/import
      fixed = await fixUnusedImports(filePath) || fixed;
    } else if (error.code === 'TS2322' && error.message.includes('title')) {
      // Title prop error on icons
      fixed = await fixTitlePropsOnIcons(filePath) || fixed;
    } else if (error.code === 'TS2614') {
      // Module has no exported member
      fixed = await fixExportErrors(filePath) || fixed;
    }
  }
  
  return fixed;
}

async function main() {
  console.log('🚀 NUCLEAR FIX INITIATED - Fixing ALL TypeScript errors...\n');
  
  // Get all errors
  console.log('📊 Analyzing TypeScript errors...');
  const output = await getTypeScriptErrors();
  const errorMap = await parseErrors(output);
  
  console.log(`Found errors in ${errorMap.size} files\n`);
  
  let totalFixed = 0;
  
  // Process each file with errors
  for (const [file, errors] of errorMap) {
    const filePath = path.join(rootDir, file);
    console.log(`Processing: ${file} (${errors.length} errors)`);
    
    if (await processFile(filePath, errors)) {
      console.log(`  ✅ Fixed issues in ${file}`);
      totalFixed++;
    }
  }
  
  console.log(`\n✨ Fixed issues in ${totalFixed} files`);
  
  // Run typecheck again to see remaining errors
  console.log('\n🔍 Checking remaining errors...');
  const finalOutput = await getTypeScriptErrors();
  const finalErrors = await parseErrors(finalOutput);
  
  const errorCount = Array.from(finalErrors.values()).reduce((sum, arr) => sum + arr.length, 0);
  console.log(`📊 Remaining errors: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some errors remain. These may require manual intervention.');
    
    // Show sample of remaining errors
    let shown = 0;
    for (const [file, errors] of finalErrors) {
      if (shown >= 5) break;
      console.log(`\n${file}:`);
      for (const error of errors.slice(0, 2)) {
        console.log(`  Line ${error.line}: ${error.message}`);
      }
      shown++;
    }
  } else {
    console.log('\n🎉 ALL ERRORS FIXED!');
  }
}

main().catch(console.error);