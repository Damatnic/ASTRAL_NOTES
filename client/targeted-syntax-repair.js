import fs from 'fs'
import path from 'path'

const srcDir = './src'

// Patterns to fix common syntax errors introduced by the automated script
const fixes = [
  // Fix broken object property syntax: { key,\n    value } -> { key,\n  value }
  {
    pattern: /(\w+),\s*\n\s{4,}(\w+)/g,
    replacement: '$1,\n  $2'
  },
  
  // Fix broken interface properties: key: string,\n    value -> key: string,\n  value
  {
    pattern: /(\w+:\s*[^,\n]+),\s*\n\s{4,}(\w+)/g,
    replacement: '$1,\n  $2'
  },
  
  // Fix broken function calls: func({,\n    prop -> func({\n  prop
  {
    pattern: /(\w+\(\{),\s*\n\s{4,}(\w+)/g,
    replacement: '$1\n  $2'
  },
  
  // Fix broken template literals: ${var, iable} -> ${variable}
  {
    pattern: /\$\{([^,}]+),\s*([^}]+)\}/g,
    replacement: '${$1$2}'
  },
  
  // Fix broken React.createElement calls: React.createElement(Component, { prop,\n    variant -> React.createElement(Component, {\n  prop,\n  variant
  {
    pattern: /(React\.createElement\([^,]+,\s*\{\s*)(\w+),\s*\n\s{4,}(\w+)/g,
    replacement: '$1\n  $2,\n  $3'
  },
  
  // Fix object property assignment: prop,\n    value: -> prop: value,
  {
    pattern: /(\w+),\s*\n\s{4,}(\w+):/g,
    replacement: '$1: $2'
  },
  
  // Fix array elements with broken formatting
  {
    pattern: /(\[[\s\S]*?)\,\s*\n\s{4,}(\w+)/g,
    replacement: '$1,\n    $2'
  }
]

function fixFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8')
    let modified = false
    
    fixes.forEach(fix => {
      const newContent = content.replace(fix.pattern, fix.replacement)
      if (newContent !== content) {
        content = newContent
        modified = true
      }
    })
    
    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
      console.log(`Fixed: ${filePath}`)
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

console.log('Starting targeted syntax repair...')
const fixedFiles = processDirectory(srcDir)
console.log(`Targeted repair complete. Fixed ${fixedFiles} files.`)