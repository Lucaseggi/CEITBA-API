import type { PostRepository } from '../interfaces/post-repository';
import type { PostDetailDto } from '../dto/post-detail.dto';

export class GetPostService {
  constructor(private readonly repo: PostRepository) {}

   async bySlug(slug: string): Promise<PostDetailDto> {
    const found = await this.repo.findBySlug(slug);

    if (!found) {
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
