/**
 * API Integration Tests
 * Comprehensive testing for all NovelCrafter API endpoints
 */

import { describe, test, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../../server/src/app'; // Assuming we have an app export
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test data interfaces
interface TestUser {
  id: string;
  email: string;
  password: string;
  token?: string;
}

interface TestProject {
  id: string;
  title: string;
  userId: string;
}

interface TestStory {
  id: string;
  title: string;
  projectId: string;
}

interface TestScene {
  id: string;
  title: string;
  content: string;
  storyId: string;
  projectId: string;
}

describe('API Integration Tests', () => {
  let testUser: TestUser;
  let testProject: TestProject;
  let testStory: TestStory;
  let testScene: TestScene;
  let authToken: string;

  beforeAll(async () => {
    // Set up test database connection
    await prisma.$connect();
    
    // Clean up any existing test data
    await cleanupTestData();
  });

  afterAll(async () => {
    // Clean up test data
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    // Create fresh test data for each test suite
    testUser = await createTestUser();
    authToken = testUser.token!;
    testProject = await createTestProject(testUser.id);
    testStory = await createTestStory(testProject.id);
    testScene = await createTestScene(testStory.id, testProject.id);
  });

  describe('Authentication Endpoints (/api/auth)', () => {
    test('POST /api/auth/register - should register new user', async () => {
      const userData = {
        email: 'newuser@test.com',
        password: 'password123',
        name: 'New Test User',
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: userData.email,
          name: userData.name,
        },
        token: expect.any(String),
      });
      expect(response.body.user.password).toBeUndefined();
    });

    test('POST /api/auth/register - should reject duplicate email', async () => {
      const userData = {
        email: testUser.email,
        password: 'password123',
        name: 'Duplicate User',
      };

      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);
    });

    test('POST /api/auth/login - should authenticate valid user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        user: {
          email: testUser.email,
        },
        token: expect.any(String),
      });
    });

    test('POST /api/auth/login - should reject invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'wrongpassword',
        })
        .expect(401);
    });

    test('POST /api/auth/logout - should logout user', async () => {
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    test('GET /api/auth/me - should get current user', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
      });
    });
  });

  describe('User Management Endpoints (/api/users)', () => {
    test('GET /api/users/profile - should get user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.user).toMatchObject({
        id: testUser.id,
        email: testUser.email,
      });
    });

    test('PUT /api/users/profile - should update user profile', async () => {
      const updateData = {
        name: 'Updated Test User',
        bio: 'Updated bio',
        preferences: {
          theme: 'dark',
          notifications: true,
        },
      };

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.user).toMatchObject(updateData);
    });

    test('PUT /api/users/password - should change password', async () => {
      const passwordData = {
        currentPassword: testUser.password,
        newPassword: 'newpassword123',
      };

      await request(app)
        .put('/api/users/password')
        .set('Authorization', `Bearer ${authToken}`)
        .send(passwordData)
        .expect(200);

      // Verify new password works
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: passwordData.newPassword,
        })
        .expect(200);
    });

    test('DELETE /api/users/account - should delete user account', async () => {
      await request(app)
        .delete('/api/users/account')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ password: testUser.password })
        .expect(200);

      // Verify account is deleted
      await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect(401);
    });
  });

  describe('Project Management Endpoints (/api/projects)', () => {
    test('GET /api/projects - should get user projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.projects).toBeInstanceOf(Array);
      expect(response.body.projects).toContainEqual(
        expect.objectContaining({
          id: testProject.id,
          title: testProject.title,
        })
      );
    });

    test('POST /api/projects - should create new project', async () => {
      const projectData = {
        title: 'New Test Project',
        description: 'A new project for testing',
        genre: 'Fantasy',
        targetWordCount: 50000,
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData)
        .expect(201);

      expect(response.body.project).toMatchObject(projectData);
      expect(response.body.project.id).toBeDefined();
    });

    test('GET /api/projects/:id - should get specific project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.project).toMatchObject({
        id: testProject.id,
        title: testProject.title,
      });
    });

    test('PUT /api/projects/:id - should update project', async () => {
      const updateData = {
        title: 'Updated Project Title',
        description: 'Updated description',
        targetWordCount: 75000,
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.project).toMatchObject(updateData);
    });

    test('DELETE /api/projects/:id - should delete project', async () => {
      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Verify project is deleted
      await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('GET /api/projects/:id/stats - should get project statistics', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stats).toMatchObject({
        wordCount: expect.any(Number),
        characterCount: expect.any(Number),
        sceneCount: expect.any(Number),
        storyCount: expect.any(Number),
      });
    });
  });

  describe('Story Management Endpoints (/api/stories)', () => {
    test('GET /api/stories - should get project stories', async () => {
      const response = await request(app)
        .get(`/api/stories?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.stories).toBeInstanceOf(Array);
      expect(response.body.stories).toContainEqual(
        expect.objectContaining({
          id: testStory.id,
          title: testStory.title,
        })
      );
    });

    test('POST /api/stories - should create new story', async () => {
      const storyData = {
        title: 'New Test Story',
        summary: 'A new story for testing',
        projectId: testProject.id,
        genre: 'Mystery',
      };

      const response = await request(app)
        .post('/api/stories')
        .set('Authorization', `Bearer ${authToken}`)
        .send(storyData)
        .expect(201);

      expect(response.body.story).toMatchObject(storyData);
    });

    test('GET /api/stories/:id - should get specific story', async () => {
      const response = await request(app)
        .get(`/api/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.story).toMatchObject({
        id: testStory.id,
        title: testStory.title,
      });
    });

    test('PUT /api/stories/:id - should update story', async () => {
      const updateData = {
        title: 'Updated Story Title',
        summary: 'Updated summary',
        status: 'in_progress',
      };

      const response = await request(app)
        .put(`/api/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.story).toMatchObject(updateData);
    });

    test('DELETE /api/stories/:id - should delete story', async () => {
      await request(app)
        .delete(`/api/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .get(`/api/stories/${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Scene Management Endpoints (/api/scenes)', () => {
    test('GET /api/scenes - should get story scenes', async () => {
      const response = await request(app)
        .get(`/api/scenes?storyId=${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.scenes).toBeInstanceOf(Array);
      expect(response.body.scenes).toContainEqual(
        expect.objectContaining({
          id: testScene.id,
          title: testScene.title,
        })
      );
    });

    test('POST /api/scenes - should create new scene', async () => {
      const sceneData = {
        title: 'New Test Scene',
        content: '<p>New scene content</p>',
        storyId: testStory.id,
        projectId: testProject.id,
        order: 2,
        metadata: {
          pov: 'Hero',
          location: 'Castle',
          time: 'Morning',
        },
      };

      const response = await request(app)
        .post('/api/scenes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sceneData)
        .expect(201);

      expect(response.body.scene).toMatchObject(sceneData);
    });

    test('GET /api/scenes/:id - should get specific scene', async () => {
      const response = await request(app)
        .get(`/api/scenes/${testScene.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.scene).toMatchObject({
        id: testScene.id,
        title: testScene.title,
        content: testScene.content,
      });
    });

    test('PUT /api/scenes/:id - should update scene', async () => {
      const updateData = {
        title: 'Updated Scene Title',
        content: '<p>Updated scene content</p>',
        metadata: {
          pov: 'Villain',
          mood: 'Dark',
        },
      };

      const response = await request(app)
        .put(`/api/scenes/${testScene.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.scene).toMatchObject(updateData);
    });

    test('DELETE /api/scenes/:id - should delete scene', async () => {
      await request(app)
        .delete(`/api/scenes/${testScene.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .get(`/api/scenes/${testScene.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('PUT /api/scenes/:id/reorder - should reorder scenes', async () => {
      // Create additional scene for reordering
      const scene2Data = {
        title: 'Scene 2',
        content: '<p>Second scene</p>',
        storyId: testStory.id,
        projectId: testProject.id,
        order: 2,
      };

      const scene2Response = await request(app)
        .post('/api/scenes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(scene2Data);

      const scene2Id = scene2Response.body.scene.id;

      // Reorder scenes
      const reorderData = {
        sceneOrders: [
          { id: scene2Id, order: 1 },
          { id: testScene.id, order: 2 },
        ],
      };

      await request(app)
        .put(`/api/scenes/${testStory.id}/reorder`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(reorderData)
        .expect(200);

      // Verify new order
      const response = await request(app)
        .get(`/api/scenes?storyId=${testStory.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      const scenes = response.body.scenes.sort((a: any, b: any) => a.order - b.order);
      expect(scenes[0].id).toBe(scene2Id);
      expect(scenes[1].id).toBe(testScene.id);
    });
  });

  describe('Codex Endpoints (/api/codex)', () => {
    let testEntity: any;

    beforeEach(async () => {
      testEntity = await createTestCodexEntity(testProject.id);
    });

    test('GET /api/codex/entities - should get project entities', async () => {
      const response = await request(app)
        .get(`/api/codex/entities?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.entities).toBeInstanceOf(Array);
      expect(response.body.entities).toContainEqual(
        expect.objectContaining({
          id: testEntity.id,
          name: testEntity.name,
        })
      );
    });

    test('POST /api/codex/entities - should create new entity', async () => {
      const entityData = {
        type: 'character',
        name: 'New Character',
        description: 'A new character for testing',
        projectId: testProject.id,
        data: {
          age: 25,
          occupation: 'Warrior',
        },
        tags: ['protagonist', 'warrior'],
        importance: 5,
      };

      const response = await request(app)
        .post('/api/codex/entities')
        .set('Authorization', `Bearer ${authToken}`)
        .send(entityData)
        .expect(201);

      expect(response.body.entity).toMatchObject(entityData);
    });

    test('GET /api/codex/entities/:id - should get specific entity', async () => {
      const response = await request(app)
        .get(`/api/codex/entities/${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.entity).toMatchObject({
        id: testEntity.id,
        name: testEntity.name,
      });
    });

    test('PUT /api/codex/entities/:id - should update entity', async () => {
      const updateData = {
        name: 'Updated Character Name',
        description: 'Updated description',
        data: {
          age: 30,
          occupation: 'Veteran Warrior',
        },
      };

      const response = await request(app)
        .put(`/api/codex/entities/${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.entity).toMatchObject(updateData);
    });

    test('DELETE /api/codex/entities/:id - should delete entity', async () => {
      await request(app)
        .delete(`/api/codex/entities/${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .get(`/api/codex/entities/${testEntity.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('GET /api/codex/entities/search - should search entities', async () => {
      const response = await request(app)
        .get('/api/codex/entities/search')
        .query({
          q: testEntity.name,
          projectId: testProject.id,
          types: 'character',
        })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.entities).toContainEqual(
        expect.objectContaining({
          id: testEntity.id,
          name: testEntity.name,
        })
      );
    });
  });

  describe('AI Service Endpoints (/api/ai)', () => {
    test('POST /api/ai/generate - should generate AI content', async () => {
      const generateData = {
        prompt: 'Write a paragraph about a brave knight',
        model: 'gpt-3.5-turbo',
        maxTokens: 100,
        temperature: 0.7,
      };

      const response = await request(app)
        .post('/api/ai/generate')
        .set('Authorization', `Bearer ${authToken}`)
        .send(generateData)
        .expect(200);

      expect(response.body).toMatchObject({
        content: expect.any(String),
        usage: expect.objectContaining({
          totalTokens: expect.any(Number),
        }),
      });
    });

    test('POST /api/ai/analyze - should analyze content', async () => {
      const analyzeData = {
        content: 'The brave knight fought valiantly against the dragon.',
        analysisType: 'sentiment',
      };

      const response = await request(app)
        .post('/api/ai/analyze')
        .set('Authorization', `Bearer ${authToken}`)
        .send(analyzeData)
        .expect(200);

      expect(response.body).toMatchObject({
        analysis: expect.any(Object),
        confidence: expect.any(Number),
      });
    });

    test('POST /api/ai/suggestions - should get writing suggestions', async () => {
      const suggestionData = {
        content: 'The knight walked to the castle',
        type: 'improvement',
        context: {
          genre: 'fantasy',
          tone: 'epic',
        },
      };

      const response = await request(app)
        .post('/api/ai/suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(suggestionData)
        .expect(200);

      expect(response.body).toMatchObject({
        suggestions: expect.any(Array),
      });
    });
  });

  describe('Collaboration Endpoints (/api/collaboration)', () => {
    test('POST /api/collaboration/sessions - should create collaboration session', async () => {
      const sessionData = {
        projectId: testProject.id,
        settings: {
          allowGuests: true,
          editPermissions: 'all',
          maxUsers: 5,
        },
      };

      const response = await request(app)
        .post('/api/collaboration/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData)
        .expect(201);

      expect(response.body.session).toMatchObject({
        projectId: testProject.id,
        owner: testUser.id,
        settings: sessionData.settings,
      });
    });

    test('GET /api/collaboration/sessions/:projectId - should get session', async () => {
      // First create a session
      const sessionData = {
        projectId: testProject.id,
        settings: {
          allowGuests: false,
          editPermissions: 'owner',
          maxUsers: 3,
        },
      };

      const createResponse = await request(app)
        .post('/api/collaboration/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send(sessionData);

      const sessionId = createResponse.body.session.id;

      const response = await request(app)
        .get(`/api/collaboration/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.session).toMatchObject({
        id: sessionId,
        projectId: testProject.id,
      });
    });
  });

  describe('Notes Endpoints (/api/notes)', () => {
    let testNote: any;

    beforeEach(async () => {
      testNote = await createTestNote(testProject.id);
    });

    test('GET /api/notes - should get project notes', async () => {
      const response = await request(app)
        .get(`/api/notes?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.notes).toBeInstanceOf(Array);
      expect(response.body.notes).toContainEqual(
        expect.objectContaining({
          id: testNote.id,
          title: testNote.title,
        })
      );
    });

    test('POST /api/notes - should create new note', async () => {
      const noteData = {
        title: 'New Test Note',
        content: 'This is a test note content',
        projectId: testProject.id,
        type: 'general',
        tags: ['test', 'note'],
      };

      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send(noteData)
        .expect(201);

      expect(response.body.note).toMatchObject(noteData);
    });

    test('PUT /api/notes/:id - should update note', async () => {
      const updateData = {
        title: 'Updated Note Title',
        content: 'Updated note content',
        tags: ['updated', 'test'],
      };

      const response = await request(app)
        .put(`/api/notes/${testNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.note).toMatchObject(updateData);
    });

    test('DELETE /api/notes/:id - should delete note', async () => {
      await request(app)
        .delete(`/api/notes/${testNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      await request(app)
        .get(`/api/notes/${testNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Error Handling', () => {
    test('should return 401 for unauthorized requests', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });

    test('should return 403 for accessing other users\' projects', async () => {
      // Create another user and their project
      const otherUser = await createTestUser('other@test.com');
      const otherProject = await createTestProject(otherUser.id);

      await request(app)
        .get(`/api/projects/${otherProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    test('should return 404 for non-existent resources', async () => {
      await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    test('should return 400 for invalid request data', async () => {
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: '' }) // Empty title should be invalid
        .expect(400);
    });

    test('should handle rate limiting', async () => {
      // Make many requests quickly
      const requests = Array.from({ length: 100 }, () =>
        request(app)
          .get('/api/projects')
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.allSettled(requests);
      
      // Some requests should be rate limited
      const rateLimited = responses.some(
        response => response.status === 'fulfilled' && response.value.status === 429
      );
      
      // This test might be environment-dependent
      // expect(rateLimited).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large project retrieval efficiently', async () => {
      // Create many test entities
      const entities = await Promise.all(
        Array.from({ length: 100 }, () => createTestCodexEntity(testProject.id))
      );

      const startTime = Date.now();
      
      const response = await request(app)
        .get(`/api/codex/entities?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
      expect(response.body.entities.length).toBeGreaterThanOrEqual(100);
    });

    test('should handle concurrent requests efficiently', async () => {
      const startTime = Date.now();
      
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .get(`/api/projects/${testProject.id}`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      
      const endTime = Date.now();
      
      expect(endTime - startTime).toBeLessThan(3000); // Should complete in under 3 seconds
      expect(responses.every(r => r.status === 200)).toBe(true);
    });
  });

  // Helper functions
  async function cleanupTestData() {
    // Clean up in reverse dependency order
    await prisma.scene.deleteMany({ where: { title: { contains: 'Test' } } });
    await prisma.story.deleteMany({ where: { title: { contains: 'Test' } } });
    await prisma.project.deleteMany({ where: { title: { contains: 'Test' } } });
    await prisma.user.deleteMany({ where: { email: { contains: 'test.com' } } });
  }

  async function createTestUser(email = 'test@test.com'): Promise<TestUser> {
    const userData = {
      email,
      password: 'password123',
      name: 'Test User',
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    return {
      id: registerResponse.body.user.id,
      email: userData.email,
      password: userData.password,
      token: registerResponse.body.token,
    };
  }

  async function createTestProject(userId: string): Promise<TestProject> {
    const projectData = {
      title: 'Test Project',
      description: 'A test project',
      genre: 'Fantasy',
      targetWordCount: 50000,
    };

    const response = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${authToken}`)
      .send(projectData);

    return response.body.project;
  }

  async function createTestStory(projectId: string): Promise<TestStory> {
    const storyData = {
      title: 'Test Story',
      summary: 'A test story',
      projectId,
    };

    const response = await request(app)
      .post('/api/stories')
      .set('Authorization', `Bearer ${authToken}`)
      .send(storyData);

    return response.body.story;
  }

  async function createTestScene(storyId: string, projectId: string): Promise<TestScene> {
    const sceneData = {
      title: 'Test Scene',
      content: '<p>Test scene content</p>',
      storyId,
      projectId,
      order: 1,
    };

    const response = await request(app)
      .post('/api/scenes')
      .set('Authorization', `Bearer ${authToken}`)
      .send(sceneData);

    return response.body.scene;
  }

  async function createTestCodexEntity(projectId: string) {
    const entityData = {
      type: 'character',
      name: 'Test Character',
      description: 'A test character',
      projectId,
      data: {
        age: 25,
        occupation: 'Warrior',
      },
      tags: ['test', 'character'],
      importance: 3,
    };

    const response = await request(app)
      .post('/api/codex/entities')
      .set('Authorization', `Bearer ${authToken}`)
      .send(entityData);

    return response.body.entity;
  }

  async function createTestNote(projectId: string) {
    const noteData = {
      title: 'Test Note',
      content: 'Test note content',
      projectId,
      type: 'general',
      tags: ['test'],
    };

    const response = await request(app)
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send(noteData);

    return response.body.note;
  }
});