import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  describe('getApiStatus', () => {
    it('should return API status with message and version', () => {
      const result = controller.getApiStatus();

      expect(result).toHaveProperty('message', 'CEITBA API is running');
      expect(result).toHaveProperty('version', '1.0.0');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('timestamp');
    });

    it('should return environment from NODE_ENV or default to development', () => {
      const result = controller.getApiStatus();

      expect(result.environment).toBeDefined();
      expect(typeof result.environment).toBe('string');
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.getApiStatus();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should return timestamp close to current time', () => {
      const beforeCall = new Date();
      const result = controller.getApiStatus();
      const afterCall = new Date();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });
  });

  describe('getHealth', () => {
    it('should return health status with status and timestamp', () => {
      const result = controller.getHealth();

      expect(result).toHaveProperty('status', 'healthy');
      expect(result).toHaveProperty('timestamp');
      expect(result).toHaveProperty('uptime');
      expect(result).toHaveProperty('memory');
      expect(result).toHaveProperty('version', '1.0.0');
    });

    it('should return valid ISO timestamp', () => {
      const result = controller.getHealth();
      const timestamp = new Date(result.timestamp);

      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.toString()).not.toBe('Invalid Date');
    });

    it('should return uptime as a number', () => {
      const result = controller.getHealth();

      expect(typeof result.uptime).toBe('number');
      expect(result.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return memory usage object with expected properties', () => {
      const result = controller.getHealth();

      expect(result.memory).toHaveProperty('rss');
      expect(result.memory).toHaveProperty('heapTotal');
      expect(result.memory).toHaveProperty('heapUsed');
      expect(result.memory).toHaveProperty('external');

      expect(typeof result.memory.rss).toBe('number');
      expect(typeof result.memory.heapTotal).toBe('number');
      expect(typeof result.memory.heapUsed).toBe('number');
      expect(typeof result.memory.external).toBe('number');

      expect(result.memory.rss).toBeGreaterThan(0);
      expect(result.memory.heapTotal).toBeGreaterThan(0);
      expect(result.memory.heapUsed).toBeGreaterThan(0);
    });

    it('should return healthy status', () => {
      const result = controller.getHealth();

      expect(result.status).toBe('healthy');
    });

    it('should return timestamp close to current time', () => {
      const beforeCall = new Date();
      const result = controller.getHealth();
      const afterCall = new Date();
      const timestamp = new Date(result.timestamp);

      expect(timestamp.getTime()).toBeGreaterThanOrEqual(beforeCall.getTime());
      expect(timestamp.getTime()).toBeLessThanOrEqual(afterCall.getTime());
    });

    it('should return consistent version across multiple calls', () => {
      const result1 = controller.getHealth();
      const result2 = controller.getHealth();

      expect(result1.version).toBe(result2.version);
      expect(result1.version).toBe('1.0.0');
    });
  });
});
