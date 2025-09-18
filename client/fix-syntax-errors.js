#!/usr/bin/env node

/**
 * Fix Critical Syntax Errors Script
 * Repairs broken import statements and syntax issues
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const syntaxFixes = [
  // Fix broken imports
  { pattern: /import { use Params/g, replacement: 'import { useParams' },
  { pattern: /import { as Icon/g, replacement: 'import { Search as SearchIcon' },
  { pattern: /from '@\/components\/ui\/ '/g, replacement: "from '@/components/ui/Input'" },
  { pattern: /from '@\/components\/modals\/CreateProject '/g, replacement: "from '@/components/modals/CreateProjectModal'" },
  { pattern: /from '@\/components\/search\/Advanced '/g, replacement: "from '@/components/search/AdvancedSearch'" },
  { pattern: /from '@\/components\/search\/Semantic '/g, replacement: "from '@/components/search/SemanticSearch'" },
  { pattern: /set setStatus/g, replacement: 'setSearchFilter, setStatusFilter' },
  { pattern: /List, Trigger/g, replacement: 'Input' },
  { pattern: /BulkOrganization/g, replacement: 'BulkOrganizationModal' },
  { pattern: /CreateProject/g, replacement: 'CreateProjectModal' },
  { pattern: /Confirm/g, replacement: 'ConfirmModal' },
  { pattern: /Advanced/g, replacement: 'AdvancedSearch' },
  { pattern: /Semantic/g, replacement: 'SemanticSearch' },
  
  // Fix missing commas in imports
  { pattern: /} from 'lucide-react';(\s*)import {/g, replacement: "} from 'lucide-react';$1import {" },
  
  // Fix broken variable declarations
  { pattern: /let (\w+) = ([^;]+);/g, replacement: 'const $1 = $2;' },
  
  // Fix empty import paths
  { pattern: /from '@\/[^']*\/\s*'/g, replacement: "from '@/components/ui/Input'" },
  
  // Fix parsing errors in imports
  { pattern: /import { ([^}]*[^,])\s*([^}]*) } from/g, replacement: 'import { $1, $2 } from' },
];

const filesToFix = [
  'src/pages/Projects.tsx',
  'src/pages/QuickNotes.tsx', 
  'src/pages/Search.tsx',
  'src/pages/Settings.tsx',
  'src/pages/StoryEditor.tsx',
  'src/pages/TestDashboard.tsx'
];

function fixSyntaxErrors(filePath) {
  console.log(`Fixing syntax errors in ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Apply syntax fixes
  syntaxFixes.forEach(fix => {
    content = content.replace(fix.pattern, fix.replacement);
  });
  
  // Additional specific fixes
  content = content.replace(/import { Card} from/, "import { Card, CardContent, CardDescription, CardHeader, CardTitle } from");
  content = content.replace(/Star, Zap, MessageSquare, Clock} from 'lucide-react';/, "Star, Zap, MessageSquare, Clock } from 'lucide-react';");
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Fixed ${filePath}`);
  } else {
    console.log(`ℹ️  No changes needed for ${filePath}`);
  }
}

// Process all files
console.log('🔧 Fixing critical syntax errors...\n');

filesToFix.forEach(file => {
  const fullPath = path.join(__dirname, file);
  fixSyntaxErrors(fullPath);
});

console.log('\n✅ Syntax error fixes completed!');
console.log('Testing build...');
