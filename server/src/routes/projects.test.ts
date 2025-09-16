import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../index';
import { prisma } from '../test/setup';

describe('Projects API', () => {
  let authToken: string;
  let testUser: any;
  let testProject: any;

  beforeEach(async () => {
    // Create test user
    testUser = await prisma.user.create({
      data: {
        username: 'testuser',
        email: 'test@example.com',
        password: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
      },
    });

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );

    // Create test project
    testProject = await prisma.project.create({
      data: {
        title: 'Test Project',
        description: 'A test project',
        color: '#3b82f6',
        ownerId: testUser.id,
      },
    });
  });

  describe('GET /api/projects', () => {
    it('should return user projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toBe('Test Project');
    });

    it('should return 401 without auth token', async () => {
      await request(app)
        .get('/api/projects')
        .expect(401);
    });

    it('should return empty array for user with no projects', async () => {
      // Create another user with no projects
      const anotherUser = await prisma.user.create({
        data: {
          username: 'anotheruser',
          email: 'another@example.com',
          password: 'hashedpassword',
        },
      });

      const anotherToken = jwt.sign(
        { userId: anotherUser.id },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${anotherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should return specific project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProject.id);
      expect(response.body.data.title).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('not found');
    });

    it('should return 403 for unauthorized project access', async () => {
      // Create another user
      const anotherUser = await prisma.user.create({
        data: {
          username: 'unauthorized',
          email: 'unauthorized@example.com',
          password: 'hashedpassword',
        },
      });

      const unauthorizedToken = jwt.sign(
        { userId: anotherUser.id },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(404); // Should return 404 to prevent information disclosure
    });
  });

  describe('POST /api/projects', () => {
    it('should create new project', async () => {
      const newProject = {
        title: 'New Project',
        description: 'A new test project',
        color: '#10b981',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProject)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(newProject.title);
      expect(response.body.data.description).toBe(newProject.description);
      expect(response.body.data.color).toBe(newProject.color);
      expect(response.body.data.ownerId).toBe(testUser.id);
    });

    it('should validate required fields', async () => {
      const invalidProject = {
        description: 'Missing title',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidProject)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Title is required');
    });

    it('should validate title length', async () => {
      const projectWithLongTitle = {
        title: 'A'.repeat(201), // Assuming max length is 200
        description: 'Valid description',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectWithLongTitle)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should set default color if not provided', async () => {
      const projectWithoutColor = {
        title: 'Project Without Color',
        description: 'No color specified',
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectWithoutColor)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.color).toBeDefined();
    });
  });

  describe('PATCH /api/projects/:id', () => {
    it('should update project', async () => {
      const updateData = {
        title: 'Updated Project Title',
        description: 'Updated description',
      };

      const response = await request(app)
        .patch(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe(updateData.title);
      expect(response.body.data.description).toBe(updateData.description);
    });

    it('should prevent unauthorized updates', async () => {
      const anotherUser = await prisma.user.create({
        data: {
          username: 'unauthorized2',
          email: 'unauthorized2@example.com',
          password: 'hashedpassword',
        },
      });

      const unauthorizedToken = jwt.sign(
        { userId: anotherUser.id },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      await request(app)
        .patch(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .send({ title: 'Hacked Title' })
        .expect(404);
    });

    it('should validate update data', async () => {
      const invalidUpdate = {
        title: '', // Empty title should be invalid
      };

      const response = await request(app)
        .patch(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidUpdate)
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verify project is deleted
      const deletedProject = await prisma.project.findUnique({
        where: { id: testProject.id },
      });
      expect(deletedProject).toBeNull();
    });

    it('should prevent unauthorized deletion', async () => {
      const anotherUser = await prisma.user.create({
        data: {
          username: 'unauthorized3',
          email: 'unauthorized3@example.com',
          password: 'hashedpassword',
        },
      });

      const unauthorizedToken = jwt.sign(
        { userId: anotherUser.id },
        process.env.JWT_SECRET!,
        { expiresIn: '1h' }
      );

      await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(404);

      // Verify project still exists
      const existingProject = await prisma.project.findUnique({
        where: { id: testProject.id },
      });
      expect(existingProject).not.toBeNull();
    });
  });
});