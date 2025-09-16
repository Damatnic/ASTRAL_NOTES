#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔥 Starting aggressive TypeScript error fix...');

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

// Get all TypeScript errors
function getTypeScriptErrors() {
  try {
    execSync('npm run typecheck', { stdio: 'pipe', cwd: __dirname });
    return [];
  } catch (error) {
    const output = error.stdout ? error.stdout.toString() : error.stderr.toString();
    const lines = output.split('\n');
    const errors = [];
    
    for (const line of lines) {
      if (line.includes('.tsx(') || line.includes('.ts(')) {
        const match = line.match(/^(.+?)\((\d+),(\d+)\):\s+error\s+(\w+):\s+(.+)$/);
        if (match) {
          const [, filePath, lineNum, colNum, errorCode, message] = match;
          errors.push({
            file: filePath,
            line: parseInt(lineNum),
            column: parseInt(colNum),
            code: errorCode,
            message
          });
        }
      }
    }
    
    return errors;
  }
}

// Fix specific error patterns
function fixFile(filePath, errors) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  const fileErrors = errors.filter(e => e.file.includes(path.basename(filePath)));
  
  // Fix unused imports
  if (fileErrors.some(e => e.code === 'TS6133' && e.message.includes('is declared but its value is never read'))) {
    const lines = content.split('\n');
    const newLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this line has an unused import error
      const lineError = fileErrors.find(e => e.line === i + 1 && e.code === 'TS6133');
      if (lineError) {
        // Extract the unused import name
        const match = lineError.message.match(/'([^']+)' is declared but its value is never read/);
        if (match) {
          const unusedImport = match[1];
          
          // Remove from import statement
          if (line.includes('import') && line.includes(unusedImport)) {
            // Handle named imports
            let newLine = line;
            
            // Remove from destructured imports
            newLine = newLine.replace(new RegExp(`,\\s*${unusedImport}\\b`, 'g'), '');
            newLine = newLine.replace(new RegExp(`\\b${unusedImport}\\s*,`, 'g'), '');
            newLine = newLine.replace(new RegExp(`{\\s*${unusedImport}\\s*}`, 'g'), '{}');
            
            // Clean up empty braces
            if (newLine.includes('{ }') || newLine.includes('{}')) {
              continue; // Skip this import line entirely
            }
            
            newLines.push(newLine);
            modified = true;
          } else {
            newLines.push(line);
          }
        } else {
          newLines.push(line);
        }
      } else {
        newLines.push(line);
      }
    }
    
    content = newLines.join('\n');
  }
  
  // Fix type compatibility issues
  content = content.replace(
    /filters\s*:\s*\{\s*type\?\s*:\s*([^,}]+),/g,
    'filters: { type?: [$1] as $1[],'
  );
  
  // Fix sceneRhythm type
  content = content.replace(
    /sceneRhythm:\s*string/g,
    'sceneRhythm: "consistent" | "varied" | "uneven"'
  );
  
  // Fix length property on numbers
  content = content.replace(
    /(\w+)\.length\s*\|\|\s*0/g,
    '(Array.isArray($1) ? $1.length : 0)'
  );
  
  // Remove unused variables
  const unusedVarErrors = fileErrors.filter(e => 
    e.code === 'TS6133' && 
    !e.message.includes('is declared but its value is never read') &&
    e.message.includes('is declared but its value is never read')
  );
  
  for (const error of unusedVarErrors) {
    const match = error.message.match(/'([^']+)' is declared but its value is never read/);
    if (match) {
      const varName = match[1];
      const lines = content.split('\n');
      const errorLine = lines[error.line - 1];
      
      // Remove unused variable declarations
      if (errorLine.includes(`const ${varName}`) || errorLine.includes(`let ${varName}`)) {
        lines[error.line - 1] = `// ${errorLine.trim()} // Removed unused variable`;
        content = lines.join('\n');
        modified = true;
      }
    }
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
  }
  
  return modified;
}

// Remove specific unused imports by name
function removeSpecificUnusedImports() {
  const allFiles = getAllTSFiles(srcDir);
  
  const unusedImports = [
    'Timeline', 'MapPin', 'Mic', 'Play', 'Pause', 'RotateCcw', 'FileText', 'Globe',
    'Database', 'ChevronRight', 'AlertTriangle', 'Volume2', 'BarChart3', 'PieChart',
    'Zap', 'Bookmark', 'Clock', 'Palette', 'Music', 'BookOpen', 'Layers', 'ArrowRight',
    'Sun', 'Moon', 'CloudRain', 'useEffect', 'Square', 'Eye', 'AreaChart', 'Area',
    'BarChart', 'Bar', 'XAxis', 'YAxis', 'CartesianGrid', 'LineChart', 'Line',
    'TrendingDown', 'Filter', 'Settings', 'Info', 'AlertCircle', 'PauseCircle',
    'SkipForward', 'Rewind', 'Users', 'Heart', 'Award', 'Star', 'Flag', 'ArrowDown',
    'TrendingUp', 'Calendar', 'Camera', 'Book', 'Activity'
  ];
  
  for (const file of allFiles) {
    let content = fs.readFileSync(file, 'utf8');
    let modified = false;
    
    for (const importName of unusedImports) {
      const importRegex = new RegExp(`import\\s*\\{[^}]*\\b${importName}\\b[^}]*\\}\\s*from`, 'g');
      
      if (importRegex.test(content)) {
        // Check if the import is actually used
        const contentWithoutImports = content.replace(/import\s+.+?;/g, '');
        const escapedImportName = importName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const isUsed = [
          new RegExp(`\\b${escapedImportName}\\b`, 'g'),
          new RegExp(`<${escapedImportName}[\\s>]`, 'g'),
          new RegExp(`${escapedImportName}\\.`, 'g')
        ].some(pattern => pattern.test(contentWithoutImports));
        
        if (!isUsed) {
          // Remove the import
          content = content.replace(
            new RegExp(`,\\s*${escapedImportName}\\b`, 'g'), ''
          ).replace(
            new RegExp(`\\b${escapedImportName}\\s*,`, 'g'), ''
          ).replace(
            new RegExp(`\\{\\s*${escapedImportName}\\s*\\}`, 'g'), '{}'
          );
          
          // Clean up empty import lines
          content = content.replace(/import\s*\{\s*\}\s*from[^;]+;?\n?/g, '');
          
          modified = true;
        }
      }
    }
    
    if (modified) {
      fs.writeFileSync(file, content);
      console.log(`✅ Cleaned imports in ${path.relative(srcDir, file)}`);
    }
  }
}

// Main execution
function main() {
  console.log('📊 Getting current TypeScript errors...');
  let errors = getTypeScriptErrors();
  console.log(`Found ${errors.length} TypeScript errors`);
  
  if (errors.length === 0) {
    console.log('🎉 No TypeScript errors found!');
    return;
  }
  
  console.log('\n🧹 Removing specific unused imports...');
  removeSpecificUnusedImports();
  
  console.log('\n🔧 Fixing files with errors...');
  const allFiles = getAllTSFiles(srcDir);
  let fixedFiles = 0;
  
  for (const file of allFiles) {
    if (fixFile(file, errors)) {
      fixedFiles++;
    }
  }
  
  console.log(`\n✅ Fixed ${fixedFiles} files`);
  
  // Check remaining errors
  console.log('\n🔍 Checking remaining errors...');
  errors = getTypeScriptErrors();
  console.log(`Remaining errors: ${errors.length}`);
  
  if (errors.length > 0 && errors.length <= 50) {
    console.log('\n📋 Remaining errors:');
    for (const error of errors.slice(0, 20)) {
      console.log(`${error.file}(${error.line},${error.column}): ${error.code}: ${error.message}`);
    }
    if (errors.length > 20) {
      console.log(`... and ${errors.length - 20} more errors`);
    }
  }
}

main();