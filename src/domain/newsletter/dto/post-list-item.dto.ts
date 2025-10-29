export interface PostListItemDto {
  id: string;
  slug: string;
  title: string;
  excerpt?: string | null;
  organization?: string | null;
  category?: string | null;
  author?: string | null;
  type: 'EVENT' | 'NEWS' | 'ANNOUNCEMENT';
  tags: string[];
  publishedAt?: string | null;
}