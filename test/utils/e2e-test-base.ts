import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  resetTestDatabase,
  seedTestData,
  verifySeedDataIntegrity,
} from './test-db-setup';
import { setupMockAuth } from './auth-mock.helper';
import { PrismaService } from '@boot/database/prisma.service';

/**
 * Base class for E2E tests
 * Provides common setup/teardown logic and utilities
 * Uses transaction rollback for test isolation
 */
export class E2ETestBase {
  protected app: INestApplication;
  protected prisma: PrismaClient;
  protected moduleFixture: TestingModule;

  /**
   * Initialize the E2E test application
   * Override this in subclasses to customize the module setup
   */
  async initializeApp(moduleImports: any[] = []): Promise<void> {
    // Import AppModule dynamically to avoid circular dependencies
    const { AppModule } = await import('@boot/app.module');

    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule, ...moduleImports],
    })
      .overrideProvider(PrismaService)
      .useValue(this.prisma)
      .compile();

    this.app = this.moduleFixture.createNestApplication();

    // Apply global pipes (same as main.ts)
    this.app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      })
    );

    // Set global prefix (same as main.ts)
    this.app.setGlobalPrefix('api');

    // Setup mock authentication middleware
    setupMockAuth(this.app);

    await this.app.init();

    // Note: We override PrismaService to use our test Prisma client
    // This ensures the app and tests use the same database connection
  }

  /**
   * Setup test database before all tests
   */
  async beforeAllTests(): Promise<void> {
    this.prisma = await setupTestDatabase();
    await resetTestDatabase(this.prisma);
  }

  /**
   * Start a transaction before each test
   * This creates a savepoint that will be rolled back after the test
   *
   * Note: We use a different approach - we simply verify seed data integrity
   * and rely on proper cleanup after each test. Transaction rollback with Prisma
   * is complex because Prisma manages its own connection pool and transactions.
   */
  async beforeEachTest(): Promise<void> {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized. Call beforeAllTests() first.');
    }

    // Verify seed data integrity before starting the test
    await verifySeedDataIntegrity(this.prisma);
  }

  /**
   * Clean up after each test
   * This ensures the database returns to the clean state with only seed data
   */
  async afterEachTest(): Promise<void> {
    if (this.prisma) {
      // Clean up all test data (preserves seed data)
      await resetTestDatabase(this.prisma);
    }
  }

  /**
   * Teardown after all tests
   */
  async afterAllTests(): Promise<void> {
    if (this.app) {
      await this.app.close();
    }
    if (this.prisma) {
      await teardownTestDatabase(this.prisma);
    }
  }

  /**
   * Get the NestJS application instance
   */
  getApp(): INestApplication {
    if (!this.app) {
      throw new Error('App not initialized. Call initializeApp() first.');
    }
    return this.app;
  }

  /**
   * Get the Prisma client instance
   */
  getPrisma(): PrismaClient {
    if (!this.prisma) {
      throw new Error('Prisma client not initialized. Call beforeAllTests() first.');
    }
    return this.prisma;
  }
}

/**
 * Helper function to setup E2E test suite with standard configuration
 *
 * Usage in test files:
 * ```typescript
 * describe('MyController (e2e)', () => {
 *   let testBase: E2ETestBase;
 *
 *   beforeAll(async () => {
 *     testBase = await setupE2ETest();
 *   });
 *
 *   beforeEach(async () => {
 *     await testBase.beforeEachTest();
 *   });
 *
 *   afterEach(async () => {
 *     await testBase.afterEachTest();
 *   });
 *
 *   afterAll(async () => {
 *     await testBase.afterAllTests();
 *   });
 *
 *   it('should work', () => {
 *     // Test using testBase.getApp() and testBase.getPrisma()
 *   });
 * });
 * ```
 */
export async function setupE2ETest(moduleImports: any[] = []): Promise<E2ETestBase> {
  const testBase = new E2ETestBase();
  await testBase.beforeAllTests();
  await testBase.initializeApp(moduleImports);
  return testBase;
}
