import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixFinalSyntax() {
  const specificFixes = [
    // Fix specific broken patterns introduced by previous script
    {
      pattern: /import\s*\{\s*useStat,\s*e\s*\}/g,
      replacement: 'import { useState }'
    },
    {
      pattern: /import\s*\{\s*apiClien,\s*t\s*\}/g,
      replacement: 'import { apiClient }'
    },
    {
      pattern: /\{\s*c,\s*n\s*\}/g,
      replacement: '{ cn }'
    },
    {
      pattern: /\{\s*toas,\s*t\s*\}/g,
      replacement: '{ toast }'
    },
    {
      pattern: /\{\s*Progres,\s*s\s*\}/g,
      replacement: '{ Progress }'
    },
    {
      pattern: /\$\{\s*[^}]*,\s*[^}]*\s*\}/g,
      replacement: (match) => {
        // Fix template literal variable references
        const cleaned = match.replace(/,\s*[^}]*/, '');
        return cleaned;
      }
    },
    // Fix destructuring errors
    {
      pattern: /const\s*\[\s*time\s*setTimeFilter\s*\]/g,
      replacement: 'const [timeFilter, setTimeFilter]'
    },
    {
      pattern: /\[\s*time,\s*setTimeFilter\s*\]/g,
      replacement: '[timeFilter, setTimeFilter]'
    },
    // Fix function parameter destructuring
    {
      pattern: /onClick=\{\s*on[^,]*,\s*[^}]*\s*\}/g,
      replacement: (match) => {
        if (match.includes('onClos')) return 'onClick={onClose}';
        if (match.includes('onSuggestionApply')) return 'onClick={onSuggestionApply}';
        return match.replace(/,\s*[^}]*/, '');
      }
    },
    // Fix object property patterns
    {
      pattern: /\{\s*on\s*className\s*\}/g,
      replacement: '{ onSuggestionApply, className }'
    },
    {
      pattern: /projectI,\s*d/g,
      replacement: 'projectId'
    },
    {
      pattern: /issueI,\s*d/g,
      replacement: 'issueId'
    },
    {
      pattern: /reportI,\s*d/g,
      replacement: 'reportId'
    },
    {
      pattern: /batchI,\s*d/g,
      replacement: 'batchId'
    },
    {
      pattern: /resolve,\s*d/g,
      replacement: 'resolved'
    },
    {
      pattern: /approv,\s*e/g,
      replacement: 'approve'
    },
    {
      pattern: /forma,\s*t/g,
      replacement: 'format'
    },
    {
      pattern: /\{\s*ta,\s*g\s*\}/g,
      replacement: '{tag}'
    },
    {
      pattern: /isSelecte,\s*d/g,
      replacement: 'isSelected'
    },
    {
      pattern: /startSca,\s*n/g,
      replacement: 'startScan'
    },
    {
      pattern: /isScannin,\s*g/g,
      replacement: 'isScanning'
    },
    {
      pattern: /formatDistanceToNo,\s*w/g,
      replacement: 'formatDistanceToNow'
    },
    // Fix type issues
    {
      pattern: /type:\s*'[^']*',\s*([^:]+):/g,
      replacement: (match, prop) => {
        const cleanProp = prop.trim();
        return `type: '${cleanProp}',\n  ${cleanProp}:`;
      }
    }
  ];

  function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    specificFixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    });
    
    // Additional cleanup for specific patterns
    content = content.replace(/\$\{\s*(\w+),\s*\w+\s*\}/g, '${$1}');
    content = content.replace(/key=\{\s*(\w+),\s*\w+\s*\}/g, 'key={$1}');
    content = content.replace(/\{\s*(\w+),\s*\w+\s*\}/g, '{$1}');
    
    if (modified) {
      fs.writeFileSync(filePath, content);
      console.log(`Fixed: ${filePath}`);
    }
  }
  
  function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walkDirectory(fullPath);
      } else {
        processFile(fullPath);
      }
    }
  }
  
  const srcDir = path.join(__dirname, 'src');
  walkDirectory(srcDir);
  console.log('Final syntax fixes complete!');
}

fixFinalSyntax();