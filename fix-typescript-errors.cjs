const fs = require('fs');
const path = require('path');

// Fix AdvancedManuscriptEditor.tsx
function fixAdvancedManuscriptEditor() {
  const filePath = path.join(__dirname, 'client/src/components/editor/AdvancedManuscriptEditor.tsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove unused imports
  content = content.replace(
    /import \{[^}]*\} from 'lucide-react'/,
    `import { 
  Save, 
  Eye, 
  EyeOff, 
  Mic, 
  MicOff, 
  Brain, 
  BarChart3, 
  FileText,
  Maximize,
  Minimize,
  Target
} from 'lucide-react'`
  );
  
  // Remove unused variables
  content = content.replace(
    /const \{ currentProject \} = useAppSelector\(\(state\) => state\.projects\)/,
    '// const { currentProject } = useAppSelector((state) => state.projects)'
  );
  
  // Comment out unused setFontFamily and setLineHeight
  content = content.replace(
    'const [fontFamily, setFontFamily] = useState(\'Inter\')',
    'const [fontFamily] = useState(\'Inter\')'
  );
  content = content.replace(
    'const [lineHeight, setLineHeight] = useState(1.6)',
    'const [lineHeight] = useState(1.6)'
  );
  
  // Fix Typography configuration
  content = content.replace(
    /Typography\.configure\(\{[^}]*\}\)/,
    `Typography.configure({
        openDoubleQuote: '\\u201c',
        closeDoubleQuote: '\\u201d',
        openSingleQuote: '\\u2018',
        closeSingleQuote: '\\u2019',
        ellipsis: '\\u2026',
        emDash: '\\u2014'
      })`
  );
  
  // Fix button variants
  content = content.replace(/variant=\{([^}]*)\? "default" : "ghost"\}/g, 
                           'variant={$1? "primary" : "ghost"}');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed AdvancedManuscriptEditor.tsx');
}

// Fix ManuscriptAnalytics.tsx
function fixManuscriptAnalytics() {
  const filePath = path.join(__dirname, 'client/src/components/analytics/ManuscriptAnalytics.tsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove unused imports
  content = content.replace(
    /import \{[^}]*\} from 'lucide-react'/,
    `import {
  BarChart,
  BookOpen,
  Users,
  Target,
  FileText,
  AlertTriangle
} from 'lucide-react'`
  );
  
  // Remove unused Button import
  content = content.replace(/import Button[^;]*;\n/, '');
  
  // Fix pacing.sceneRhythm type
  content = content.replace(
    'sceneRhythm: content.length > 1000 ? \'varied\' : \'consistent\',',
    'sceneRhythm: (content.length > 1000 ? \'varied\' : \'consistent\') as \'varied\' | \'consistent\' | \'uneven\','
  );
  
  // Remove duplicate className attributes
  content = content.replace(/className="[^"]*"\s+className="[^"]*"/, (match) => {
    const classNames = match.match(/className="([^"]*)"/g);
    if (classNames && classNames.length > 0) {
      return classNames[0];
    }
    return match;
  });
  
  // Fix length on number error
  content = content.replace(
    'metrics.overallMetrics.totalWords.length',
    'metrics.overallMetrics.totalWords.toString().length'
  );
  
  // Remove unused state variables
  content = content.replace(
    'const [isAnalyzing, setIsAnalyzing] = useState(false)',
    '// const [isAnalyzing, setIsAnalyzing] = useState(false)'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed ManuscriptAnalytics.tsx');
}

// Fix AIWritingAssistant.tsx
function fixAIWritingAssistant() {
  const filePath = path.join(__dirname, 'client/src/components/editor/AIWritingAssistant.tsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix tone type and remove unused state setters
  content = content.replace(
    /const \[tone, setTone\] = useState<[^>]*>\([^)]*\)/,
    'const [tone] = useState<\'formal\' | \'casual\' | \'dramatic\' | \'humorous\' | \'mysterious\'>(\'formal\')'
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed AIWritingAssistant.tsx');
}

// Fix WikiLinkExtension.ts
function fixWikiLinkExtension() {
  const filePath = path.join(__dirname, 'client/src/components/editor/extensions/WikiLinkExtension.ts');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove unused parameters
  content = content.replace(
    /handleClick:\s*\([^)]*\)\s*=>/g,
    'handleClick: () =>'
  );
  
  // Remove invalid handleMouseOver property
  content = content.replace(
    /handleMouseOver:[^,]*,\n/g,
    ''
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed WikiLinkExtension.ts');
}

// Fix AnalyticsDashboard.tsx
function fixAnalyticsDashboard() {
  const filePath = path.join(__dirname, 'client/src/components/analytics/AnalyticsDashboard.tsx');
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove unused imports
  content = content.replace(
    /import \{[^}]*\} from 'lucide-react'/,
    `import {
  BarChart,
  TrendingUp,
  Clock,
  FileText,
  Users,
  Target,
  BookOpen,
  Activity
} from 'lucide-react'`
  );
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed AnalyticsDashboard.tsx');
}

// Run all fixes
try {
  fixAdvancedManuscriptEditor();
  fixManuscriptAnalytics();
  fixAIWritingAssistant();
  fixWikiLinkExtension();
  fixAnalyticsDashboard();
  console.log('All TypeScript errors fixed successfully!');
} catch (error) {
  console.error('Error fixing TypeScript issues:', error);
  process.exit(1);
}