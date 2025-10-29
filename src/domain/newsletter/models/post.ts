import type { Tag } from './tag.js';

export type PostType = 'EVENT' | 'NEWS' | 'ANNOUNCEMENT';

export interface Post {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  markdown: string;
  organization?: string | null;
  category?: string | null;
  author?: string | null;
  type: PostType;
  publishedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  tags: Tag[];
}