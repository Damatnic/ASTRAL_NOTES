import { Router } from 'express'
import { z } from 'zod'
import { authenticateToken } from '../middleware/noAuth'
import { prisma } from '../utils/database.js'

const router = Router()

// Validation schemas
const createLinkSchema = z.object({
  sourceType: z.string(),
  sourceId: z.string(),
  targetType: z.string(),
  targetId: z.string(),
  linkText: z.string(),
  contextBefore: z.string().optional(),
  contextAfter: z.string().optional(),
})

const batchCreateLinksSchema = z.object({
  links: z.array(createLinkSchema),
})

const searchLinksSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  linkText: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
  offset: z.number().min(0).default(0),
})

// Create a new link
router.post('/', authenticateToken, async (req, res) => {
  try {
    const linkData = createLinkSchema.parse(req.body)
    
    // Check if link already exists
    const existingLink = await prisma.link.findFirst({
      where: {
        sourceType: linkData.sourceType,
        sourceId: linkData.sourceId,
        targetType: linkData.targetType,
        targetId: linkData.targetId,
        linkText: linkData.linkText,
      },
    })

    if (existingLink) {
      return res.status(409).json({
        error: 'Link already exists',
        link: existingLink,
      })
    }

    const link = await prisma.link.create({
      data: linkData,
    })

    res.status(201).json({ link })
  } catch (error) {
    console.error('Error creating link:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to create link' })
  }
})

// Get links for a specific entity (both incoming and outgoing)
router.get('/entity/:entityType/:entityId', authenticateToken, async (req, res) => {
  try {
    const { entityType, entityId } = req.params

    // Get outgoing links (links from this entity to others)
    const outgoingLinks = await prisma.link.findMany({
      where: {
        sourceType: entityType,
        sourceId: entityId,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Get incoming links (links from other entities to this one)
    const incomingLinks = await prisma.link.findMany({
      where: {
        targetType: entityType,
        targetId: entityId,
      },
      orderBy: { createdAt: 'desc' },
    })

    // Fetch entity data for all linked entities using shared helper
    const [outgoingEntities, incomingEntities] = await Promise.all([
      Promise.all(outgoingLinks.map(link => getEntityData(link.targetType, link.targetId))),
      Promise.all(incomingLinks.map(link => getEntityData(link.sourceType, link.sourceId)))
    ])

    const response = {
      outgoingLinks: outgoingLinks.map((link, index) => ({
        ...link,
        targetEntity: {
          id: link.targetId,
          type: link.targetType,
          ...outgoingEntities[index]
        },
      })),
      incomingLinks: incomingLinks.map((link, index) => ({
        ...link,
        sourceEntity: {
          id: link.sourceId,
          type: link.sourceType,
          ...incomingEntities[index]
        },
      })),
      totalOutgoing: outgoingLinks.length,
      totalIncoming: incomingLinks.length,
    }

    res.json(response)
  } catch (error) {
    console.error('Error fetching entity links:', error)
    res.status(500).json({ error: 'Failed to fetch entity links' })
  }
})

// Helper function for entity data fetching (shared)
const getEntityData = async (entityType: string, entityId: string, linkText: string = '') => {
  try {
    switch (entityType.toLowerCase()) {
      case 'character':
        const character = await prisma.character.findUnique({
          where: { id: entityId },
          select: { id: true, name: true, role: true }
        })
        return character ? { id: character.id, title: character.name, subtitle: character.role } : null

      case 'location':
        const location = await prisma.location.findUnique({
          where: { id: entityId },
          select: { id: true, name: true, type: true }
        })
        return location ? { id: location.id, title: location.name, subtitle: location.type } : null

      case 'scene':
        const scene = await prisma.scene.findUnique({
          where: { id: entityId },
          select: { id: true, title: true, mood: true }
        })
        return scene ? { id: scene.id, title: scene.title, subtitle: scene.mood } : null

      case 'story':
        const story = await prisma.story.findUnique({
          where: { id: entityId },
          select: { id: true, title: true, genre: true }
        })
        return story ? { id: story.id, title: story.title, subtitle: story.genre } : null

      case 'project':
        const project = await prisma.project.findUnique({
          where: { id: entityId },
          select: { id: true, title: true, description: true }
        })
        return project ? { id: project.id, title: project.title, subtitle: project.description } : null

      case 'note':
        const note = await prisma.note.findUnique({
          where: { id: entityId },
          select: { id: true, title: true, category: true }
        })
        return note ? { id: note.id, title: note.title, subtitle: note.category } : null

      default:
        return { id: entityId, title: linkText || `Unknown ${entityType}`, subtitle: entityType }
    }
  } catch (error) {
    console.warn(`Failed to fetch entity data for ${entityType}:${entityId}:`, error)
    return { id: entityId, title: linkText || `Unknown ${entityType}`, subtitle: entityType }
  }
}

// Search links
router.post('/search', authenticateToken, async (req, res) => {
  try {
    const searchData = searchLinksSchema.parse(req.body)
    
    const whereClause: any = {}
    
    if (searchData.entityType) {
      whereClause.OR = [
        { sourceType: searchData.entityType },
        { targetType: searchData.entityType },
      ]
    }
    
    if (searchData.entityId) {
      whereClause.OR = [
        { sourceId: searchData.entityId },
        { targetId: searchData.entityId },
      ]
    }
    
    if (searchData.linkText) {
      whereClause.linkText = {
        contains: searchData.linkText,
        mode: 'insensitive',
      }
    }

    const [links, totalCount] = await Promise.all([
      prisma.link.findMany({
        where: whereClause,
        skip: searchData.offset,
        take: searchData.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.link.count({ where: whereClause }),
    ])

    // Fetch entity data for search results
    const [sourceEntities, targetEntities] = await Promise.all([
      Promise.all(links.map(link => getEntityData(link.sourceType, link.sourceId))),
      Promise.all(links.map(link => getEntityData(link.targetType, link.targetId)))
    ])

    const response = {
      links: links.map((link, index) => ({
        ...link,
        sourceEntity: {
          id: link.sourceId,
          type: link.sourceType,
          ...sourceEntities[index]
        },
        targetEntity: {
          id: link.targetId,
          type: link.targetType,
          ...targetEntities[index]
        },
      })),
      pagination: {
        total: totalCount,
        limit: searchData.limit,
        offset: searchData.offset,
        hasMore: searchData.offset + searchData.limit < totalCount,
      },
    }

    res.json(response)
  } catch (error) {
    console.error('Error searching links:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid search parameters', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to search links' })
  }
})

// Delete a link
router.delete('/:linkId', authenticateToken, async (req, res) => {
  try {
    const { linkId } = req.params

    const link = await prisma.link.findUnique({
      where: { id: linkId },
    })

    if (!link) {
      return res.status(404).json({ error: 'Link not found' })
    }

    await prisma.link.delete({
      where: { id: linkId },
    })

    res.json({ message: 'Link deleted successfully' })
  } catch (error) {
    console.error('Error deleting link:', error)
    res.status(500).json({ error: 'Failed to delete link' })
  }
})

// Get dead links (links pointing to non-existent entities)
router.get('/dead-links', authenticateToken, async (req, res) => {
  try {
    // This is a simplified implementation
    // In a real scenario, you'd check against actual entity existence
    const links = await prisma.link.findMany({
      orderBy: { createdAt: 'desc' },
    })

    // For now, return empty array as we don't have entity validation
    const deadLinks: any[] = []

    res.json({
      deadLinks,
      count: deadLinks.length,
    })
  } catch (error) {
    console.error('Error fetching dead links:', error)
    res.status(500).json({ error: 'Failed to fetch dead links' })
  }
})

// Batch create links
router.post('/batch', authenticateToken, async (req, res) => {
  try {
    const { links } = batchCreateLinksSchema.parse(req.body)
    
    const results = {
      createdLinks: [] as any[],
      errors: [] as Array<{ index: number; error: string }>,
      successCount: 0,
      errorCount: 0,
    }

    for (let i = 0; i < links.length; i++) {
      try {
        const linkData = links[i]
        
        // Check if link already exists
        const existingLink = await prisma.link.findFirst({
          where: {
            sourceType: linkData.sourceType,
            sourceId: linkData.sourceId,
            targetType: linkData.targetType,
            targetId: linkData.targetId,
            linkText: linkData.linkText,
          },
        })

        if (existingLink) {
          results.createdLinks.push(existingLink)
          results.successCount++
          continue
        }

        const link = await prisma.link.create({
          data: linkData,
        })

        results.createdLinks.push(link)
        results.successCount++
      } catch (error) {
        results.errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        results.errorCount++
      }
    }

    res.status(201).json(results)
  } catch (error) {
    console.error('Error batch creating links:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid request data', details: error.errors })
    }
    res.status(500).json({ error: 'Failed to batch create links' })
  }
})

export default router