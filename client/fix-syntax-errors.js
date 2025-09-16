import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function fixSyntaxErrors() {
  const srcDir = path.join(__dirname, 'src');
  
  function processFile(filePath) {
    if (!filePath.endsWith('.tsx') && !filePath.endsWith('.ts')) return;
    
    console.log(`Processing: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Fix destructuring errors and missing commas in imports
    content = content.replace(/import\s*\{\s*([^}]*)\s*\}\s*from/g, (match, imports) => {
      // Clean up the imports
      const cleanImports = imports
        .split(',')
        .map(imp => imp.trim())
        .filter(imp => imp && imp !== '' && !imp.includes('//'))
        .join(', ');
      
      if (cleanImports !== imports) {
        modified = true;
        return `import { ${cleanImports} } from`;
      }
      return match;
    });
    
    // Fix broken destructuring patterns
    content = content.replace(/const\s*\[\s*(\w+)\s*(\w+)\s*\]\s*=\s*useState/g, 'const [$1, $2] = useState');
    content = content.replace(/\[\s*(\w+)\s*(\w+)\s*\]/g, '[$1, $2]');
    
    // Fix missing commas in object literals
    content = content.replace(/(\w+):\s*'[^']*'\s*(\w+):/g, "$1: '$2', $2:");
    content = content.replace(/(\w+):\s*"[^"]*"\s*(\w+):/g, '$1: "$2", $2:');
    
    // Fix specific syntax issues
    content = content.replace(/icon:\s*$\s*category:/g, 'icon: MapPin,\n      category:');
    content = content.replace(/const\s*\[\s*time\s*setTimeFilter\s*\]/g, 'const [timeFilter, setTimeFilter]');
    content = content.replace(/\{\s*on\s*className\s*\}/g, '{ onSuggestionApply, className }');
    
    // Fix JSX syntax issues
    content = content.replace(/\{&gt;\}/g, '{">"}');
    content = content.replace(/\{&rbrace;\}/g, '{"}"}');
    content = content.replace(/\{&lt;\}/g, '{"<"}');
    
    // Fix missing closing braces
    content = content.replace(/(\w+)=\{[^}]*$\s*(\w+)=/gm, '$1={value}\n        $2=');
    
    // Fix specific broken lines
    content = content.replace(/const\s*\[\s*(\w+)\s*(\w+)\s*\]\s*=\s*useState/g, 'const [$1, $2] = useState');
    
    // Fix array destructuring in setters
    content = content.replace(/\[\s*(\w+)\s*setTimeFilter\s*\]/g, '[$1, setTimeFilter]');
    content = content.replace(/\[\s*time\s*setTimeFilter\s*\]/g, '[timeFilter, setTimeFilter]');
    
    // Fix object property shorthand issues
    content = content.replace(/\{\s*(\w+)\s*(\w+)\s*\}/g, '{ $1, $2 }');
    
    if (modified || content !== fs.readFileSync(filePath, 'utf8')) {
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
  
  walkDirectory(srcDir);
  console.log('Syntax fixes complete!');
}

fixSyntaxErrors();