import type { PostRepository } from '../interfaces/post-repository';
import type { PaginatedPostsDto } from '../dto/paginated.dto';

export class ListPostsService {
  constructor(private readonly repo: PostRepository) {}

  async execute(params: {
    page?: number;
    pageSize?: number;
    query?: string;
    type?: 'EVENT' | 'NEWS' | 'ANNOUNCEMENT';
    tag?: string;
  }): Promise<PaginatedPostsDto> {
    const page = Math.max(1, params.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10));

    const { items, total } = await this.repo.list({
      page,
      pageSize,
      query: params.query,
      type: params.type,
      tag: params.tag,
      onlyPublished: true,
      orderBy: 'publishedAt:desc',
    });

    return {
      items: items.map((p) => ({
        id: p.id,
        slug: p.slug,
        title: p.title,
        excerpt: p.excerpt ?? null,
        organization: p.organization ?? null,
        category: p.category ?? null,
        author: p.author ?? null,
        type: p.type,
        tags: p.tags.map((t) => t.name),
        publishedAt: p.publishedAt?.toISOString() ?? null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }
}
