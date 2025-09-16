const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'server/prisma/schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

// Replace Json fields with String
schema = schema.replace(/Json\s+@default\("[^"]*"\)/g, 'String @default("{}")');
schema = schema.replace(/Json\s+@default\(\[\]\)/g, 'String @default("[]")');
schema = schema.replace(/Json\?/g, 'String?');
schema = schema.replace(/Json\s/g, 'String ');

// Replace String[] arrays with String (will store as JSON string)
schema = schema.replace(/String\[\]\s+@default\(\[\]\)/g, 'String @default("[]")');
schema = schema.replace(/String\[\]/g, 'String');

fs.writeFileSync(schemaPath, schema, 'utf8');
console.log('Fixed Prisma schema for SQLite compatibility');