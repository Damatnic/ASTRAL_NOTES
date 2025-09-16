#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔧 Starting comprehensive TypeScript error fix...');

const srcDir = path.join(__dirname, 'src');

// Get all TypeScript files
function getAllTSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllTSFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Remove unused imports from a file
function removeUnusedImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Split into lines
  const lines = content.split('\n');
  const newLines = [];
  let insideImport = false;
  let currentImport = '';
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Handle multi-line imports
    if (line.trim().startsWith('import') && !line.includes(';')) {
      insideImport = true;
      currentImport = line;
      continue;
    } else if (insideImport && !line.includes(';')) {
      currentImport += '\n' + line;
      continue;
    } else if (insideImport && line.includes(';')) {
      currentImport += '\n' + line;
      insideImport = false;
      
      // Process the complete import
      const processedImport = processImportBlock(currentImport, content);
      if (processedImport) {
        newLines.push(processedImport);
      } else {
        modified = true;
      }
      currentImport = '';
      continue;
    }
    
    // Handle single-line imports
    if (line.trim().startsWith('import') && line.includes(';')) {
      const processedImport = processImportBlock(line, content);
      if (processedImport) {
        newLines.push(processedImport);
      } else {
        modified = true;
      }
      continue;
    }
    
    newLines.push(line);
  }
  
  if (modified) {
    fs.writeFileSync(filePath, newLines.join('\n'));
    console.log(`✅ Removed unused imports from: ${path.relative(srcDir, filePath)}`);
  }
}

// Process a single import block
function processImportBlock(importText, fileContent) {
  // Extract import details
  const importMatch = importText.match(/import\s+(.+?)\s+from\s+['"](.+?)['"]/s);
  if (!importMatch) return importText;
  
  const [, importClause, moduleSpec] = importMatch;
  
  // Handle different import types
  if (importClause.includes('{')) {
    // Named imports
    const namedImportsMatch = importClause.match(/\{\s*([^}]+)\s*\}/);
    if (namedImportsMatch) {
      const namedImports = namedImportsMatch[1]
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp && isImportUsed(imp, fileContent, moduleSpec));
      
      if (namedImports.length === 0) {
        return null; // Remove entire import
      }
      
      // Check if we need to keep default import
      const defaultImportMatch = importClause.match(/^([^{,]+),/);
      let newImportClause = '';
      
      if (defaultImportMatch) {
        const defaultImport = defaultImportMatch[1].trim();
        if (isImportUsed(defaultImport, fileContent, moduleSpec)) {
          newImportClause = defaultImport + ', ';
        }
      }
      
      newImportClause += `{ ${namedImports.join(', ')} }`;
      return `import ${newImportClause} from '${moduleSpec}';`;
    }
  } else {
    // Default import or namespace import
    const importName = importClause.trim();
    if (isImportUsed(importName, fileContent, moduleSpec)) {
      return importText;
    } else {
      return null; // Remove import
    }
  }
  
  return importText;
}

// Check if an import is actually used in the file
function isImportUsed(importName, fileContent, moduleSpec) {
  // Remove import statements to avoid false positives
  const contentWithoutImports = fileContent.replace(/import\s+.+?;/g, '');
  
  // Special cases for React and common patterns
  if (importName === 'React' && (contentWithoutImports.includes('<') || contentWithoutImports.includes('React.'))) {
    return true;
  }
  
  if (importName === 'useState' || importName === 'useEffect' || importName === 'useCallback' || importName === 'useMemo') {
    return contentWithoutImports.includes(importName);
  }
  
  // Escape special regex characters in import name
  const escapedImportName = importName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Check for various usage patterns
  const patterns = [
    new RegExp(`\\b${escapedImportName}\\b`, 'g'), // Direct usage
    new RegExp(`<${escapedImportName}[\\s>]`, 'g'), // JSX component
    new RegExp(`${escapedImportName}\\.`, 'g'), // Property access
    new RegExp(`\\[${escapedImportName}\\]`, 'g'), // Array access
    new RegExp(`typeof\\s+${escapedImportName}`, 'g'), // typeof usage
  ];
  
  return patterns.some(pattern => pattern.test(contentWithoutImports));
}

// Fix Lucide icon title props
function fixLucideIcons(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Remove title props from Lucide icons
  const titlePropPattern = /(<[A-Z][a-zA-Z]*[^>]*)\s+title\s*=\s*"[^"]*"([^>]*>)/g;
  const newContent = content.replace(titlePropPattern, '$1$2');
  
  if (newContent !== content) {
    fs.writeFileSync(filePath, newContent);
    modified = true;
    console.log(`✅ Fixed Lucide icon title props in: ${path.relative(srcDir, filePath)}`);
  }
  
  return modified;
}

// Fix export/import mismatches in index files
function fixIndexExports() {
  const indexFiles = getAllTSFiles(srcDir).filter(file => file.endsWith('index.ts'));
  
  for (const indexFile of indexFiles) {
    let content = fs.readFileSync(indexFile, 'utf8');
    let modified = false;
    
    const lines = content.split('\n');
    const newLines = [];
    
    for (const line of lines) {
      if (line.trim().startsWith('export') && line.includes('from')) {
        // Check if the export exists
        const exportMatch = line.match(/export\s+\{\s*([^}]+)\s*\}\s+from\s+['"](.+?)['"]/);
        if (exportMatch) {
          const [, exports, moduleSpec] = exportMatch;
          const exportNames = exports.split(',').map(e => e.trim());
          
          // Try to resolve the module
          const modulePath = path.resolve(path.dirname(indexFile), moduleSpec + '.tsx') ||
                           path.resolve(path.dirname(indexFile), moduleSpec + '.ts');
          
          if (fs.existsSync(modulePath)) {
            const moduleContent = fs.readFileSync(modulePath, 'utf8');
            const validExports = exportNames.filter(exportName => {
              return moduleContent.includes(`export const ${exportName}`) ||
                     moduleContent.includes(`export interface ${exportName}`) ||
                     moduleContent.includes(`export type ${exportName}`) ||
                     moduleContent.includes(`export class ${exportName}`) ||
                     moduleContent.includes(`export function ${exportName}`) ||
                     moduleContent.includes(`export enum ${exportName}`);
            });
            
            if (validExports.length > 0) {
              newLines.push(`export { ${validExports.join(', ')} } from '${moduleSpec}';`);
              if (validExports.length !== exportNames.length) {
                modified = true;
              }
            } else {
              modified = true; // Remove the entire export line
            }
          } else {
            modified = true; // Remove non-existent module export
          }
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }
    
    if (modified) {
      fs.writeFileSync(indexFile, newLines.join('\n'));
      console.log(`✅ Fixed exports in: ${path.relative(srcDir, indexFile)}`);
    }
  }
}

// Fix specific type errors
function fixTypeErrors(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Fix array vs single type mismatches
  content = content.replace(
    /filters\s*:\s*\{\s*type\?\s*:\s*([^,}]+),/g,
    'filters: { type?: $1[],',
  );
  
  // Fix sceneRhythm type
  content = content.replace(
    /sceneRhythm:\s*string/g,
    'sceneRhythm: "consistent" | "varied" | "uneven"'
  );
  
  // Fix property length access on numbers
  content = content.replace(/(\w+)\.length\s*\|\|\s*0/g, 'Array.isArray($1) ? $1.length : 0');
  
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    modified = true;
    console.log(`✅ Fixed type errors in: ${path.relative(srcDir, filePath)}`);
  }
  
  return modified;
}

// Fix missing imports
function fixMissingImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Add missing Lucide imports
  const lucideIcons = [
    'Brain', 'BarChart3', 'Activity', 'Palette', 'CheckCircle', 'Timeline'
  ];
  
  for (const icon of lucideIcons) {
    if (content.includes(icon) && !content.includes(`import.*${icon}`)) {
      // Find existing lucide-react import
      const lucideImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
      if (lucideImportMatch) {
        const existingImports = lucideImportMatch[1].split(',').map(i => i.trim());
        if (!existingImports.includes(icon)) {
          existingImports.push(icon);
          content = content.replace(
            /import\s+\{[^}]+\}\s+from\s+['"]lucide-react['"]/,
            `import { ${existingImports.join(', ')} } from 'lucide-react'`
          );
          modified = true;
        }
      } else {
        // Add new import
        const importMatch = content.match(/^(import\s+.+?;)/m);
        if (importMatch) {
          content = content.replace(
            importMatch[0],
            `${importMatch[0]}\nimport { ${icon} } from 'lucide-react';`
          );
          modified = true;
        }
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Added missing imports in: ${path.relative(srcDir, filePath)}`);
  }
  
  return modified;
}

// Main execution
function main() {
  console.log('📁 Processing all TypeScript files...');
  
  const allTSFiles = getAllTSFiles(srcDir);
  console.log(`Found ${allTSFiles.length} TypeScript files`);
  
  // Step 1: Fix exports in index files first
  console.log('\n🔧 Step 1: Fixing index file exports...');
  fixIndexExports();
  
  // Step 2: Process each file
  console.log('\n🔧 Step 2: Processing individual files...');
  let totalFixed = 0;
  
  for (const file of allTSFiles) {
    let fileFixed = false;
    
    // Fix unused imports
    removeUnusedImports(file);
    
    // Fix Lucide icon props
    if (fixLucideIcons(file)) fileFixed = true;
    
    // Fix type errors
    if (fixTypeErrors(file)) fileFixed = true;
    
    // Fix missing imports
    if (fixMissingImports(file)) fileFixed = true;
    
    if (fileFixed) totalFixed++;
  }
  
  console.log(`\n✅ Successfully processed ${totalFixed} files`);
  
  // Step 3: Run typecheck to see remaining errors
  console.log('\n🔍 Running typecheck to verify fixes...');
  try {
    execSync('npm run typecheck', { stdio: 'inherit', cwd: __dirname });
    console.log('\n🎉 All TypeScript errors have been fixed!');
  } catch (error) {
    console.log('\n⚠️  Some errors remain. Running limited typecheck...');
    try {
      execSync('npm run typecheck 2>&1 | head -50', { stdio: 'inherit', cwd: __dirname, shell: true });
    } catch (e) {
      // Ignore
    }
  }
}

main();