import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import { randomUUID } from 'crypto';

// Test database setup
const prisma = new PrismaClient();

beforeAll(async () => {
  // Generate unique test database schema
  const testDatabaseUrl = process.env.DATABASE_URL + '_test_' + randomUUID().slice(0, 8);
  process.env.DATABASE_URL = testDatabaseUrl;
  
  // Run migrations for test database
  execSync('npx prisma migrate dev --name init', { stdio: 'inherit' });
});

afterAll(async () => {
  // Clean up test database
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean all tables before each test
  const tablenames = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname='public'
  `;
  
  for (const { tablename } of tablenames) {
    if (tablename !== '_prisma_migrations') {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
    }
  }
});

afterEach(async () => {
  // Additional cleanup if needed
});

export { prisma };