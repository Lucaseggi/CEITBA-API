import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import {
  setupTestDatabase,
  teardownTestDatabase,
  cleanupTestData,
  resetTestDatabase,
} from './test-db-setup';
import { setupMockAuth } from './auth-mock.helper';

/**
 * Base class for E2E tests
 * Provides common setup/teardown logic and utilities
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
    const { AppModule } = await import('../../src/app.module');

    this.moduleFixture = await Test.createTestingModule({
      imports: [AppModule, ...moduleImports],
    }).compile();

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

    // Note: Prisma client is set up in beforeAllTests(), not here
    // We don't get it from the module because we use our own test database instance
  }

  /**
   * Setup test database before all tests
   */
  async beforeAllTests(): Promise<void> {
    this.prisma = await setupTestDatabase();
    await resetTestDatabase(this.prisma);
  }

  /**
   * Cleanup after each test
   */
  async afterEachTest(): Promise<void> {
    if (this.prisma) {
      await cleanupTestData(this.prisma);
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
