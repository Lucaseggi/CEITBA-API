import { FetchApiClient } from './fetch-api-client';
import { ExternalApiConfig } from './api-client.interface';

describe('FetchApiClient', () => {
  let client: FetchApiClient;
  let mockFetch: jest.Mock;
  const baseConfig: ExternalApiConfig = {
    baseUrl: 'https://api.example.com',
    apiKey: 'test-api-key',
    timeout: 5000,
    defaultHeaders: {
      'X-Custom-Header': 'custom-value',
    },
  };

  beforeEach(() => {
    mockFetch = jest.fn();
    global.fetch = mockFetch;
    client = new FetchApiClient(baseConfig);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should make GET request with correct URL and headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'X-Custom-Header': 'custom-value',
          }),
        })
      );
      expect(result.data).toEqual({ data: 'test' });
      expect(result.error).toBeNull();
      expect(result.status).toBe(200);
    });

    it('should handle query parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/test', {
        params: { foo: 'bar', baz: 123 },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test?foo=bar&baz=123',
        expect.any(Object)
      );
    });

    it('should skip null and undefined query parameters', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/test', {
        params: { foo: 'bar', baz: null, qux: undefined },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test?foo=bar',
        expect.any(Object)
      );
    });

    it('should handle absolute URLs', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ data: 'test' }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('https://other-api.com/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://other-api.com/test',
        expect.any(Object)
      );
    });
  });

  describe('post', () => {
    it('should make POST request with body', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ id: 1 }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const postData = { name: 'test' };
      const result = await client.post('/test', postData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(postData),
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result.data).toEqual({ id: 1 });
      expect(result.status).toBe(201);
    });

    it('should handle string body', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ success: true }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.post('/test', 'raw string data');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          body: 'raw string data',
        })
      );
    });
  });

  describe('put', () => {
    it('should make PUT request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ updated: true }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const putData = { name: 'updated' };
      await client.put('/test/1', putData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test/1',
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(putData),
        })
      );
    });
  });

  describe('delete', () => {
    it('should make DELETE request', async () => {
      const mockResponse = {
        ok: true,
        status: 204,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.delete('/test/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test/1',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('patch', () => {
    it('should make PATCH request', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({ patched: true }),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const patchData = { field: 'value' };
      await client.patch('/test/1', patchData);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.example.com/test/1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify(patchData),
        })
      );
    });
  });

  describe('response parsing', () => {
    it('should parse JSON response', async () => {
      const jsonData = { message: 'success' };
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue(jsonData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result.data).toEqual(jsonData);
    });

    it('should parse text response', async () => {
      const textData = 'plain text response';
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'text/plain' }),
        text: jest.fn().mockResolvedValue(textData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result.data).toBe(textData);
    });

    it('should parse blob response for other content types', async () => {
      const blobData = new Blob(['binary data']);
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/octet-stream' }),
        blob: jest.fn().mockResolvedValue(blobData),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result.data).toBe(blobData);
    });
  });

  describe('error handling', () => {
    it('should handle HTTP errors', async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: new Headers(),
      };
      mockFetch.mockResolvedValue(mockResponse);

      const result = await client.get('/test');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'HTTP_ERROR',
        message: 'HTTP 404: Not Found',
        details: expect.any(Error),
      });
      expect(result.status).toBe(0);
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network request failed');
      mockFetch.mockRejectedValue(networkError);

      const result = await client.get('/test');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'NETWORK_ERROR',
        message: 'Network request failed',
        details: networkError,
      });
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Timeout');
      timeoutError.name = 'AbortError';
      mockFetch.mockRejectedValue(timeoutError);

      const result = await client.get('/test');

      expect(result.data).toBeNull();
      expect(result.error).toEqual({
        code: 'TIMEOUT',
        message: 'Request timeout',
        details: timeoutError,
      });
    });
  });

  describe('headers', () => {
    it('should merge default headers with request headers', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/test', {
        headers: { 'X-Request-Id': '123' },
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
            'X-Request-Id': '123',
            'Authorization': 'Bearer test-api-key',
          }),
        })
      );
    });

    it('should not add Authorization header if apiKey is not provided', async () => {
      const clientWithoutKey = new FetchApiClient({
        baseUrl: 'https://api.example.com',
      });

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await clientWithoutKey.get('/test');

      const callHeaders = mockFetch.mock.calls[0][1].headers;
      expect(callHeaders['Authorization']).toBeUndefined();
    });
  });

  describe('timeout', () => {
    it('should use config timeout by default', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/test');

      const signal = mockFetch.mock.calls[0][1].signal;
      expect(signal).toBeInstanceOf(AbortSignal);
    });

    it('should use request-specific timeout when provided', async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.get('/test', { timeout: 10000 });

      const signal = mockFetch.mock.calls[0][1].signal;
      expect(signal).toBeInstanceOf(AbortSignal);
    });

    it('should not set timeout signal if timeout is not configured', async () => {
      const clientWithoutTimeout = new FetchApiClient({
        baseUrl: 'https://api.example.com',
      });

      const mockResponse = {
        ok: true,
        status: 200,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await clientWithoutTimeout.get('/test');

      const signal = mockFetch.mock.calls[0][1].signal;
      expect(signal).toBeUndefined();
    });
  });

  describe('content-type header', () => {
    it('should set Content-Type to application/json for object bodies', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.post('/test', { data: 'value' });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('should not override existing Content-Type header', async () => {
      const mockResponse = {
        ok: true,
        status: 201,
        headers: new Headers({ 'Content-Type': 'application/json' }),
        json: jest.fn().mockResolvedValue({}),
      };
      mockFetch.mockResolvedValue(mockResponse);

      await client.post('/test', { data: 'value' }, {
        headers: { 'Content-Type': 'application/xml' },
      });

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers['Content-Type']).toBe('application/xml');
    });
  });
});
