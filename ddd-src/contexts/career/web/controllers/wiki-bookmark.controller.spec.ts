import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { WikiBookmarkController } from './wiki-bookmark.controller';
import { WikiBookmarkService } from '../../application/services/wiki-bookmark.service';

describe('WikiBookmarkController', () => {
  let controller: WikiBookmarkController;
  let service: jest.Mocked<WikiBookmarkService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WikiBookmarkController],
      providers: [
        {
          provide: WikiBookmarkService,
          useValue: {
            getState: jest.fn(),
            create: jest.fn(),
            set: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WikiBookmarkController>(WikiBookmarkController);
    service = module.get<WikiBookmarkService>(WikiBookmarkService) as jest.Mocked<WikiBookmarkService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('should return bookmark state with user ID when authenticated', async () => {
      const mockState = { count: 5, bookmarked: true };
      service.getState.mockResolvedValue(mockState);

      const req = { user: { id: 'user-123' } };
      const result = await controller.get('93.42', req);

      expect(service.getState).toHaveBeenCalledWith('93.42', 'user-123');
      expect(result).toEqual(mockState);
    });

    it('should return bookmark state without user ID when not authenticated', async () => {
      const mockState = { count: 5, bookmarked: false };
      service.getState.mockResolvedValue(mockState);

      const req = { user: undefined };
      const result = await controller.get('93.42', req);

      expect(service.getState).toHaveBeenCalledWith('93.42', undefined);
      expect(result).toEqual(mockState);
    });

    it('should return state with count=0 when no bookmarks exist', async () => {
      const mockState = { count: 0, bookmarked: false };
      service.getState.mockResolvedValue(mockState);

      const req = { user: { id: 'user-123' } };
      const result = await controller.get('93.99', req);

      expect(result).toEqual(mockState);
    });

    it('should handle request with no user property', async () => {
      const mockState = { count: 3, bookmarked: false };
      service.getState.mockResolvedValue(mockState);

      const req = {};
      const result = await controller.get('93.42', req);

      expect(service.getState).toHaveBeenCalledWith('93.42', undefined);
      expect(result).toEqual(mockState);
    });
  });

  describe('create', () => {
    it('should create bookmark and return updated state when authenticated', async () => {
      const mockState = { count: 6, bookmarked: true };
      service.create.mockResolvedValue(mockState);

      const req = { user: { id: 'user-123' } };
      const result = await controller.create('93.42', req);

      expect(service.create).toHaveBeenCalledWith('93.42', 'user-123');
      expect(result).toEqual(mockState);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const req = { user: undefined };

      await expect(controller.create('93.42', req)).rejects.toThrow(UnauthorizedException);
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user ID is missing', async () => {
      const req = { user: { id: undefined } };

      await expect(controller.create('93.42', req)).rejects.toThrow(UnauthorizedException);
      expect(service.create).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when request has no user property', async () => {
      const req = {};

      await expect(controller.create('93.42', req)).rejects.toThrow(UnauthorizedException);
      expect(service.create).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should set bookmark and return updated state when authenticated', async () => {
      const mockState = { count: 7, bookmarked: true };
      service.set.mockResolvedValue(mockState);

      const req = { user: { id: 'user-123' } };
      const result = await controller.set('93.42', req);

      expect(service.set).toHaveBeenCalledWith('93.42', 'user-123');
      expect(result).toEqual(mockState);
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const req = { user: undefined };

      await expect(controller.set('93.42', req)).rejects.toThrow(UnauthorizedException);
      expect(service.set).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user ID is missing', async () => {
      const req = { user: { id: undefined } };

      await expect(controller.set('93.42', req)).rejects.toThrow(UnauthorizedException);
      expect(service.set).not.toHaveBeenCalled();
    });

    it('should be idempotent (calling multiple times should work)', async () => {
      const mockState = { count: 8, bookmarked: true };
      service.set.mockResolvedValue(mockState);

      const req = { user: { id: 'user-123' } };

      const result1 = await controller.set('93.42', req);
      const result2 = await controller.set('93.42', req);

      expect(service.set).toHaveBeenCalledTimes(2);
      expect(result1).toEqual(mockState);
      expect(result2).toEqual(mockState);
    });
  });

  describe('remove', () => {
    it('should remove bookmark when authenticated', async () => {
      service.remove.mockResolvedValue(undefined);

      const req = { user: { id: 'user-123' } };
      const result = await controller.remove('93.42', req);

      expect(service.remove).toHaveBeenCalledWith('93.42', 'user-123');
      expect(result).toBeUndefined();
    });

    it('should throw UnauthorizedException when user is not authenticated', async () => {
      const req = { user: undefined };

      await expect(controller.remove('93.42', req)).rejects.toThrow(UnauthorizedException);
      expect(service.remove).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when user ID is missing', async () => {
      const req = { user: { id: undefined } };

      await expect(controller.remove('93.42', req)).rejects.toThrow(UnauthorizedException);
      expect(service.remove).not.toHaveBeenCalled();
    });

    it('should handle removing non-existent bookmark gracefully', async () => {
      service.remove.mockResolvedValue(undefined);

      const req = { user: { id: 'user-123' } };
      await controller.remove('93.99', req);

      expect(service.remove).toHaveBeenCalledWith('93.99', 'user-123');
    });

    it('should return undefined (HTTP 204 No Content)', async () => {
      service.remove.mockResolvedValue(undefined);

      const req = { user: { id: 'user-123' } };
      const result = await controller.remove('93.42', req);

      expect(result).toBeUndefined();
    });
  });
});
