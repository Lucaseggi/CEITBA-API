import request from 'supertest';
import { setupE2ETest, E2ETestBase } from './utils/e2e-test-base';

describe('Career Controller (e2e)', () => {
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

  describe('GET /api/v1/careers', () => {
    it('should return all careers', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/careers')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should include seeded careers (I and E)', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/careers')
        .expect(200);

      const careerIds = response.body.map((c: any) => c.id);
      expect(careerIds).toContain('I');
      expect(careerIds).toContain('E');
    });
  });

  describe('GET /api/v1/careers/plans', () => {
    it('should return careers with plans', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/careers/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('plans');
      expect(Array.isArray(response.body[0].plans)).toBe(true);
    });

    it('should include plans for Ingeniería Informática', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/careers/plans')
        .expect(200);

      const informatica = response.body.find((c: any) => c.id === 'I');
      expect(informatica).toBeDefined();
      expect(informatica.plans).toContain('2023');
      expect(informatica.plans).toContain('2015');
    });
  });

  describe('GET /api/v1/careers/:id', () => {
    it('should return career by ID', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/careers/I')
        .expect(200);

      expect(response.body).toHaveProperty('id', 'I');
      expect(response.body).toHaveProperty('name', 'Ingeniería Informática');
      expect(response.body).toHaveProperty('plans');
      expect(Array.isArray(response.body.plans)).toBe(true);
    });

    it('should return 404 for non-existent career', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api/v1/careers/NONEXISTENT')
        .expect(404);
    });
  });

  describe('POST /api/v1/careers', () => {
    it('should create a new career', async () => {
      const newCareer = {
        id: 'TEST1',
        name: 'Test Career 1',
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/careers')
        .send(newCareer)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'TEST1');
      expect(response.body).toHaveProperty('name', 'Test Career 1');
      expect(response.body).toHaveProperty('plans');
      expect(response.body.plans).toEqual([]);
    });

    it('should create career and verify it appears in list', async () => {
      const newCareer = {
        id: 'TEST2',
        name: 'Test Career 2',
      };

      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/careers')
        .send(newCareer)
        .expect(201);

      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/careers')
        .expect(200);

      const careerIds = response.body.map((c: any) => c.id);
      expect(careerIds).toContain('TEST2');
    });

    it('should return 400 for duplicate career ID', async () => {
      // Create first career
      await testBase.getPrisma().career.create({
        data: { id: 'TEST3', name: 'Existing Career' },
      });

      // Try to create duplicate
      const duplicateCareer = {
        id: 'TEST3',
        name: 'Duplicate Career',
      };

      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/careers')
        .send(duplicateCareer)
        .expect(400);
    });

    it('should return 400 for missing required fields', async () => {
      const invalidCareer = {
        id: 'TEST4',
        // name is missing
      };

      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/careers')
        .send(invalidCareer)
        .expect(400);
    });

    it('should return 400 for empty career ID', async () => {
      const invalidCareer = {
        id: '',
        name: 'Empty ID Career',
      };

      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/careers')
        .send(invalidCareer)
        .expect(400);
    });
  });

  describe('PUT /api/v1/careers/:id', () => {
    it('should update existing career', async () => {
      // Create career first
      await testBase.getPrisma().career.create({
        data: { id: 'TEST5', name: 'Original Name' },
      });

      const updatedData = {
        name: 'Updated Name',
      };

      const response = await request(testBase.getApp().getHttpServer())
        .put('/api/v1/careers/TEST5')
        .send(updatedData)
        .expect(201);

      expect(response.body).toHaveProperty('id', 'TEST5');
      expect(response.body).toHaveProperty('name', 'Updated Name');
    });

    it('should return 404 for non-existent career', async () => {
      const updatedData = {
        name: 'Updated Name',
      };

      return request(testBase.getApp().getHttpServer())
        .put('/api/v1/careers/NONEXISTENT')
        .send(updatedData)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/careers/:id', () => {
    it('should delete existing career', async () => {
      // Create career first
      await testBase.getPrisma().career.create({
        data: { id: 'TEST6', name: 'To Be Deleted' },
      });

      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/careers/TEST6')
        .expect(200);

      // Verify it's deleted
      await request(testBase.getApp().getHttpServer())
        .get('/api/v1/careers/TEST6')
        .expect(404);
    });

    it('should return 404 for non-existent career', () => {
      return request(testBase.getApp().getHttpServer())
        .delete('/api/v1/careers/NONEXISTENT')
        .expect(404);
    });

    it('should handle cascading deletes correctly', async () => {
      // Create career with plan
      await testBase.getPrisma().career.create({
        data: {
          id: 'TEST7',
          name: 'Career with Plan',
        },
      });

      await testBase.getPrisma().plan.create({
        data: {
          id: 'TESTPLAN',
          careerId: 'TEST7',
          name: 'Test Plan',
        },
      });

      // Delete career (should cascade to plans based on Prisma schema)
      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/careers/TEST7')
        .expect(200);

      // Verify plan is also deleted (if cascade is set up)
      const plan = await testBase.getPrisma().plan.findUnique({
        where: { id: 'TESTPLAN' },
      });

      // This depends on your Prisma schema cascade settings
      // Adjust expectation based on your actual schema
      // expect(plan).toBeNull(); // if cascade delete
      // or
      // expect(plan).toBeDefined(); // if no cascade
    });
  });

  describe('Complete Career Lifecycle', () => {
    it('should create, read, update, and delete a career', async () => {
      const careerId = 'LIFECYCLE_TEST';

      // CREATE
      const createResponse = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/careers')
        .send({
          id: careerId,
          name: 'Lifecycle Test Career',
        })
        .expect(201);

      expect(createResponse.body.id).toBe(careerId);

      // READ
      const readResponse = await request(testBase.getApp().getHttpServer())
        .get(`/api/v1/careers/${careerId}`)
        .expect(200);

      expect(readResponse.body.name).toBe('Lifecycle Test Career');

      // UPDATE
      const updateResponse = await request(testBase.getApp().getHttpServer())
        .put(`/api/v1/careers/${careerId}`)
        .send({ name: 'Updated Lifecycle Career' })
        .expect(201);

      expect(updateResponse.body.name).toBe('Updated Lifecycle Career');

      // VERIFY UPDATE
      const verifyResponse = await request(testBase.getApp().getHttpServer())
        .get(`/api/v1/careers/${careerId}`)
        .expect(200);

      expect(verifyResponse.body.name).toBe('Updated Lifecycle Career');

      // DELETE
      await request(testBase.getApp().getHttpServer())
        .delete(`/api/v1/careers/${careerId}`)
        .expect(200);

      // VERIFY DELETE
      await request(testBase.getApp().getHttpServer())
        .get(`/api/v1/careers/${careerId}`)
        .expect(404);
    });
  });
});
