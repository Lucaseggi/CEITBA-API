import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

/**
 * Test database setup utilities for E2E tests
 *
 * Note: While the plan mentioned SQLite, we're using PostgreSQL test database
 * to maintain compatibility with the Prisma schema and avoid migration issues.
 * The database is cleaned between tests for isolation.
 */

let prisma: PrismaClient;

/**
 * Initialize test database connection
 * Sets up a Prisma client connected to the test database
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  // Use TEST_DATABASE_URL if available, otherwise use regular DATABASE_URL
  const databaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL or TEST_DATABASE_URL must be set for E2E tests');
  }

  prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

  await prisma.$connect();

  return prisma;
}

/**
 * Run database migrations
 * Ensures the test database schema is up to date
 */
export async function runMigrations(): Promise<void> {
  try {
    // Run Prisma migrations
    execSync('npx prisma migrate deploy', {
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL || process.env.DATABASE_URL,
      },
      stdio: 'inherit',
    });
  } catch (error) {
    console.error('Failed to run migrations:', error);
    throw error;
  }
}

/**
 * Seed minimal test data
 * Creates foundation data needed for tests (careers, plans)
 */
export async function seedTestData(prismaClient: PrismaClient): Promise<void> {
  // Create test careers using createMany with skipDuplicates to avoid conflicts
  try {
    await prismaClient.career.createMany({
      data: [
        {
          id: 'I',
          name: 'Ingeniería Informática',
        },
        {
          id: 'E',
          name: 'Ingeniería Electrónica',
        },
      ],
      skipDuplicates: true,
    });

    // Create test plans
    await prismaClient.plan.createMany({
      data: [
        {
          id: '2023',
          careerId: 'I',
          name: 'Plan 2023',
        },
        {
          id: '2015',
          careerId: 'I',
          name: 'Plan 2015',
        },
      ],
      skipDuplicates: true,
    });
  } catch (error) {
    // Ignore duplicate key errors - data already seeded
    if ((error as any).code !== 'P2002') {
      throw error;
    }
  }
}

/**
 * Clean up test data
 * Removes all data from tables in correct order (respecting FK constraints)
 */
export async function cleanupTestData(prismaClient: PrismaClient): Promise<void> {
  // Delete in reverse dependency order
  await prismaClient.$transaction([
    // Wiki schema cleanup
    prismaClient.subjectWikiEditProposal.deleteMany(),
    prismaClient.subjectWikiPage.deleteMany(),
    prismaClient.careerNote.deleteMany(),
    prismaClient.subjectNoteVote.deleteMany(),
    prismaClient.subjectNote.deleteMany(),
    prismaClient.subjectCommentVote.deleteMany(),
    prismaClient.subjectComment.deleteMany(),
    prismaClient.subjectDifficulty.deleteMany(),
    prismaClient.subjectBookmark.deleteMany(),

    // Public schema cleanup - data tables (in FK dependency order)
    prismaClient.commissionTime.deleteMany(),
    prismaClient.commission.deleteMany(),
    prismaClient.planSubject.deleteMany(), // Must be before subjects and plans
    prismaClient.user.deleteMany(),
    prismaClient.subject.deleteMany(),

    // Delete test plans but preserve seed data (2023, 2015)
    // Must be after planSubject
    prismaClient.plan.deleteMany({
      where: {
        id: {
          startsWith: 'TEST',
        },
      },
    }),

    // Delete test careers (TEST*) but preserve seed data (I, E)
    // Must be after plans
    prismaClient.career.deleteMany({
      where: {
        id: {
          startsWith: 'TEST',
        },
      },
    }),
  ]);
}

/**
 * Reset test database to clean state
 * Useful for running a fresh set of tests
 */
export async function resetTestDatabase(prismaClient: PrismaClient): Promise<void> {
  await cleanupTestData(prismaClient);
  await seedTestData(prismaClient);
}

/**
 * Disconnect from test database
 */
export async function teardownTestDatabase(prismaClient: PrismaClient): Promise<void> {
  await prismaClient.$disconnect();
}

/**
 * Get the Prisma client instance for tests
 */
export function getTestPrismaClient(): PrismaClient {
  if (!prisma) {
    throw new Error('Test database not initialized. Call setupTestDatabase() first.');
  }
  return prisma;
}
