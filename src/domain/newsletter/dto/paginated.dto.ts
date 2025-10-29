import type { PostListItemDto } from './post-list-item.dto';

export interface PaginatedPostsDto {
  items: PostListItemDto[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
