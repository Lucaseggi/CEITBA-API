import request from 'supertest';
import { setupE2ETest, E2ETestBase } from './utils/e2e-test-base';

describe('Health Controller (e2e)', () => {
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

  describe('GET /api/health', () => {
    it('should return health status with 200', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'healthy');
          expect(res.body).toHaveProperty('timestamp');
          expect(res.body).toHaveProperty('uptime');
          expect(res.body).toHaveProperty('memory');
          expect(res.body).toHaveProperty('version');
        });
    });

    it('should return valid timestamp', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          const timestamp = new Date(res.body.timestamp);
          expect(timestamp).toBeInstanceOf(Date);
          expect(timestamp.toString()).not.toBe('Invalid Date');
        });
    });

    it('should return memory usage object', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.memory).toHaveProperty('rss');
          expect(res.body.memory).toHaveProperty('heapTotal');
          expect(res.body.memory).toHaveProperty('heapUsed');
          expect(res.body.memory).toHaveProperty('external');

          expect(typeof res.body.memory.rss).toBe('number');
          expect(typeof res.body.memory.heapTotal).toBe('number');
          expect(typeof res.body.memory.heapUsed).toBe('number');
        });
    });

    it('should return uptime as number', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api/health')
        .expect(200)
        .expect((res) => {
          expect(typeof res.body.uptime).toBe('number');
          expect(res.body.uptime).toBeGreaterThanOrEqual(0);
        });
    });
  });

  describe('GET /api (root)', () => {
    it('should return API status with 200', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('message', 'CEITBA API is running');
          expect(res.body).toHaveProperty('version');
          expect(res.body).toHaveProperty('environment');
          expect(res.body).toHaveProperty('timestamp');
        });
    });

    it('should return environment information', () => {
      return request(testBase.getApp().getHttpServer())
        .get('/api')
        .expect(200)
        .expect((res) => {
          expect(res.body.environment).toBeDefined();
          expect(typeof res.body.environment).toBe('string');
        });
    });
  });
});
