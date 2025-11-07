import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export type MockPrismaService = DeepMockProxy<PrismaClient>;

export const createMockPrismaService = (): MockPrismaService => {
  return mockDeep<PrismaClient>();
};

export const resetMockPrismaService = (prisma: MockPrismaService): void => {
  mockReset(prisma);
};
