import { ApiFactory } from './api-factory';
import { FetchApiClient } from './fetch-api-client';
import { ExternalApiConfig } from './api-client.interface';

describe('ApiFactory', () => {
  const mockConfig: ExternalApiConfig = {
    baseUrl: 'https://api.example.com',
    apiKey: 'test-key',
    timeout: 5000,
  };

  beforeEach(() => {
    // Clear the factory's internal client cache before each test
    ApiFactory.clearClients();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createClient', () => {
    it('should create a new client with given name and config', () => {
      const client = ApiFactory.createClient('test-client', mockConfig);

      expect(client).toBeInstanceOf(FetchApiClient);
    });

    it('should return the same client when called with the same name', () => {
      const client1 = ApiFactory.createClient('test-client', mockConfig);
      const client2 = ApiFactory.createClient('test-client', mockConfig);

      expect(client1).toBe(client2);
    });

    it('should create different clients for different names', () => {
      const client1 = ApiFactory.createClient('client-1', mockConfig);
      const client2 = ApiFactory.createClient('client-2', mockConfig);

      expect(client1).not.toBe(client2);
      expect(client1).toBeInstanceOf(FetchApiClient);
      expect(client2).toBeInstanceOf(FetchApiClient);
    });

    it('should cache the client for future retrieval', () => {
      ApiFactory.createClient('cached-client', mockConfig);
      const retrievedClient = ApiFactory.getClient('cached-client');

      expect(retrievedClient).toBeInstanceOf(FetchApiClient);
      expect(retrievedClient).toBeDefined();
    });
  });

  describe('createNewClient', () => {
    it('should always create a new client instance', () => {
      const client1 = ApiFactory.createNewClient(mockConfig);
      const client2 = ApiFactory.createNewClient(mockConfig);

      expect(client1).toBeInstanceOf(FetchApiClient);
      expect(client2).toBeInstanceOf(FetchApiClient);
      expect(client1).not.toBe(client2);
    });

    it('should not cache the created client', () => {
      ApiFactory.createNewClient(mockConfig);

      // Since createNewClient doesn't use a name, there's no way to retrieve it from cache
      // Just verify it creates a valid client
      const client = ApiFactory.createNewClient(mockConfig);
      expect(client).toBeInstanceOf(FetchApiClient);
    });
  });

  describe('getClient', () => {
    it('should return undefined when client does not exist', () => {
      const client = ApiFactory.getClient('non-existent');

      expect(client).toBeUndefined();
    });

    it('should return the cached client when it exists', () => {
      const createdClient = ApiFactory.createClient('existing-client', mockConfig);
      const retrievedClient = ApiFactory.getClient('existing-client');

      expect(retrievedClient).toBe(createdClient);
    });

    it('should return undefined after client is removed', () => {
      ApiFactory.createClient('temp-client', mockConfig);
      ApiFactory.removeClient('temp-client');

      const client = ApiFactory.getClient('temp-client');
      expect(client).toBeUndefined();
    });
  });

  describe('removeClient', () => {
    it('should remove client from cache', () => {
      ApiFactory.createClient('removable-client', mockConfig);

      ApiFactory.removeClient('removable-client');

      const client = ApiFactory.getClient('removable-client');
      expect(client).toBeUndefined();
    });

    it('should not throw error when removing non-existent client', () => {
      expect(() => {
        ApiFactory.removeClient('non-existent');
      }).not.toThrow();
    });

    it('should only remove the specified client', () => {
      ApiFactory.createClient('client-1', mockConfig);
      ApiFactory.createClient('client-2', mockConfig);

      ApiFactory.removeClient('client-1');

      expect(ApiFactory.getClient('client-1')).toBeUndefined();
      expect(ApiFactory.getClient('client-2')).toBeDefined();
    });
  });

  describe('clearClients', () => {
    it('should remove all cached clients', () => {
      ApiFactory.createClient('client-1', mockConfig);
      ApiFactory.createClient('client-2', mockConfig);
      ApiFactory.createClient('client-3', mockConfig);

      ApiFactory.clearClients();

      expect(ApiFactory.getClient('client-1')).toBeUndefined();
      expect(ApiFactory.getClient('client-2')).toBeUndefined();
      expect(ApiFactory.getClient('client-3')).toBeUndefined();
    });

    it('should allow creating new clients after clearing', () => {
      ApiFactory.createClient('client-1', mockConfig);
      ApiFactory.clearClients();

      const newClient = ApiFactory.createClient('client-1', mockConfig);
      expect(newClient).toBeInstanceOf(FetchApiClient);
      expect(ApiFactory.getClient('client-1')).toBe(newClient);
    });

    it('should not throw error when clearing empty cache', () => {
      expect(() => {
        ApiFactory.clearClients();
      }).not.toThrow();
    });
  });

  describe('client caching behavior', () => {
    it('should maintain separate instances for different names', () => {
      const config1: ExternalApiConfig = {
        baseUrl: 'https://api1.example.com',
        apiKey: 'key1',
      };
      const config2: ExternalApiConfig = {
        baseUrl: 'https://api2.example.com',
        apiKey: 'key2',
      };

      const client1 = ApiFactory.createClient('api1', config1);
      const client2 = ApiFactory.createClient('api2', config2);

      expect(client1).not.toBe(client2);
      expect(ApiFactory.getClient('api1')).toBe(client1);
      expect(ApiFactory.getClient('api2')).toBe(client2);
    });

    it('should ignore config changes on subsequent calls with same name', () => {
      const config1: ExternalApiConfig = {
        baseUrl: 'https://api.example.com',
        apiKey: 'key1',
      };
      const config2: ExternalApiConfig = {
        baseUrl: 'https://different-api.example.com',
        apiKey: 'key2',
      };

      const client1 = ApiFactory.createClient('same-name', config1);
      const client2 = ApiFactory.createClient('same-name', config2);

      // Should return the same instance, ignoring the new config
      expect(client1).toBe(client2);
    });
  });
});
