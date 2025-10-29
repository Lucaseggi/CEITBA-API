import type { Post } from '../models/post';

export interface ListParams {
  page: number;
  pageSize: number;
  query?: string;
  type?: 'EVENT' | 'NEWS' | 'ANNOUNCEMENT';
  tag?: string;
  onlyPublished?: boolean;
  orderBy?: 'publishedAt:desc' | 'createdAt:desc';
}

export interface PostRepository {
  create(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findBySlug(slug: string): Promise<Post | null>;
  existsSlug(slug: string): Promise<boolean>;
  list(params: ListParams): Promise<{ items: Post[]; total: number }>;
}