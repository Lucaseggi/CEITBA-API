import { PrismaService } from "@/shared/database/prisma.service";
import { Injectable } from '@nestjs/common';
import type { PostRepository, ListParams } from '../interfaces/post-repository';
import type { Post } from '../models/post';

const mapToDomain = (p: any): Post => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  excerpt: p.excerpt,
  markdown: p.markdown,
  organization: p.organization,
  category: p.category,
  author: p.author,
  type: p.type,
  publishedAt: p.publishedAt,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
  tags: p.tags.map((t: any) => ({
    id: t.tag.id,
    name: t.tag.name,
    slug: t.tag.slug,
    createdAt: t.tag.createdAt,
  })),
});

const slugify = (s: string) =>
  s.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

@Injectable()
export class PrismaPostRepository implements PostRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Omit<Post, 'id' | 'createdAt' | 'updatedAt'>): Promise<Post> {
    const tagRecords = await Promise.all(
      data.tags.map(async (t) => {
        const s = slugify(t.name);
        const existing = await this.prisma.tag.findUnique({ where: { slug: s } });
        return (
          existing ??
          (await this.prisma.tag.create({
            data: { name: t.name, slug: s },
          }))
        );
      }),
    );

    const created = await this.prisma.post.create({
      data: {
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        markdown: data.markdown,
        organization: data.organization,
        category: data.category,
        author: data.author,
        type: data.type as any,
        publishedAt: data.publishedAt ?? null,
        tags: {
          create: tagRecords.map((t) => ({ tagId: t.id })),
        },
      },
      include: { tags: { include: { tag: true } } },
    });

    return mapToDomain(created);
  }

  async findById(id: string): Promise<Post | null> {
    const p = await this.prisma.post.findUnique({
      where: { id },
      include: { tags: { include: { tag: true } } },
    });
    return p ? mapToDomain(p) : null;
  }

  async findBySlug(slug: string): Promise<Post | null> {
    const p = await this.prisma.post.findUnique({
      where: { slug },
      include: { tags: { include: { tag: true } } },
    });
    return p ? mapToDomain(p) : null;
  }

  async existsSlug(slug: string): Promise<boolean> {
    const p = await this.prisma.post.findUnique({ where: { slug }, select: { id: true } });
    return !!p;
  }

  async list(params: ListParams): Promise<{ items: Post[]; total: number }> {
    const {
      page = 1,
      pageSize = 10,
      query,
      type,
      tag,
      onlyPublished = true,
      orderBy = 'publishedAt:desc',
    } = params;

    const where: any = {};
    if (onlyPublished) where.publishedAt = { not: null };
    if (type) where.type = type;
    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { excerpt: { contains: query, mode: 'insensitive' } },
        { markdown: { contains: query, mode: 'insensitive' } },
      ];
    }
    if (tag) where.tags = { some: { tag: { slug: tag } } };

    const [items, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        include: { tags: { include: { tag: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy:
          orderBy === 'createdAt:desc'
            ? { createdAt: 'desc' }
            : [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.post.count({ where }),
    ]);

    return { items: items.map(mapToDomain), total };
  }
}
