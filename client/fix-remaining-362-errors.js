import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Common patterns that need fixing based on the TypeScript errors we've seen
const fixes = [
  // Fix broken template literals
  {
    pattern: /\$\{\s*([^}]*),\s*([^}]*)\s*\}/g,
    replacement: (match, p1, p2) => {
      // If it looks like a broken variable, fix it
      const cleaned = p1.trim();
      return `\${${cleaned}}`;
    },
    description: 'Fix broken template literals with extra commas'
  },
  
  // Fix incomplete import statements
  {
    pattern: /import\s*\{\s*([^}]*)\s+([^}]*)\s*\}/g,
    replacement: (match, p1, p2) => {
      const imports = `${p1}, ${p2}`.split(/[,\s]+/).filter(i => i.trim()).join(', ');
      return `import { ${imports} }`;
    },
    description: 'Fix import statements missing commas'
  },
  
  // Fix broken variable names in template literals
  {
    pattern: /\$\{\s*([a-zA-Z]+)[,\s]+([a-zA-Z]+)\s*\}/g,
    replacement: '${$1$2}',
    description: 'Fix broken variable names in template literals'
  },
  
  // Fix string literals that got broken
  {
    pattern: /"\s*([^"]*),\s*([^"]*)\s*"/g,
    replacement: (match, p1, p2) => {
      if (p1.includes('${') || p2.includes('${')) {
        return `"${p1}${p2}"`;
      }
      return match;
    },
    description: 'Fix broken string literals'
  },
  
  // Fix object property syntax that got broken
  {
    pattern: /:\s*'([^']*),\s*([^']*)',/g,
    replacement: ": '$1$2',",
    description: 'Fix broken object property values'
  },
  
  // Fix React.createElement calls missing commas
  {
    pattern: /React\.createElement\(([^,]+)\s+\{/g,
    replacement: 'React.createElement($1, {',
    description: 'Fix React.createElement missing commas'
  },
  
  // Fix missing commas after object properties
  {
    pattern: /([a-zA-Z_$][a-zA-Z0-9_$]*:\s*[^,\n]+)\s+([a-zA-Z_$][a-zA-Z0-9_$]*:)/g,
    replacement: '$1,\n        $2',
    description: 'Add missing commas between object properties'
  },
  
  // Fix broken type property assignments
  {
    pattern: /type:\s*'([^']*)',?\s+title:/g,
    replacement: "type: '$1',\n        title:",
    description: 'Fix type property formatting'
  },
  
  // Fix common icon import issues
  {
    pattern: /import.*\{\s*([^}]*Volume2\s+[^}]*)\s*\}/g,
    replacement: (match, imports) => {
      const fixedImports = imports.replace(/Volume2\s+/, 'Volume2, ');
      return match.replace(imports, fixedImports);
    },
    description: 'Fix icon import missing commas'
  },
  
  // Fix specific broken patterns we've seen
  {
    pattern: /\bwritingMod\b/g,
    replacement: 'writingMode',
    description: 'Fix writingMod variable name'
  },
  
  {
    pattern: /\bassistanceLeve\b/g,
    replacement: 'assistanceLevel',
    description: 'Fix assistanceLevel variable name'
  },
  
  {
    pattern: /\bcontextAwar\b/g,
    replacement: 'contextAware',
    description: 'Fix contextAware variable name'
  },
  
  {
    pattern: /\blearningEnable\b/g,
    replacement: 'learningEnabled',
    description: 'Fix learningEnabled variable name'
  },
  
  {
    pattern: /\bcustomPromp\b/g,
    replacement: 'customPrompt',
    description: 'Fix customPrompt variable name'
  }
];

async function fixTypeScriptErrors() {
  console.log('🔧 Starting systematic TypeScript error fixing...');
  
  const srcDir = path.join(__dirname, 'src');
  let filesProcessed = 0;
  let errorsFixed = 0;

  async function processFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      let modifiedContent = content;
      let fileChanges = 0;

      // Apply each fix pattern
      for (const fix of fixes) {
        const before = modifiedContent;
        if (typeof fix.replacement === 'function') {
          modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
        } else {
          modifiedContent = modifiedContent.replace(fix.pattern, fix.replacement);
        }
        
        if (before !== modifiedContent) {
          fileChanges++;
          console.log(`  ✓ Applied: ${fix.description} in ${path.basename(filePath)}`);
        }
      }

      // Only write if changes were made
      if (modifiedContent !== content) {
        await fs.writeFile(filePath, modifiedContent, 'utf8');
        errorsFixed += fileChanges;
        console.log(`📝 Updated ${path.basename(filePath)} (${fileChanges} fixes)`);
      }

      filesProcessed++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
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
        await processFile(fullPath);
      }
    }
  }

  await walkDirectory(srcDir);

  console.log(`\n✨ Systematic fix complete!`);
  console.log(`📊 Files processed: ${filesProcessed}`);
  console.log(`🔧 Total fixes applied: ${errorsFixed}`);
  console.log(`\n🧪 Run 'npm run typecheck' to see remaining errors`);
}

// Run the script
fixTypeScriptErrors().catch(console.error);