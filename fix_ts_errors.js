const fs = require('fs');
const path = require('path');

// Route files to fix
const routeFiles = [
  'src/routes/timelines.ts',
  'src/routes/scenes.ts', 
  'src/routes/notes.ts',
  'src/routes/projects.ts',
  'src/routes/stories.ts',
  'src/routes/users.ts'
];

// Common patterns to fix
const fixes = [
  // Add return type annotations to route handlers
  {
    pattern: /router\.(get|post|patch|delete|put)\(['"`][^'"`]*['"`],\s*asyncHandler\(async\s*\(\s*req:\s*AuthRequest,\s*res(?::\s*Response(?:<[^>]*>)?)?\s*\)\s*=>/g,
    replacement: (match, method) => {
      if (match.includes(': Promise<')) return match; // Already has return type
      const resTypeMatch = match.match(/res:\s*Response<([^>]+)>/);
      const resType = resTypeMatch ? `Response<${resTypeMatch[1]}>` : 'Response';
      return match.replace(/\)\s*=>/, `): Promise<${resType} | void> =>`);
    }
  },
  
  // Fix undefined parameter access patterns
  {
    pattern: /req\.params\.(\w+)/g,
    replacement: (match, paramName) => {
      // Only fix if it's being used directly in function calls
      return match; // We'll handle this manually for specific cases
    }
  }
];

// Process each file
routeFiles.forEach(filePath => {
  const fullPath = path.join(__dirname, 'server', filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`File not found: ${fullPath}`);
    return;
  }
  
  let content = fs.readFileSync(fullPath, 'utf8');
  let modified = false;
  
  // Apply fixes
  fixes.forEach(fix => {
    if (typeof fix.replacement === 'function') {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    } else {
      const newContent = content.replace(fix.pattern, fix.replacement);
      if (newContent !== content) {
        content = newContent;
        modified = true;
      }
    }
  });
  
  if (modified) {
    fs.writeFileSync(fullPath, content);
    console.log(`Fixed: ${filePath}`);
  } else {
    console.log(`No changes needed: ${filePath}`);
  }
});

console.log('TypeScript fixes applied');