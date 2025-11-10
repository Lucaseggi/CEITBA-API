import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/**
 * Mock user data for testing
 */
export interface MockUser {
  id: string;
  email: string;
  fileNumber: string;
  careerId: string;
  plan: string;
}

/**
 * Create a mock user object for testing
 */
export function createMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: 'test-user-id-' + Date.now(),
    email: 'test@itba.edu.ar',
    fileNumber: '12345',
    careerId: 'I',
    plan: '2023',
    ...overrides,
  };
}

/**
 * Mock authentication middleware for E2E tests
 * Injects a user object into the request
 */
export function mockAuthMiddleware(user: MockUser) {
  return (req: any, res: any, next: any) => {
    req.user = user;
    next();
  };
}

/**
 * Helper to make authenticated requests in E2E tests
 * Returns a supertest request with mocked authentication
 *
 * Usage:
 * ```typescript
 * const user = createMockUser();
 * await authenticatedRequest(app, user)
 *   .post('/api/v1/wiki/bookmarks/93.42')
 *   .expect(201);
 * ```
 */
export function authenticatedRequest(
  app: INestApplication,
  user: MockUser = createMockUser()
) {
  // In a real app, you might set a JWT token in the Authorization header
  // For now, we'll use a custom header that can be read by a test guard
  const agent = request(app.getHttpServer());

  // Store the user in the agent's defaults
  // Note: This is a simplified approach. In production, you'd use JWT tokens
  (agent as any).__mockUser = user;

  return agent;
}

/**
 * Extract mock user from request (for use in guards/middleware)
 */
export function getMockUserFromRequest(req: any): MockUser | undefined {
  // First check if the request agent has a mock user
  if (req.__mockUser) {
    return req.__mockUser;
  }

  // Check for test auth header
  const testAuthHeader = req.headers['x-test-user'];
  if (testAuthHeader) {
    try {
      return JSON.parse(testAuthHeader);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

/**
 * Create a test authentication guard that reads mock user data
 * This can be used to replace real authentication guards in E2E tests
 */
export class MockAuthGuard {
  canActivate(context: any): boolean {
    const request = context.switchToHttp().getRequest();
    const mockUser = getMockUserFromRequest(request);

    if (mockUser) {
      request.user = mockUser;
      return true;
    }

    // No mock user found - deny access (similar to real auth behavior)
    return false;
  }
}

/**
 * Helper to set up authentication in E2E test app
 * Replaces real auth guards with mock guards
 */
export function setupMockAuth(app: INestApplication): void {
  // This would typically override the real authentication guard
  // For now, we'll use a middleware approach
  app.use((req: any, res: any, next: any) => {
    const mockUser = getMockUserFromRequest(req);
    if (mockUser) {
      req.user = mockUser;
    }
    next();
  });
}

/**
 * Helper to make a request with specific mock user via header
 */
export function requestWithUser(app: INestApplication, user: MockUser) {
  return request(app.getHttpServer()).set('x-test-user', JSON.stringify(user));
}
