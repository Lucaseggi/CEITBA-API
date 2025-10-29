export interface PostDetailDto {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  markdown: string;
  organization?: string | null;
  category?: string | null;
  author?: string | null;
  type: 'EVENT' | 'NEWS' | 'ANNOUNCEMENT';
  tags: string[];
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}
