import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Critical syntax fixes to repair damage from automated script
const criticalFixes = [
  // Fix object property syntax that got broken
  {
    pattern: /(\w+):\s*([^,\n]+),\s*(\w+)\s*:/g,
    replacement: '$1: $2,\n    $3:',
    description: 'Fix broken object property syntax'
  },
  
  // Fix function definitions that got broken
  {
    pattern: /(\w+):\s*\([^)]*\)\s*=>\s*\({,\s*/g,
    replacement: (match, funcName) => `${funcName}: (path: string) => ({`,
    description: 'Fix broken function definitions'
  },
  
  // Fix object opening braces that got broken
  {
    pattern: /=\s*\{,\s*/g,
    replacement: '= {',
    description: 'Fix broken object opening braces'
  },
  
  // Fix array opening brackets that got broken  
  {
    pattern: /=\s*\[,\s*/g,
    replacement: '= [',
    description: 'Fix broken array opening brackets'
  },
  
  // Fix property assignments that got broken
  {
    pattern: /(\w+):\s*\{,\s*(\w+):/g,
    replacement: '$1: {\n    $2:',
    description: 'Fix broken nested object properties'
  },
  
  // Fix type annotations that got broken
  {
    pattern: /:\s*'([^']+)',\s*(\w+):/g,
    replacement: ": '$1',\n    $2:",
    description: 'Fix broken type annotations'
  },
  
  // Fix the specific broken pattern in object property definitions
  {
    pattern: /(\w+):\s*\{,\s*(\w+):\s*([^,\n]+)/g,
    replacement: '$1: {\n    $2: $3',
    description: 'Fix specific broken object patterns'
  },
  
  // Fix the cn utility imports
  {
    pattern: /import.*\{\s*clsx,\s*type,\s*ClassValue\s*\}/g,
    replacement: 'import { clsx, type ClassValue }',
    description: 'Fix cn utility import'
  }
];

async function repairSyntaxErrors() {
  console.log('🔧 Starting critical syntax error repair...');
  
  const srcDir = path.join(__dirname, 'src');
  let filesRepaired = 0;
  let errorsFixed = 0;

  async function repairFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let repairedContent = content;
      let fileChanges = 0;

      // Apply each critical fix
      for (const fix of criticalFixes) {
        const before = repairedContent;
        if (typeof fix.replacement === 'function') {
          repairedContent = repairedContent.replace(fix.pattern, fix.replacement);
        } else {
          repairedContent = repairedContent.replace(fix.pattern, fix.replacement);
        }
        
        if (before !== repairedContent) {
          fileChanges++;
          console.log(`  ✓ Applied: ${fix.description} in ${path.basename(filePath)}`);
        }
      }

      // Only write if changes were made
      if (repairedContent !== content) {
        await fs.writeFile(filePath, repairedContent, 'utf8');
        errorsFixed += fileChanges;
        filesRepaired++;
        console.log(`📝 Repaired ${path.basename(filePath)} (${fileChanges} fixes)`);
      }

    } catch (error) {
      console.error(`❌ Error repairing ${filePath}:`, error.message);
    }
  }

  // Process all TypeScript and TSX files
  async function walkDirectory(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
        await walkDirectory(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        await repairFile(fullPath);
      }
    }
  }

  await walkDirectory(srcDir);

  console.log(`\n✨ Critical repair complete!`);
  console.log(`📊 Files repaired: ${filesRepaired}`);
  console.log(`🔧 Total fixes applied: ${errorsFixed}`);
  console.log(`\n🧪 Run 'npm run typecheck' to see if major syntax errors are resolved`);
}

// Run the repair script
repairSyntaxErrors().catch(console.error);