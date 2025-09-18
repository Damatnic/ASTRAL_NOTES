# CODEX SYSTEM INTEGRATION GUIDE

## Overview

The Codex system is a comprehensive Story Wiki that serves as a central repository for all story elements with intelligent connections and auto-detection capabilities. This guide covers integration, usage, and advanced features.

## 🚀 Quick Start

### 1. Database Migration

Run the Prisma migration to add the new Codex tables:

```bash
cd server
npx prisma migrate dev --name "add-codex-system"
npx prisma generate
```

### 2. Install Dependencies

The Codex system uses some additional packages that may need to be installed:

```bash
# Client dependencies
cd client
npm install framer-motion

# Server dependencies  
cd ../server
npm install express-validator
```

### 3. Basic Integration

Import and use the CodexDashboard in your project:

```tsx
import { CodexDashboard } from '@/components/codex/CodexDashboard';

function ProjectPage({ projectId }) {
  return (
    <div>
      <h1>Project Dashboard</h1>
      <CodexDashboard 
        projectId={projectId}
        onEntitySelect={(entity) => console.log('Selected:', entity)}
        onEntityEdit={(entity) => console.log('Edit:', entity)}
      />
    </div>
  );
}
```

## 📚 Core Components

### CodexDashboard

The main interface for the Codex system.

```tsx
<CodexDashboard
  projectId="project-123"           // Optional: for project-specific entities
  isUniversal={false}               // Show universal entities across projects
  onEntitySelect={(entity) => {}}   // Callback when entity is clicked
  onEntityEdit={(entity) => {}}     // Callback when edit is requested
  showCreateButton={true}           // Show create entity button
  showImportExport={true}           // Show import/export options
  compact={false}                   // Compact mode for sidebars
/>
```

### EntityEditor

Create and edit entities with type-specific fields.

```tsx
<EntityEditor
  entityId="entity-123"             // Optional: for editing existing
  entityType="character"            // Default type for new entities
  projectId="project-123"
  isOpen={showEditor}
  onClose={() => setShowEditor(false)}
  onSave={(entity) => console.log('Saved:', entity)}
  onDelete={(id) => console.log('Deleted:', id)}
  mode="create"                     // 'create' | 'edit' | 'view'
/>
```

### AutoDetectionPanel

Real-time entity detection and suggestions.

```tsx
<AutoDetectionPanel
  text={documentText}
  sourceType="scene"
  sourceId="scene-123"
  projectId="project-123"
  onReferenceClick={(ref) => console.log('Reference:', ref)}
  onSuggestionAccept={(sug) => createEntity(sug)}
  enabled={true}
  realTime={true}                   // Auto-analyze on text change
/>
```

## 🔧 Services

### CodexService

Core entity management:

```typescript
import { codexService } from '@/services/codexService';

// Create entity
const entity = await codexService.createEntity({
  type: 'character',
  name: 'John Doe',
  description: 'Main protagonist',
  projectId: 'project-123',
  importance: 5,
  tags: ['protagonist', 'hero'],
  data: {
    age: 25,
    occupation: 'Detective'
  }
});

// Search entities
const results = await codexService.searchEntities('John', {
  entityTypes: ['character'],
  projectId: 'project-123'
});

// Get entity with relationships
const fullEntity = await codexService.getEntityWithRelationships('entity-123');
```

### AutoDetectionService

Intelligent text analysis:

```typescript
import { autoDetectionService } from '@/services/autoDetectionService';

// Analyze text for entity references
const analysis = await autoDetectionService.analyzeText(
  "John met Sarah at the old castle.",
  'scene',
  'scene-123',
  'project-123'
);

console.log('References found:', analysis.references);
console.log('New suggestions:', analysis.suggestions);

// Configure detection
autoDetectionService.updateConfig({
  minimumConfidence: 0.8,
  fuzzyMatching: true,
  enabledTypes: ['character', 'location']
});
```

### EntityRelationshipService

Manage entity connections:

```typescript
import { entityRelationshipService } from '@/services/entityRelationshipService';

// Create relationship
const relationship = await codexService.createRelationship({
  fromEntityId: 'john-123',
  toEntityId: 'sarah-456',
  type: 'loves',
  strength: 8,
  description: 'Romantic interest since childhood'
});

// Generate network visualization
const network = await entityRelationshipService.generateNetworkGraph('project-123');

// Find connection paths
const paths = await entityRelationshipService.findRelationshipPath(
  'john-123', 
  'villain-789',
  3 // max depth
);
```

### CodexSearchService

Advanced search capabilities:

```typescript
import { codexSearchService } from '@/services/codexSearchService';

// Advanced search with filters
const results = await codexSearchService.search({
  query: 'magical sword',
  entityTypes: ['object', 'lore'],
  importance: { min: 3, max: 5 },
  tags: ['magical', 'weapon'],
  projectId: 'project-123',
  sortBy: 'relevance',
  limit: 20
});

// Semantic search
const similar = await codexSearchService.semanticSearch(
  'ancient artifact with mysterious powers'
);

// Save search for later
const savedSearch = await codexSearchService.saveSearch(
  'Important Magical Items',
  {
    entityTypes: ['object'],
    tags: ['magical'],
    importance: { min: 4, max: 5 }
  }
);
```

## 🎯 Entity Types and Fields

### Character
- Basic: age, gender, occupation, personality
- Details: background, goals, fears, appearance, relationships
- Advanced: character arc, voice, secrets

### Location  
- Basic: type (city/building/etc), climate, population
- Details: government, economy, culture, history, geography
- Advanced: landmarks, atmosphere, threats

### Object
- Basic: type (weapon/artifact/etc), materials, size, weight
- Details: origin, powers, history, current location
- Advanced: condition, value, restrictions

### Organization
- Basic: type (guild/government/etc), founded, headquarters
- Details: leadership, structure, purpose, membership
- Advanced: resources, influence, allies, enemies

### Event
- Basic: type (battle/political/etc), date, duration, location
- Details: participants, causes, consequences
- Advanced: significance, key details

### Lore
- Basic: type (mythology/religion/etc), origin, rules
- Details: practitioners, restrictions, manifestations
- Advanced: conflicts with other systems

### Subplot
- Basic: status, priority, characters involved
- Details: central conflict, stakes, progression
- Advanced: resolution, main plot connections

### Concept
- Basic: category, definition, examples
- Details: implications, related concepts

## 🔗 Integration with Editor

### Real-time Detection

Integrate auto-detection with your text editor:

```tsx
import { useEffect, useState } from 'react';
import { AutoDetectionPanel } from '@/components/codex/AutoDetectionPanel';

function SceneEditor({ scene }) {
  const [content, setContent] = useState(scene.content);
  const [highlights, setHighlights] = useState([]);

  const handleTextHighlight = (ranges) => {
    setHighlights(ranges);
    // Apply highlighting to your editor
    // Implementation depends on your editor (Monaco, CodeMirror, etc.)
  };

  return (
    <div className="flex">
      <div className="flex-1">
        <textarea 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-full"
        />
      </div>
      
      <div className="w-80">
        <AutoDetectionPanel
          text={content}
          sourceType="scene"
          sourceId={scene.id}
          projectId={scene.projectId}
          onTextHighlight={handleTextHighlight}
          realTime={true}
        />
      </div>
    </div>
  );
}
```

### Entity Reference Tooltips

Show entity information on hover:

```tsx
function EntityTooltip({ entityId, children }) {
  const [entity, setEntity] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);

  useEffect(() => {
    if (showTooltip && entityId) {
      codexService.getEntity(entityId).then(setEntity);
    }
  }, [showTooltip, entityId]);

  return (
    <div 
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {children}
      
      {showTooltip && entity && (
        <div className="absolute z-10 p-3 bg-white border rounded shadow-lg">
          <h4 className="font-bold">{entity.name}</h4>
          <p className="text-sm text-gray-600">{entity.type}</p>
          <p className="text-sm mt-1">{entity.description}</p>
        </div>
      )}
    </div>
  );
}
```

## 📊 Analytics and Insights

### Entity Statistics

```typescript
// Get project statistics
const stats = await codexService.getEntityStats('project-123');
console.log('Total entities:', stats.totalEntities);
console.log('Most connected:', stats.mostConnectedEntity);
console.log('Popular tags:', stats.popularTags);

// Analyze entity influence
const influence = await entityRelationshipService.analyzeEntityInfluence('project-123');
influence.forEach(entity => {
  console.log(`${entity.entity.name}: ${entity.influenceScore} influence`);
});

// Discover relationship clusters
const clusters = await entityRelationshipService.discoverRelationshipClusters('project-123');
clusters.forEach(cluster => {
  console.log(`${cluster.name}: ${cluster.entities.length} entities`);
});
```

### Search Analytics

```typescript
// Get search analytics
const analytics = await codexSearchService.getSearchAnalytics('project-123');
console.log('Popular queries:', analytics.popularQueries);
console.log('Search trends:', analytics.searchTrends);

// Entity access patterns
const pattern = await codexSearchService.getEntityAccessPattern('entity-123');
console.log('Views:', pattern.viewCount);
console.log('Related queries:', pattern.relatedQueries);
```

## 🛡️ Consistency Checking

The Codex system includes automated consistency checking:

```typescript
// Run consistency check on entity
const issues = await codexService.runConsistencyCheck('entity-123');
issues.forEach(issue => {
  console.log(`${issue.severity}: ${issue.description}`);
  console.log('Suggestions:', issue.suggestions);
});

// Get all consistency issues for project
const allIssues = await codexService.getConsistencyChecks('project-123');
const criticalIssues = allIssues.filter(issue => issue.severity === 'critical');
```

## 🚚 Data Migration

### Import from Existing Systems

```typescript
// Import entities from JSON
const importData = {
  entities: [
    {
      type: 'character',
      name: 'Old Character',
      description: 'Migrated character',
      // ... other fields
    }
  ]
};

const result = await codexService.importProject('project-123', importData);
console.log(`Imported: ${result.imported}, Errors: ${result.errors.length}`);

// Sync with legacy models
const syncResult = await codexService.syncWithLegacyModels('project-123');
console.log(`Synced: ${syncResult.synced}, Created: ${syncResult.created}`);
```

### Export Data

```typescript
// Export project data
const exportBlob = await codexService.exportProject('project-123', 'json');
const url = URL.createObjectURL(exportBlob);

// Download exported data
const a = document.createElement('a');
a.href = url;
a.download = 'project-codex.json';
a.click();
```

## 🧪 Testing

### Unit Tests

```typescript
import { codexService } from '@/services/codexService';
import { autoDetectionService } from '@/services/autoDetectionService';

describe('Codex System', () => {
  test('creates entity with correct data', async () => {
    const entity = await codexService.createEntity({
      type: 'character',
      name: 'Test Character',
      description: 'A test character',
      projectId: 'test-project'
    });
    
    expect(entity.name).toBe('Test Character');
    expect(entity.type).toBe('character');
  });

  test('detects entity references in text', async () => {
    const result = await autoDetectionService.analyzeText(
      'John walked to the castle.',
      'scene',
      'test-scene',
      'test-project'
    );
    
    expect(result.references.length).toBeGreaterThan(0);
    expect(result.statistics.totalWords).toBe(5);
  });
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { CodexDashboard } from '@/components/codex/CodexDashboard';

describe('CodexDashboard Integration', () => {
  test('loads and displays entities', async () => {
    render(<CodexDashboard projectId="test-project" />);
    
    // Wait for entities to load
    await screen.findByText('Story Codex');
    
    // Check that entities are displayed
    expect(screen.getByText('Entities')).toBeInTheDocument();
  });

  test('creates new entity', async () => {
    const onEntityCreated = jest.fn();
    
    render(
      <CodexDashboard 
        projectId="test-project"
        onEntityCreated={onEntityCreated}
      />
    );
    
    // Click create button
    fireEvent.click(screen.getByText('Create Entity'));
    
    // Fill form and submit
    // ... test form interaction
    
    expect(onEntityCreated).toHaveBeenCalled();
  });
});
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Auto-detection settings
CODEX_AUTO_DETECTION_ENABLED=true
CODEX_MIN_CONFIDENCE=0.6
CODEX_CONTEXT_WINDOW=50

# Search settings
CODEX_SEARCH_LIMIT=50
CODEX_FUZZY_SEARCH_THRESHOLD=0.7

# Analytics
CODEX_ANALYTICS_ENABLED=true
CODEX_TRACK_SEARCH_PATTERNS=true
```

### Service Configuration

```typescript
// Configure auto-detection
autoDetectionService.updateConfig({
  enabledTypes: ['character', 'location', 'object'],
  minimumConfidence: 0.7,
  contextWindow: 75,
  fuzzyMatching: true,
  caseSensitive: false,
  excludeCommonWords: true
});

// Configure search
codexSearchService.updateConfig({
  defaultLimit: 25,
  enableFacets: true,
  saveSearchHistory: true,
  maxRecentQueries: 15
});
```

## 🚀 Performance Optimization

### Database Indexing

The schema includes optimized indexes, but for large datasets consider:

```sql
-- Additional indexes for performance
CREATE INDEX idx_codex_entity_project_type ON codex_entities(projectId, type);
CREATE INDEX idx_text_reference_source ON text_references(sourceType, sourceId);
CREATE INDEX idx_entity_relationship_entities ON entity_relationships(fromEntityId, toEntityId);
```

### Caching Strategy

```typescript
// Implement caching for frequently accessed entities
const entityCache = new Map();

async function getCachedEntity(id: string) {
  if (entityCache.has(id)) {
    return entityCache.get(id);
  }
  
  const entity = await codexService.getEntity(id);
  entityCache.set(id, entity);
  
  // Cache for 5 minutes
  setTimeout(() => entityCache.delete(id), 5 * 60 * 1000);
  
  return entity;
}
```

## 🔗 API Reference

### Entity Endpoints

- `GET /api/codex/entities/project/:projectId` - Get project entities
- `GET /api/codex/entities/universal` - Get universal entities  
- `GET /api/codex/entities/:id` - Get single entity
- `POST /api/codex/entities` - Create entity
- `PUT /api/codex/entities/:id` - Update entity
- `DELETE /api/codex/entities/:id` - Delete entity

### Search Endpoints

- `POST /api/codex/search` - Advanced search
- `POST /api/codex/search/fuzzy` - Fuzzy search
- `POST /api/codex/search/semantic` - Semantic search
- `GET /api/codex/search/autocomplete` - Autocomplete suggestions

### Relationship Endpoints

- `POST /api/codex/relationships` - Create relationship
- `GET /api/codex/entities/:id/relationships` - Get entity relationships
- `GET /api/codex/relationships/path/:from/:to` - Find relationship path

### Analytics Endpoints

- `GET /api/codex/stats/:projectId` - Get project statistics
- `GET /api/codex/analysis/influence/:projectId` - Entity influence analysis
- `GET /api/codex/analysis/clusters/:projectId` - Relationship clusters

## 📝 Best Practices

### Entity Creation

1. **Use descriptive names** - Make entity names unique and searchable
2. **Set appropriate importance levels** - Use 1-5 scale consistently
3. **Add comprehensive tags** - Include genre, role, and custom tags
4. **Fill type-specific fields** - Complete relevant fields for better auto-detection
5. **Use universal entities sparingly** - Only for truly cross-project elements

### Relationship Management

1. **Define clear relationship types** - Use consistent vocabulary
2. **Set realistic strength values** - Use 1-10 scale meaningfully
3. **Add descriptions** - Explain complex relationships
4. **Consider directionality** - Use bidirectional for mutual relationships
5. **Track relationship changes** - Update when story evolves

### Auto-Detection Optimization

1. **Adjust confidence thresholds** - Fine-tune for your writing style
2. **Review suggestions regularly** - Accept/reject to improve accuracy
3. **Use consistent naming** - Help detection by using entity names consistently
4. **Configure entity types** - Enable only relevant types for better performance
5. **Provide context** - Use descriptive text around entity mentions

### Search Strategy

1. **Use specific terms** - More specific queries yield better results
2. **Leverage faceted search** - Use type and tag filters effectively
3. **Save common searches** - Create saved searches for frequent patterns
4. **Monitor search patterns** - Use analytics to improve entity organization
5. **Keep tags organized** - Use hierarchical tag structures

## 🎯 Success Metrics

Track these metrics to measure Codex effectiveness:

1. **Entity Coverage** - Percentage of story elements in Codex
2. **Reference Accuracy** - Auto-detection precision/recall
3. **Search Success Rate** - Percentage of successful searches
4. **User Engagement** - Time spent in Codex, entities created
5. **Consistency Score** - Percentage of resolved consistency issues

## 🔮 Future Enhancements

Planned improvements:

1. **AI-Powered Suggestions** - Smarter entity type inference
2. **Visual Relationship Editor** - Drag-and-drop relationship mapping
3. **Advanced Timeline Integration** - Entity timeline visualization
4. **Collaborative Features** - Real-time multi-user editing
5. **Export Integrations** - Direct export to writing tools
6. **Mobile Optimization** - Responsive design improvements
7. **Voice Input** - Speech-to-text entity creation
8. **Advanced Analytics** - Predictive insights and recommendations

---

For questions, issues, or feature requests, please refer to the project documentation or submit an issue in the repository.