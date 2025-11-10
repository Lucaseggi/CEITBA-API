import request from 'supertest';
import { setupE2ETest, E2ETestBase } from './utils/e2e-test-base';

describe.skip('User Controller (e2e)', () => {
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

  describe('POST /api/v1/users/create', () => {
    it('should create a new user with all fields', async () => {
      const newUser = {
        email: 'test.user@itba.edu.ar',
        file_number: 12345,
        name: 'Test User',
        career_id: 'I',
        plan: '2023',
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'test.user@itba.edu.ar');
      expect(response.body).toHaveProperty('file_number', 12345);
      expect(response.body).toHaveProperty('name', 'Test User');
      expect(response.body).toHaveProperty('career_id', 'I');
      expect(response.body).toHaveProperty('plan', '2023');
    });

    it('should create user with only required field (email)', async () => {
      const newUser = {
        email: 'minimal@itba.edu.ar',
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(newUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'minimal@itba.edu.ar');
    });

    it('should return 400 for missing email', async () => {
      const invalidUser = {
        name: 'No Email User',
        file_number: 54321,
      };

      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(invalidUser)
        .expect(400);
    });

    it('should return 400 for invalid email format', async () => {
      const invalidUser = {
        email: 'not-an-email',
        name: 'Invalid Email User',
      };

      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(invalidUser)
        .expect(400);
    });

    it('should return 400 for duplicate email', async () => {
      const user = {
        email: 'duplicate@itba.edu.ar',
        file_number: 11111,
      };

      // Create first user
      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(user)
        .expect(201);

      // Try to create duplicate
      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(user)
        .expect(400);
    });

    it('should return 400 for duplicate file number', async () => {
      const user1 = {
        email: 'user1@itba.edu.ar',
        file_number: 99999,
      };

      const user2 = {
        email: 'user2@itba.edu.ar',
        file_number: 99999, // Same file number
      };

      // Create first user
      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(user1)
        .expect(201);

      // Try to create user with duplicate file number
      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(user2)
        .expect(400);
    });

    it('should handle foreign key constraint for career_id', async () => {
      const userWithInvalidCareer = {
        email: 'invalid.career@itba.edu.ar',
        career_id: 'NONEXISTENT',
        plan: '2023',
      };

      // This might return 400 or 404 depending on validation logic
      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(userWithInvalidCareer);

      expect([400, 404]).toContain(response.status);
    });

    it('should create user with valid career reference', async () => {
      const userWithValidCareer = {
        email: 'valid.career@itba.edu.ar',
        file_number: 55555,
        career_id: 'I', // Seeded career
        plan: '2023', // Seeded plan
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(userWithValidCareer)
        .expect(201);

      expect(response.body.career_id).toBe('I');
      expect(response.body.plan).toBe('2023');
    });

    it('should validate file_number is a number', async () => {
      const invalidUser = {
        email: 'test@itba.edu.ar',
        file_number: 'not-a-number',
      };

      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(invalidUser)
        .expect(400);
    });

    it('should strip extra fields not in DTO (whitelist)', async () => {
      const userWithExtraFields = {
        email: 'extra.fields@itba.edu.ar',
        name: 'Extra Fields User',
        extra_field: 'should be removed',
        another_field: 123,
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(userWithExtraFields)
        .expect(201);

      expect(response.body).not.toHaveProperty('extra_field');
      expect(response.body).not.toHaveProperty('another_field');
    });
  });

  describe('GET /api/v1/users', () => {
    it('should return empty array when no users exist', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return all created users', async () => {
      // Create test users
      await testBase.getPrisma().user.createMany({
        data: [
          {
            id: 'user1',
            email: 'user1@itba.edu.ar',
            fileNumber: 10001,
            name: 'User One',
            careerId: 'I',
            plan: '2023',
          },
          {
            id: 'user2',
            email: 'user2@itba.edu.ar',
            fileNumber: 10002,
            name: 'User Two',
            careerId: 'E',
            plan: '2023',
          },
        ],
      });

      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/users')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('email');
      expect(response.body[0]).toHaveProperty('id');
    });

    it('should include all user fields in response', async () => {
      await testBase.getPrisma().user.create({
        data: {
          id: 'user3',
          email: 'user3@itba.edu.ar',
          fileNumber: 10003,
          name: 'User Three',
          careerId: 'I',
          plan: '2023',
        },
      });

      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/users')
        .expect(200);

      const user = response.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('file_number');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('career_id');
      expect(user).toHaveProperty('plan');
    });
  });

  describe('Complete User Lifecycle', () => {
    it('should create user and verify in list', async () => {
      const newUser = {
        email: 'lifecycle@itba.edu.ar',
        file_number: 77777,
        name: 'Lifecycle Test User',
        career_id: 'I',
        plan: '2023',
      };

      // CREATE
      const createResponse = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(newUser)
        .expect(201);

      const userId = createResponse.body.id;
      expect(userId).toBeDefined();

      // VERIFY IN LIST
      const listResponse = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/users')
        .expect(200);

      const userIds = listResponse.body.map((u: any) => u.id);
      expect(userIds).toContain(userId);

      const foundUser = listResponse.body.find((u: any) => u.id === userId);
      expect(foundUser.email).toBe('lifecycle@itba.edu.ar');
      expect(foundUser.file_number).toBe(77777);
      expect(foundUser.name).toBe('Lifecycle Test User');
    });
  });

  describe('User Validation Edge Cases', () => {
    it('should handle very long email addresses', async () => {
      const longEmail = 'a'.repeat(100) + '@itba.edu.ar';
      const user = {
        email: longEmail,
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(user);

      // Depending on email validation, this might succeed or fail
      // Adjust expectation based on your validation rules
      expect([201, 400]).toContain(response.status);
    });

    it('should handle special characters in name', async () => {
      const user = {
        email: 'special.chars@itba.edu.ar',
        name: "O'Brien-Smith Jr.",
        file_number: 88888,
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(user)
        .expect(201);

      expect(response.body.name).toBe("O'Brien-Smith Jr.");
    });

    it('should handle zero as file_number', async () => {
      const user = {
        email: 'zero.file@itba.edu.ar',
        file_number: 0,
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(user)
        .expect(201);

      expect(response.body.file_number).toBe(0);
    });

    it('should handle negative file_number', async () => {
      const user = {
        email: 'negative.file@itba.edu.ar',
        file_number: -1,
      };

      // Depending on validation rules, this might be allowed or rejected
      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/users/create')
        .send(user);

      expect([201, 400]).toContain(response.status);
    });
  });
});
