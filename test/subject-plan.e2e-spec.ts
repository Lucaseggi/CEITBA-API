import request from 'supertest';
import { setupE2ETest, E2ETestBase } from './utils/e2e-test-base';

describe('Subject Plan Controller (e2e)', () => {
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

  // Helper to create test subjects
  async function createTestSubjects() {
    await testBase.getPrisma().subject.createMany({
      data: [
        { id: '93.40', name: 'Matemática Discreta', credits: 6 },
        { id: '93.41', name: 'Análisis Matemático I', credits: 6 },
        { id: '93.42', name: 'Algoritmos y Estructuras de Datos', credits: 6 },
        { id: '93.50', name: 'Programación Avanzada', credits: 6 },
      ],
      skipDuplicates: true,
    });
  }

  describe('POST /api/v1/plans/:planId/subject', () => {
    beforeEach(async () => {
      await createTestSubjects();
    });

    it('should create a new subject plan', async () => {
      const subjectPlan = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
        year: 1,
        semester: 2,
        dependencies: ['93.41'],
        creditsRequired: 0,
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/plans/2023/subject')
        .send(subjectPlan)
        .expect(201);

      expect(response.body).toHaveProperty('subjectId', '93.42');
      expect(response.body).toHaveProperty('planId', '2023');
      expect(response.body).toHaveProperty('section', 'CIENCIAS_BASICAS');
      expect(response.body).toHaveProperty('year', 1);
      expect(response.body).toHaveProperty('semester', 2);
      expect(response.body.dependencies).toContain('93.41');
      expect(response.body).toHaveProperty('subject');
    });

    it('should create subject plan with minimal fields', async () => {
      const subjectPlan = {
        subjectId: '93.40',
        section: 'CIENCIAS_BASICAS',
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/plans/2023/subject')
        .send(subjectPlan)
        .expect(201);

      expect(response.body.subjectId).toBe('93.40');
      expect(response.body.section).toBe('CIENCIAS_BASICAS');
    });

    it('should return 400 for non-existent subject', async () => {
      const subjectPlan = {
        subjectId: 'NONEXISTENT',
        section: 'CIENCIAS_BASICAS',
      };

      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/plans/2023/subject')
        .send(subjectPlan)
        .expect(400);
    });

    it('should return 400 for non-existent plan', async () => {
      const subjectPlan = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
      };

      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/plans/NONEXISTENT/subject')
        .send(subjectPlan)
        .expect(400);
    });

    it('should return 400 for duplicate subject plan', async () => {
      const subjectPlan = {
        subjectId: '93.42',
        section: 'CIENCIAS_BASICAS',
      };

      // Create first time
      await request(testBase.getApp().getHttpServer())
        .post('/api/v1/plans/2023/subject')
        .send(subjectPlan)
        .expect(201);

      // Try to create duplicate
      return request(testBase.getApp().getHttpServer())
        .post('/api/v1/plans/2023/subject')
        .send(subjectPlan)
        .expect(400);
    });

    it('should handle empty dependencies array', async () => {
      const subjectPlan = {
        subjectId: '93.40',
        section: 'CIENCIAS_BASICAS',
        dependencies: [],
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/plans/2023/subject')
        .send(subjectPlan)
        .expect(201);

      expect(response.body.dependencies).toEqual([]);
    });

    it('should handle multiple dependencies', async () => {
      const subjectPlan = {
        subjectId: '93.50',
        section: 'ESPECIALIZACION',
        dependencies: ['93.40', '93.41', '93.42'],
        creditsRequired: 20,
      };

      const response = await request(testBase.getApp().getHttpServer())
        .post('/api/v1/plans/2023/subject')
        .send(subjectPlan)
        .expect(201);

      expect(response.body.dependencies).toHaveLength(3);
      expect(response.body.dependencies).toContain('93.40');
      expect(response.body.dependencies).toContain('93.41');
      expect(response.body.dependencies).toContain('93.42');
    });
  });

  describe('GET /api/v1/plans/:planId/subjects', () => {
    beforeEach(async () => {
      await createTestSubjects();

      // Create some subject plans
      await testBase.getPrisma().planSubject.createMany({
        data: [
          {
            planId: '2023',
            subjectId: '93.40',
            section: 'CIENCIAS_BASICAS',
            year: 1,
            semester: 1,
            dependencies: [],
            creditsRequired: 0,
          },
          {
            planId: '2023',
            subjectId: '93.41',
            section: 'CIENCIAS_BASICAS',
            year: 1,
            semester: 1,
            dependencies: [],
            creditsRequired: 0,
          },
          {
            planId: '2023',
            subjectId: '93.42',
            section: 'CIENCIAS_BASICAS',
            year: 1,
            semester: 2,
            dependencies: ['93.41'],
            creditsRequired: 0,
          },
          {
            planId: '2023',
            subjectId: '93.50',
            section: 'ESPECIALIZACION',
            year: 2,
            semester: 1,
            dependencies: ['93.42'],
            creditsRequired: 20,
          },
        ],
      });
    });

    it('should return all subjects for a plan', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2023/subjects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(4);
    });

    it('should filter by year', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2023/subjects?year=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((sp: any) => {
        expect(sp.year).toBe(1);
      });
    });

    it('should filter by semester', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2023/subjects?semester=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((sp: any) => {
        expect(sp.semester).toBe(1);
      });
    });

    it('should filter by section', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2023/subjects?section=CIENCIAS_BASICAS')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((sp: any) => {
        expect(sp.section).toBe('CIENCIAS_BASICAS');
      });
    });

    it('should combine multiple filters', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2023/subjects?year=1&semester=1')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((sp: any) => {
        expect(sp.year).toBe(1);
        expect(sp.semester).toBe(1);
      });
    });

    it('should return empty array for non-existent plan', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/NONEXISTENT/subjects')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/v1/plans/:planId/subject/:subjectId', () => {
    beforeEach(async () => {
      await createTestSubjects();

      await testBase.getPrisma().planSubject.create({
        data: {
          planId: '2023',
          subjectId: '93.42',
          section: 'CIENCIAS_BASICAS',
          year: 1,
          semester: 2,
          dependencies: ['93.41'],
          creditsRequired: 0,
        },
      });
    });

    it('should return specific subject plan', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2023/subject/93.42')
        .expect(200);

      expect(response.body).toHaveProperty('subjectId', '93.42');
      expect(response.body).toHaveProperty('planId', '2023');
      expect(response.body).toHaveProperty('section', 'CIENCIAS_BASICAS');
      expect(response.body).toHaveProperty('subject');
      expect(response.body.subject).toHaveProperty('name');
    });

    it('should return 404 for non-existent subject plan', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2023/subject/NONEXISTENT')
        .expect(404);
    });

    it('should return 404 for wrong plan ID', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2015/subject/93.42')
        .expect(404);
    });
  });

  describe('PUT /api/v1/plans/:planId/subject/:subjectId', () => {
    beforeEach(async () => {
      await createTestSubjects();

      await testBase.getPrisma().planSubject.create({
        data: {
          planId: '2023',
          subjectId: '93.42',
          section: 'CIENCIAS_BASICAS',
          year: 1,
          semester: 2,
          dependencies: ['93.41'],
          creditsRequired: 0,
        },
      });
    });

    it('should update subject plan', async () => {
      const updateData = {
        year: 2,
        semester: 1,
        section: 'ESPECIALIZACION',
      };

      const response = await request(testBase.getApp().getHttpServer())
        .put('/api/v1/plans/2023/subject/93.42')
        .send(updateData)
        .expect(200);

      expect(response.body.year).toBe(2);
      expect(response.body.semester).toBe(1);
      expect(response.body.section).toBe('ESPECIALIZACION');
    });

    it('should update dependencies', async () => {
      const updateData = {
        dependencies: ['93.40', '93.41'],
      };

      const response = await request(testBase.getApp().getHttpServer())
        .put('/api/v1/plans/2023/subject/93.42')
        .send(updateData)
        .expect(200);

      expect(response.body.dependencies).toHaveLength(2);
      expect(response.body.dependencies).toContain('93.40');
      expect(response.body.dependencies).toContain('93.41');
    });

    it('should update credits required', async () => {
      const updateData = {
        creditsRequired: 30,
      };

      const response = await request(testBase.getApp().getHttpServer())
        .put('/api/v1/plans/2023/subject/93.42')
        .send(updateData)
        .expect(200);

      expect(response.body.creditsRequired).toBe(30);
    });

    it('should return 404 for non-existent subject plan', async () => {
      const updateData = {
        year: 2,
      };

      return request(testBase.getApp().getHttpServer())
        .put('/api/v1/plans/2023/subject/NONEXISTENT')
        .send(updateData)
        .expect(404);
    });
  });

  describe('DELETE /api/v1/plans/:planId/subject/:subjectId', () => {
    beforeEach(async () => {
      await createTestSubjects();

      await testBase.getPrisma().planSubject.create({
        data: {
          planId: '2023',
          subjectId: '93.42',
          section: 'CIENCIAS_BASICAS',
          year: 1,
          semester: 2,
          dependencies: [],
          creditsRequired: 0,
        },
      });
    });

    it('should delete subject plan', async () => {
      await request(testBase.getApp().getHttpServer())
        .delete('/api/v1/plans/2023/subject/93.42')
        .expect(204);

      // Verify deletion
      await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/2023/subject/93.42')
        .expect(404);
    });

    it('should return 404 for non-existent subject plan', () => {
      return request(testBase.getApp().getHttpServer())
        .delete('/api/v1/plans/2023/subject/NONEXISTENT')
        .expect(404);
    });
  });

  describe('GET /api/v1/plans/subjects/:subjectId/plans', () => {
    beforeEach(async () => {
      await createTestSubjects();

      // Add subject to multiple plans
      await testBase.getPrisma().planSubject.createMany({
        data: [
          {
            planId: '2023',
            subjectId: '93.42',
            section: 'CIENCIAS_BASICAS',
            year: 1,
            semester: 2,
            dependencies: [],
            creditsRequired: 0,
          },
          {
            planId: '2015',
            subjectId: '93.42',
            section: 'CIENCIAS_BASICAS',
            year: 1,
            semester: 1,
            dependencies: [],
            creditsRequired: 0,
          },
        ],
      });
    });

    it('should return all plans for a subject', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/subjects/93.42/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      const planIds = response.body.map((sp: any) => sp.planId);
      expect(planIds).toContain('2023');
      expect(planIds).toContain('2015');
    });

    it('should return empty array for subject not in any plan', async () => {
      const response = await request(testBase.getApp().getHttpServer())
        .get('/api/v1/plans/subjects/93.40/plans')
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('Complete Subject Plan Lifecycle', () => {
    beforeEach(async () => {
      await createTestSubjects();
    });

    it('should create, read, update, and delete subject plan', async () => {
      const planId = '2023';
      const subjectId = '93.42';

      // CREATE
      const createData = {
        subjectId,
        section: 'CIENCIAS_BASICAS',
        year: 1,
        semester: 2,
        dependencies: ['93.41'],
        creditsRequired: 0,
      };

      await request(testBase.getApp().getHttpServer())
        .post(`/api/v1/plans/${planId}/subject`)
        .send(createData)
        .expect(201);

      // READ - Get specific
      const getResponse = await request(testBase.getApp().getHttpServer())
        .get(`/api/v1/plans/${planId}/subject/${subjectId}`)
        .expect(200);

      expect(getResponse.body.subjectId).toBe(subjectId);
      expect(getResponse.body.year).toBe(1);

      // READ - List all
      const listResponse = await request(testBase.getApp().getHttpServer())
        .get(`/api/v1/plans/${planId}/subjects`)
        .expect(200);

      const found = listResponse.body.find((sp: any) => sp.subjectId === subjectId);
      expect(found).toBeDefined();

      // UPDATE
      const updateData = {
        year: 2,
        semester: 1,
      };

      const updateResponse = await request(testBase.getApp().getHttpServer())
        .put(`/api/v1/plans/${planId}/subject/${subjectId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.year).toBe(2);
      expect(updateResponse.body.semester).toBe(1);

      // DELETE
      await request(testBase.getApp().getHttpServer())
        .delete(`/api/v1/plans/${planId}/subject/${subjectId}`)
        .expect(204);

      // VERIFY DELETE
      await request(testBase.getApp().getHttpServer())
        .get(`/api/v1/plans/${planId}/subject/${subjectId}`)
        .expect(404);
    });
  });
});
