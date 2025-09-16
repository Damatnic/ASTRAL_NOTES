import fs from 'fs'
import path from 'path'

const srcDir = './src'

// Advanced patterns to fix remaining syntax errors
const advancedFixes = [
  // Fix interface property commas - convert trailing commas to no commas in interfaces
  {
    pattern: /(\w+:\s*[^,\n{}]+),(\s*\n\s*\w+:)/g,
    replacement: '$1$2'
  },
  
  // Fix interface array type commas
  {
    pattern: /(\w+:\s*Array<[^>]+>),(\s*\n)/g,
    replacement: '$1$2'
  },
  
  // Fix broken object property assignments with commas in wrong places
  {
    pattern: /(\w+:\s*[^,\n]+),(\s*\n\s*})}/g,
    replacement: '$1$2'
  },
  
  // Fix interface closing braces after commas
  {
    pattern: /,(\s*\n\s*})/g,
    replacement: '$1'
  },
  
  // Fix function parameter commas at end of lines
  {
    pattern: /(\w+:\s*[^,\n]+),(\s*\n\s*\)\s*=>)/g,
    replacement: '$1$2'
  },
  
  // Fix unterminated string literals in template strings
  {
    pattern: /(`[^`]*),\s*\n\s*([^`]*`)/g,
    replacement: '$1$2'
  },
  
  // Fix broken variable names with double letters
  {
    pattern: /(\w+)(\w)\2t\b/g,
    replacement: '$1$2t'
  },
  
  // Fix broken React createElement calls with line breaks
  {
    pattern: /(React\.createElement\([^,]+,\s*{\s*)(\w+),(\s*\n\s*)(\w+):/g,
    replacement: '$1\n  $2,\n  $4:'
  },
  
  // Fix object destructuring with misplaced commas
  {
    pattern: /(\{\s*)(\w+),(\s*\n\s*)(\w+)\s*=/g,
    replacement: '$1$2$3$4 ='
  },
  
  // Fix type annotations with trailing commas
  {
    pattern: /(\w+:\s*'[^']+'\s*\|\s*'[^']+'),(\s*\n)/g,
    replacement: '$1$2'
  },
  
  // Fix function calls with broken arguments
  {
    pattern: /(\w+\([^)]*),(\s*\n\s*[^)]*\))/g,
    replacement: '$1$2'
  },
  
  // Fix array elements with trailing commas before closing bracket
  {
    pattern: /,(\s*\n\s*\])/g,
    replacement: '$1'
  },
  
  // Fix incomplete template literal expressions
  {
    pattern: /\$\{([^}]*),([^}]*)\}/g,
    replacement: '${$1$2}'
  },
  
  // Fix object properties with type annotations
  {
    pattern: /(\w+)\s*:\s*(\w+),(\s*\n\s*(\w+)\s*:)/g,
    replacement: '$1: $2$3'
  }
]

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    let fixCount = 0
    
    advancedFixes.forEach((fix, index) => {
      const newContent = content.replace(fix.pattern, fix.replacement)
      if (newContent !== content) {
        content = newContent
        modified = true
        fixCount++
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`Fixed: ${filePath} (${fixCount} patterns)`)
      return true
    }
    
    return false
  } catch (error) {
    console.error(`Error fixing ${filePath}:`, error.message)
    return false
  }
}

function processDirectory(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  let fixedCount = 0
  
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    
    if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
      fixedCount += processDirectory(fullPath)
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      if (fixFile(fullPath)) {
        fixedCount++
      }
    }
  }
  
  return fixedCount
}

console.log('Starting advanced syntax repair...')
const fixedFiles = processDirectory(srcDir)
console.log(`Advanced repair complete. Fixed ${fixedFiles} files.`)