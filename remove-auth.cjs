const fs = require('fs');
const path = require('path');

// List of route files to update
const routeFiles = [
  'characters.ts',
  'links.ts',
  'locations.ts',
  'notes.ts',
  'projects.ts',
  'scenes.ts',
  'stories.ts',
  'timelines.ts',
  'users.ts'
];

// Update each route file
routeFiles.forEach(file => {
  const filePath = path.join(__dirname, 'server/src/routes', file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace auth middleware import
    content = content.replace(
      /import\s+{\s*authenticateToken\s*}\s+from\s+['"]\.\.\/middleware\/auth['"]/g,
      "import { authenticateToken } from '../middleware/noAuth'"
    );
    
    content = content.replace(
      /import\s+{\s*authenticateToken\s*}\s+from\s+['"]\.\.\/middleware\/auth\.js['"]/g,
      "import { authenticateToken } from '../middleware/noAuth.js'"
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Auth removal complete!');