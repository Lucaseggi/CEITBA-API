import type { PostRepository } from '../interfaces/post-repository';
import type { PostDetailDto } from '../dto/post-detail.dto';

export class GetPostService {
  constructor(private readonly repo: PostRepository) {}

  async byIdOrSlug(idOrSlug: string, onlyPublished = true): Promise<PostDetailDto> {
    const found =
      idOrSlug.includes('-') && !idOrSlug.startsWith('p')
        ? await this.repo.findBySlug(idOrSlug)
        : await this.repo.findById(idOrSlug);

    if (!found || (onlyPublished && !found.publishedAt)) {
      const e: any = new Error('NOT_FOUND');
      e.code = 'NOT_FOUND';
      throw e;
    }

    return {
      ...found,
      tags: found.tags.map((t) => t.name),
      publishedAt: found.publishedAt?.toISOString() ?? null,
      createdAt: found.createdAt.toISOString(),
      updatedAt: found.updatedAt.toISOString(),
    };
  }
}
