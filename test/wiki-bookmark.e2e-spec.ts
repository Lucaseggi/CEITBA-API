import request from 'supertest';
import { setupE2ETest, E2ETestBase } from './utils/e2e-test-base';
import { createMockUser } from './utils/auth-mock.helper';

describe.skip('Wiki Bookmark Controller (e2e)', () => {
  let testBase: E2ETestBase;

  beforeAll(async () => {
    try {
    testBase = await setupE2ETest();
    } catch (error) {
      console.error('Failed to setup E2E test:', error);
      throw error;
    }
  });

  afterEach(async () => {
    if (testBase) {
      await testBase.afterEachTest();
    }
  });

  afterAll(async () => {
    if (testBase) {
      await testBase.afterAllTests();
    }
  });

  // Helper to create test subject
  async function createTestSubject(subjectId: string = '93.42') {
    try {
      await testBase.getPrisma().subject.create({
        data: {
          id: subjectId,
          name: 'Test Subject',
          credits: 6,
        },
      });
    } catch (error: any) {
      // Ignore duplicate key errors - subject already exists
      if (error.code !== 'P2002') {
        throw error;
      }
    }
  }

  // Helper to create test user
  async function createTestUser(userId: string = 'test-user-1') {
    await testBase.getPrisma().user.create({
      data: {
        id: userId,
        email: `${userId}@itba.edu.ar`,
        fileNumber: 12345,
        name: 'Test User',
        careerId: 'I',
        plan: '2023',
      },
    });
    return userId;
  }

  describe('GET /api/v1/wiki/bookmarks/:subjectId', () => {
    beforeEach(async () => {
      await createTestSubject('93.42');
    });

    it('should return state without user (public access)', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .expect(200);

      expect(response.body).toHaveProperty('count', 0);
      expect(response.body).toHaveProperty('bookmarked', false);
    });

    it('should return state with user who has not bookmarked', async () => {
      const userId = await createTestUser('user1');
      const mockUser = createMockUser({ id: userId });

      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(response.body).toHaveProperty('count', 0);
      expect(response.body).toHaveProperty('bookmarked', false);
    });

    it('should return state with user who has bookmarked', async () => {
      const userId = await createTestUser('user2');

      // Create bookmark
      await testBase.getPrisma().subjectBookmark.create({
        data: {
          subjectId: '93.42',
          userId: userId,
        },
      });

      const mockUser = createMockUser({ id: userId });

      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(response.body).toHaveProperty('count', 1);
      expect(response.body).toHaveProperty('bookmarked', true);
    });

    it('should return correct count with multiple bookmarks', async () => {
      const user1 = await createTestUser('user1');
      const user2 = await createTestUser('user2');
      const user3 = await createTestUser('user3');

      // Create multiple bookmarks
      await testBase.getPrisma().subjectBookmark.createMany({
        data: [
          { subjectId: '93.42', userId: user1 },
          { subjectId: '93.42', userId: user2 },
          { subjectId: '93.42', userId: user3 },
        ],
      });

      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .expect(200);

      expect(response.body).toHaveProperty('count', 3);
      expect(response.body).toHaveProperty('bookmarked', false);
    });

    it('should return zero count for subject with no bookmarks', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.bookmarked).toBe(false);
    });

    it('should handle non-existent subject gracefully', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/NONEXISTENT')
        .expect(200);

      expect(response.body.count).toBe(0);
      expect(response.body.bookmarked).toBe(false);
    });
  });

  describe('POST /api/v1/wiki/bookmarks/:subjectId', () => {
    beforeEach(async () => {
      await createTestSubject('93.42');
    });

    it('should create bookmark for authenticated user', async () => {
      const userId = await createTestUser('user1');
      const mockUser = createMockUser({ id: userId });

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(201);

      expect(response.body).toHaveProperty('count', 1);
      expect(response.body).toHaveProperty('bookmarked', true);

      // Verify in database
      const bookmark = await testBase.getPrisma().subjectBookmark.findUnique({
        where: { subjectId_userId: { subjectId: '93.42', userId } },
      });
      expect(bookmark).toBeDefined();
    });

    it('should return 401 without authentication', async () => {
      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .expect(401);
    });

    it('should be idempotent (creating twice)', async () => {
      const userId = await createTestUser('user1');
      const mockUser = createMockUser({ id: userId });

      // First creation
      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(201);

      // Second creation (should not fail)
      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(201);

      expect(response.body.count).toBe(1);
      expect(response.body.bookmarked).toBe(true);

      // Verify only one bookmark exists
      const count = await testBase.getPrisma().subjectBookmark.count({
        where: { subjectId: '93.42', userId },
      });
      expect(count).toBe(1);
    });

    it('should handle foreign key constraint for non-existent subject', async () => {
      const userId = await createTestUser('user1');
      const mockUser = createMockUser({ id: userId });

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/NONEXISTENT')
        .set('x-test-user', JSON.stringify(mockUser));

      // Should fail due to FK constraint
      expect([400, 500]).toContain(response.status);
    });

    it('should increment global count after creation', async () => {
      const user1 = await createTestUser('user1');
      const user2 = await createTestUser('user2');

      // First user bookmarks
      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(createMockUser({ id: user1 })))
        .expect(201);

      // Second user bookmarks
      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(createMockUser({ id: user2 })))
        .expect(201);

      expect(response.body.count).toBe(2);
    });
  });

  describe('PUT /api/v1/wiki/bookmarks/:subjectId', () => {
    beforeEach(async () => {
      await createTestSubject('93.42');
    });

    it('should set bookmark for authenticated user', async () => {
      const userId = await createTestUser('user1');
      const mockUser = createMockUser({ id: userId });

      const response = await request(testBase.getApp().getHttpServer())
        .put('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(response.body).toHaveProperty('count', 1);
      expect(response.body).toHaveProperty('bookmarked', true);
    });

    it('should return 401 without authentication', async () => {
      return request(testBase.getApp().getHttpServer())
        .put('/api/v1/wiki/bookmarks/93.42')
        .expect(401);
    });

    it('should be idempotent (setting twice)', async () => {
      const userId = await createTestUser('user1');
      const mockUser = createMockUser({ id: userId });

      // First set
      await request(testBase.getApp().getHttpServer())
        .put('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      // Second set (should not fail)
      const response = await request(testBase.getApp().getHttpServer())
        .put('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(response.body.count).toBe(1);
      expect(response.body.bookmarked).toBe(true);

      // Verify only one bookmark exists
      const count = await testBase.getPrisma().subjectBookmark.count({
        where: { subjectId: '93.42', userId },
      });
      expect(count).toBe(1);
    });

    it('should update existing bookmark (no-op)', async () => {
      const userId = await createTestUser('user1');

      // Create bookmark directly in DB
      await testBase.getPrisma().subjectBookmark.create({
        data: { subjectId: '93.42', userId },
      });

      const mockUser = createMockUser({ id: userId });

      // PUT should be idempotent
      const response = await request(testBase.getApp().getHttpServer())
        .put('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(response.body.bookmarked).toBe(true);
      expect(response.body.count).toBe(1);
    });
  });

  describe('DELETE /api/v1/wiki/bookmarks/:subjectId', () => {
    beforeEach(async () => {
      await createTestSubject('93.42');
    });

    it('should delete bookmark for authenticated user', async () => {
      const userId = await createTestUser('user1');

      // Create bookmark
      await testBase.getPrisma().subjectBookmark.create({
        data: { subjectId: '93.42', userId },
      });

      const mockUser = createMockUser({ id: userId });

      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(204);

      // Verify deletion
      const bookmark = await testBase.getPrisma().subjectBookmark.findUnique({
        where: { subjectId_userId: { subjectId: '93.42', userId } },
      });
      expect(bookmark).toBeNull();
    });

    it('should return 401 without authentication', async () => {
      return request(testBase.getApp().getHttpServer())
        .delete('/api/v1/wiki/bookmarks/93.42')
        .expect(401);
    });

    it('should be idempotent (deleting non-existent bookmark)', async () => {
      const userId = await createTestUser('user1');
      const mockUser = createMockUser({ id: userId });

      // Delete non-existent bookmark (should not fail)
      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(204);

      // Delete again
      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(204);
    });

    it('should decrement global count after deletion', async () => {
      const user1 = await createTestUser('user1');
      const user2 = await createTestUser('user2');

      // Create bookmarks
      await testBase.getPrisma().subjectBookmark.createMany({
        data: [
          { subjectId: '93.42', userId: user1 },
          { subjectId: '93.42', userId: user2 },
        ],
      });

      // Delete one bookmark
      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(createMockUser({ id: user1 })))
        .expect(204);

      // Check count
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .expect(200);

      expect(response.body.count).toBe(1);
    });

    it('should only delete bookmark for the authenticated user', async () => {
      const user1 = await createTestUser('user1');
      const user2 = await createTestUser('user2');

      // Create bookmarks for both users
      await testBase.getPrisma().subjectBookmark.createMany({
        data: [
          { subjectId: '93.42', userId: user1 },
          { subjectId: '93.42', userId: user2 },
        ],
      });

      // Delete user1's bookmark
      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(createMockUser({ id: user1 })))
        .expect(204);

      // Verify user1's bookmark is deleted
      const bookmark1 = await testBase.getPrisma().subjectBookmark.findUnique({
        where: { subjectId_userId: { subjectId: '93.42', userId: user1 } },
      });
      expect(bookmark1).toBeNull();

      // Verify user2's bookmark still exists
      const bookmark2 = await testBase.getPrisma().subjectBookmark.findUnique({
        where: { subjectId_userId: { subjectId: '93.42', userId: user2 } },
      });
      expect(bookmark2).toBeDefined();
    });
  });

  describe('Complete Wiki Bookmark Lifecycle', () => {
    beforeEach(async () => {
      await createTestSubject('93.42');
    });

    it('should create, verify, and delete bookmark', async () => {
      const userId = await createTestUser('user1');
      const mockUser = createMockUser({ id: userId });

      // Initial state
      const initialState = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(initialState.body.bookmarked).toBe(false);
      expect(initialState.body.count).toBe(0);

      // Create bookmark via POST
      const createResponse = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(201);

      expect(createResponse.body.bookmarked).toBe(true);
      expect(createResponse.body.count).toBe(1);

      // Verify via GET
      const getResponse = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(getResponse.body.bookmarked).toBe(true);
      expect(getResponse.body.count).toBe(1);

      // Update via PUT (idempotent)
      const updateResponse = await request(testBase.getApp().getHttpServer())
        .put('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(updateResponse.body.bookmarked).toBe(true);
      expect(updateResponse.body.count).toBe(1);

      // Delete bookmark
      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(204);

      // Verify deletion
      const finalState = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(mockUser))
        .expect(200);

      expect(finalState.body.bookmarked).toBe(false);
      expect(finalState.body.count).toBe(0);
    });

    it('should handle multiple users bookmarking the same subject', async () => {
      const user1 = await createTestUser('user1');
      const user2 = await createTestUser('user2');
      const user3 = await createTestUser('user3');

      // User 1 bookmarks
      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(createMockUser({ id: user1 })))
        .expect(201);

      // User 2 bookmarks
      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(createMockUser({ id: user2 })))
        .expect(201);

      // User 3 bookmarks
      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', JSON.stringify(createMockUser({ id: user3 })))
        .expect(201);

      // Check count
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .expect(200);

      expect(response.body.count).toBe(3);

      // Each user should see their bookmark
      for (const userId of [user1, user2, user3]) {
        const userResponse = await request(testBase.getApp().getHttpServer())
          .get('/api/v1/wiki/bookmarks/93.42')
          .set('x-test-user', JSON.stringify(createMockUser({ id: userId })))
          .expect(200);

        expect(userResponse.body.bookmarked).toBe(true);
        expect(userResponse.body.count).toBe(3);
      }
    });
  });

  describe('Authentication Edge Cases', () => {
    beforeEach(async () => {
      await createTestSubject('93.42');
    });

    it('should return 401 for POST with empty user header', async () => {
      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', '')
        .expect(401);
    });

    it('should return 401 for POST with invalid JSON in user header', async () => {
      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/wiki/bookmarks/93.42')
        .set('x-test-user', 'invalid-json')
        .expect(401);
    });

    it('should return 401 for PUT without user header', async () => {
      return request(testBase.getApp().getHttpServer())
        .put('/api/v1/wiki/bookmarks/93.42')
        .expect(401);
    });

    it('should return 401 for DELETE without user header', async () => {
      return request(testBase.getApp().getHttpServer())
        .delete('/api/v1/wiki/bookmarks/93.42')
        .expect(401);
    });

    it('should allow GET without authentication', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/wiki/bookmarks/93.42')
        .expect(200);

      expect(response.body).toHaveProperty('count');
      expect(response.body).toHaveProperty('bookmarked', false);
    });
  });
});
