import type { PostType } from '../models/post.ts';

export interface CreatePostDto {
  title: string;
  slug?: string;
  excerpt?: string;
  markdown: string;
  organization?: string;
  category?: string;
  author?: string;
  type: PostType;
  tags?: string[];
  publishedAt?: string;
}