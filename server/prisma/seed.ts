import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 12)
  
  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@astralnotes.com' },
    update: {},
    create: {
      email: 'demo@astralnotes.com',
      username: 'demo_user',
      password: hashedPassword,
      firstName: 'Demo',
      lastName: 'User',
      preferences: {
        create: {
          theme: 'light',
          editorFontSize: 14,
          editorFontFamily: 'Inter',
          autoSave: true,
          autoSaveInterval: 30,
          showWordCount: true,
          showCharacterCount: false,
          distrationFreeMode: false,
          keyboardShortcuts: {},
        }
      }
    },
    include: {
      preferences: true
    }
  })

  console.log('👤 Created demo user:', demoUser.email)

  // Create a demo project
  const demoProject = await prisma.project.create({
    data: {
      title: 'The Chronicles of Aethermoor',
      description: 'A fantasy epic spanning multiple realms and generations',
      color: '#3B82F6',
      ownerId: demoUser.id,
    }
  })

  console.log('📁 Created demo project:', demoProject.title)

  // Create demo characters
  const characters = await Promise.all([
    prisma.character.create({
      data: {
        name: 'Lyra Nightwhisper',
        description: 'A skilled elven ranger with a mysterious past',
        traits: {
          physical: { height: '5\'8"', hair: 'silver', eyes: 'violet' },
          personality: ['cautious', 'loyal', 'independent'],
          skills: ['archery', 'tracking', 'stealth']
        },
        backstory: 'Born in the Silverleaf Forest, Lyra lost her family to shadow creatures and now seeks vengeance.',
        motivation: 'To protect the innocent and uncover the truth about her family\'s death',
        conflict: 'Struggles between her desire for revenge and her duty to protect others',
        tags: ['protagonist', 'elf', 'ranger'],
        projectId: demoProject.id,
      }
    }),
    prisma.character.create({
      data: {
        name: 'Marcus Ironforge',
        description: 'A dwarven blacksmith turned reluctant hero',
        traits: {
          physical: { height: '4\'10"', hair: 'red beard', eyes: 'brown' },
          personality: ['stubborn', 'honorable', 'practical'],
          skills: ['smithing', 'combat', 'engineering']
        },
        backstory: 'Former royal blacksmith who was exiled for refusing to create weapons of war.',
        motivation: 'To redeem his family name and create something that brings peace',
        conflict: 'His pacifist ideals conflict with the need to fight for survival',
        tags: ['protagonist', 'dwarf', 'blacksmith'],
        projectId: demoProject.id,
      }
    })
  ])

  console.log('👥 Created demo characters:', characters.map(c => c.name).join(', '))

  // Create demo locations
  const locations = await Promise.all([
    prisma.location.create({
      data: {
        name: 'Silverleaf Forest',
        description: 'An ancient elven forest where the trees themselves seem to whisper secrets',
        type: 'region',
        significance: 'Birthplace of Lyra and site of the shadow creature attack',
        atmosphere: 'Mystical and serene, but with an underlying sense of danger',
        tags: ['forest', 'elven', 'magical'],
        projectId: demoProject.id,
      }
    }),
    prisma.location.create({
      data: {
        name: 'Ironhold City',
        description: 'The great dwarven city built into the heart of Mount Ironhold',
        type: 'place',
        significance: 'Marcus\'s former home and center of dwarven civilization',
        atmosphere: 'Industrial and bustling, filled with the sound of hammers and forges',
        tags: ['city', 'dwarven', 'underground'],
        projectId: demoProject.id,
      }
    })
  ])

  console.log('🏛️ Created demo locations:', locations.map(l => l.name).join(', '))

  // Create a demo story
  const demoStory = await prisma.story.create({
    data: {
      title: 'The Shadow\'s Return',
      description: 'The first book in the Chronicles of Aethermoor series',
      status: 'drafting',
      targetWords: 80000,
      order: 1,
      projectId: demoProject.id,
    }
  })

  console.log('📖 Created demo story:', demoStory.title)

  // Create demo scenes
  const scenes = await Promise.all([
    prisma.scene.create({
      data: {
        title: 'The Forest Whispers',
        content: 'The silver leaves rustled overhead as Lyra crept through the familiar paths of her childhood home. Something was wrong—the forest spirits were agitated, their whispers carrying warnings of approaching darkness.',
        summary: 'Lyra senses danger approaching the Silverleaf Forest',
        wordCount: 34,
        order: 1,
        status: 'draft',
        povCharacter: characters[0].id,
        location: locations[0].id,
        timeOfDay: 'dawn',
        tags: ['opening', 'atmospheric', 'foreshadowing'],
        storyId: demoStory.id,
      }
    }),
    prisma.scene.create({
      data: {
        title: 'The Forge\'s Last Fire',
        content: 'Marcus set down his hammer for what he believed would be the last time. The forge that had been his life\'s work would soon belong to another, and he would be just another exile walking the mountain paths.',
        summary: 'Marcus prepares to leave Ironhold City after his exile',
        wordCount: 38,
        order: 2,
        status: 'draft',
        povCharacter: characters[1].id,
        location: locations[1].id,
        timeOfDay: 'evening',
        tags: ['character-development', 'backstory'],
        storyId: demoStory.id,
      }
    })
  ])

  console.log('🎬 Created demo scenes:', scenes.map(s => s.title).join(', '))

  // Create some general notes
  await Promise.all([
    prisma.generalNote.create({
      data: {
        title: 'Magic System Notes',
        content: 'The magic in Aethermoor is based on harmony with natural elements. Practitioners must maintain balance or risk corruption.',
        type: 'research',
        tags: ['worldbuilding', 'magic'],
        userId: demoUser.id,
      }
    }),
    prisma.generalNote.create({
      data: {
        title: 'Character Name Ideas',
        content: 'Elven names: Aelindra, Thalorin, Silvanus\nDwarven names: Thorek, Grimjaw, Battlehammer\nHuman names: Cassandra, Roderick, Morgana',
        type: 'idea',
        tags: ['characters', 'names'],
        userId: demoUser.id,
      }
    })
  ])

  console.log('📝 Created demo notes')

  // Create a timeline
  const timeline = await prisma.timeline.create({
    data: {
      name: 'Main Story Timeline',
      description: 'The chronological order of events in The Shadow\'s Return',
      type: 'story',
      scale: 'days',
      projectId: demoProject.id,
      storyId: demoStory.id,
    }
  })

  // Add timeline entries
  await Promise.all([
    prisma.timelineEntry.create({
      data: {
        title: 'Lyra senses the disturbance',
        description: 'The forest spirits warn Lyra of approaching danger',
        date: new Date('2024-01-01T06:00:00Z'),
        type: 'scene',
        importance: 3,
        timelineId: timeline.id,
        sceneId: scenes[0].id,
        characterId: characters[0].id,
        locationId: locations[0].id,
      }
    }),
    prisma.timelineEntry.create({
      data: {
        title: 'Marcus\'s exile begins',
        description: 'Marcus leaves Ironhold City and begins his journey',
        date: new Date('2024-01-01T18:00:00Z'),
        type: 'scene',
        importance: 3,
        timelineId: timeline.id,
        sceneId: scenes[1].id,
        characterId: characters[1].id,
        locationId: locations[1].id,
      }
    })
  ])

  console.log('⏰ Created demo timeline and entries')

  console.log('✅ Database seeded successfully!')
  console.log('\n📊 Summary:')
  console.log(`- Users: 1 (demo@astralnotes.com / demo123)`)
  console.log(`- Projects: 1 (${demoProject.title})`)
  console.log(`- Characters: ${characters.length}`)
  console.log(`- Locations: ${locations.length}`)
  console.log(`- Stories: 1 (${demoStory.title})`)
  console.log(`- Scenes: ${scenes.length}`)
  console.log(`- Timeline entries: 2`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Error seeding database:', e)
    await prisma.$disconnect()
    process.exit(1)
  })
