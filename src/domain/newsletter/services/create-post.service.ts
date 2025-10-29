import type { CreatePostDto } from '../dto/create-post.dto';
import type { PostDetailDto } from '../dto/post-detail.dto';
import type { PostRepository } from '../interfaces/post-repository';

const slugify = (s: string) =>
  s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

export class CreatePostService {
  constructor(private readonly repo: PostRepository) {}

  async execute(input: CreatePostDto): Promise<PostDetailDto> {
    if (!input.title || !input.markdown) {
      const e: any = new Error('VALIDATION_ERROR');
      e.code = 'VALIDATION_ERROR';
      e.fieldErrors = {
        ...(input.title ? {} : { title: 'Requerido' }),
        ...(input.markdown ? {} : { markdown: 'Requerido' }),
      };
      throw e;
    }

    const slug = input.slug?.trim() || slugify(input.title);
    if (await this.repo.existsSlug(slug)) {
      const e: any = new Error('CONFLICT');
      e.code = 'CONFLICT';
      e.message = 'El slug ya existe';
      throw e;
    }

    const tags = (input.tags ?? []).map((name) => ({ id: '', name, slug: '', createdAt: new Date() }));

    const created = await this.repo.create({
    slug,
    title: input.title,
    excerpt: input.excerpt ?? null,
    markdown: input.markdown,
    organization: input.organization ?? null,
    category: input.category ?? null,
    author: input.author ?? null,
    type: input.type,
    publishedAt: input.publishedAt ? new Date(input.publishedAt) : null,
    tags: (input.tags ?? []).map((name) => ({
        id: '' as any,
        name,
        slug: '' as any,
        createdAt: new Date(),
    })),
    });
    return {
      ...created,
      tags: created.tags.map((t) => t.name),
      publishedAt: created.publishedAt?.toISOString() ?? null,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }
}
