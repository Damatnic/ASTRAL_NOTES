const fs = require('fs');
const path = require('path');

// Files to fix
const fixes = [
  {
    file: 'client/src/pages/locations/LocationsPage.tsx',
    old: '  const filteredLocations = locations.filter(location => {',
    new: '  const filteredLocations = (locations || []).filter(location => {'
  },
  {
    file: 'client/src/pages/characters/CharactersPage.tsx',
    old: '  const filteredCharacters = characters.filter(character => {',
    new: '  const filteredCharacters = (characters || []).filter(character => {'
  },
  {
    file: 'client/src/pages/notes/NotesPage.tsx',
    old: '  const filteredNotes = notes.filter(note => {',
    new: '  const filteredNotes = (notes || []).filter(note => {'
  }
];

// Apply fixes
fixes.forEach(({ file, old, new: newText }) => {
  const filePath = path.join(__dirname, file);
  
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    if (content.includes(old)) {
      content = content.replace(old, newText);
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed ${file}`);
    } else {
      console.log(`Pattern not found in ${file}`);
    }
  } else {
    console.log(`File not found: ${file}`);
  }
});

console.log('Filter issues fixed!');