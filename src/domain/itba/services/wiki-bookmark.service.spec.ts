import { Test, TestingModule } from '@nestjs/testing';
import { WikiBookmarkService } from './wiki-bookmark.service';
import { PrismaService } from '@/shared/database/prisma.service';
import { createMockPrismaService, MockPrismaService } from '../../../../test/utils/prisma-mock.helper';

describe('WikiBookmarkService', () => {
  let service: WikiBookmarkService;
  let prisma: MockPrismaService;

  beforeEach(async () => {
    prisma = createMockPrismaService();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WikiBookmarkService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<WikiBookmarkService>(WikiBookmarkService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getState', () => {
    it('should return count and bookmarked=false when userId not provided', async () => {
      prisma.subjectBookmark.count.mockResolvedValue(5);

      const result = await service.getState('93.42');

      expect(prisma.subjectBookmark.count).toHaveBeenCalledWith({
        where: { subjectId: '93.42' },
      });
      expect(result).toEqual({ count: 5, bookmarked: false });
    });

    it('should return count and bookmarked=true when user has bookmarked', async () => {
      prisma.subjectBookmark.count.mockResolvedValue(10);
      prisma.subjectBookmark.findUnique.mockResolvedValue({
        subjectId: '93.42',
        userId: 'user-1',
      } as any);

      const result = await service.getState('93.42', 'user-1');

      expect(prisma.subjectBookmark.count).toHaveBeenCalledWith({
        where: { subjectId: '93.42' },
      });
      expect(prisma.subjectBookmark.findUnique).toHaveBeenCalledWith({
        where: { subjectId_userId: { subjectId: '93.42', userId: 'user-1' } },
        select: { subjectId: true },
      });
      expect(result).toEqual({ count: 10, bookmarked: true });
    });

    it('should return count and bookmarked=false when user has not bookmarked', async () => {
      prisma.subjectBookmark.count.mockResolvedValue(3);
      prisma.subjectBookmark.findUnique.mockResolvedValue(null);

      const result = await service.getState('93.42', 'user-1');

      expect(result).toEqual({ count: 3, bookmarked: false });
    });

    it('should return count=0 when no bookmarks exist', async () => {
      prisma.subjectBookmark.count.mockResolvedValue(0);

      const result = await service.getState('93.99');

      expect(result).toEqual({ count: 0, bookmarked: false });
    });
  });

  describe('create', () => {
    it('should create bookmark and return updated state', async () => {
      prisma.subjectBookmark.upsert.mockResolvedValue({
        subjectId: '93.42',
        userId: 'user-1',
      } as any);
      prisma.subjectBookmark.count.mockResolvedValue(5);
      prisma.subjectBookmark.findUnique.mockResolvedValue({
        subjectId: '93.42',
        userId: 'user-1',
      } as any);

      const result = await service.create('93.42', 'user-1');

      expect(prisma.subjectBookmark.upsert).toHaveBeenCalledWith({
        where: { subjectId_userId: { subjectId: '93.42', userId: 'user-1' } },
        create: { subjectId: '93.42', userId: 'user-1' },
        update: {},
      });
      expect(result).toEqual({ count: 5, bookmarked: true });
    });

    it('should handle upsert (update) when bookmark already exists', async () => {
      prisma.subjectBookmark.upsert.mockResolvedValue({
        subjectId: '93.42',
        userId: 'user-1',
      } as any);
      prisma.subjectBookmark.count.mockResolvedValue(3);
      prisma.subjectBookmark.findUnique.mockResolvedValue({
        subjectId: '93.42',
        userId: 'user-1',
      } as any);

      const result = await service.create('93.42', 'user-1');

      expect(result).toEqual({ count: 3, bookmarked: true });
    });
  });

  describe('set', () => {
    it('should set bookmark and return updated state', async () => {
      prisma.subjectBookmark.upsert.mockResolvedValue({
        subjectId: '93.50',
        userId: 'user-2',
      } as any);
      prisma.subjectBookmark.count.mockResolvedValue(8);
      prisma.subjectBookmark.findUnique.mockResolvedValue({
        subjectId: '93.50',
        userId: 'user-2',
      } as any);

      const result = await service.set('93.50', 'user-2');

      expect(prisma.subjectBookmark.upsert).toHaveBeenCalledWith({
        where: { subjectId_userId: { subjectId: '93.50', userId: 'user-2' } },
        create: { subjectId: '93.50', userId: 'user-2' },
        update: {},
      });
      expect(result).toEqual({ count: 8, bookmarked: true });
    });
  });

  describe('remove', () => {
    it('should delete bookmark successfully', async () => {
      prisma.subjectBookmark.delete.mockResolvedValue({
        subjectId: '93.42',
        userId: 'user-1',
      } as any);

      await service.remove('93.42', 'user-1');

      expect(prisma.subjectBookmark.delete).toHaveBeenCalledWith({
        where: { subjectId_userId: { subjectId: '93.42', userId: 'user-1' } },
      });
    });

    it('should silently catch errors when bookmark does not exist', async () => {
      prisma.subjectBookmark.delete.mockRejectedValue(new Error('Not found'));

      await expect(service.remove('93.42', 'user-1')).resolves.toBeUndefined();
      expect(prisma.subjectBookmark.delete).toHaveBeenCalled();
    });

    it('should not throw when deleting non-existent bookmark', async () => {
      const error = { code: 'P2025', message: 'Record not found' };
      prisma.subjectBookmark.delete.mockRejectedValue(error);

      await service.remove('93.99', 'user-1');

      // Should not throw
      expect(prisma.subjectBookmark.delete).toHaveBeenCalled();
    });
  });
});
