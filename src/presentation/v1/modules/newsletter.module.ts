import { Module } from '@nestjs/common';
import { PostsController } from '../controllers/posts.controller';
import { PrismaService } from '@/shared/database/prisma.service';

import { PrismaPostRepository } from '@/domain/newsletter/repository/prisma-post.repository';
import { POST_REPOSITORY } from '@/domain/newsletter/interfaces/tokens';

import { CreatePostService } from '@/domain/newsletter/services/create-post.service';
import { GetPostService } from '@/domain/newsletter/services/get-post.service';
import { ListPostsService } from '@/domain/newsletter/services/list-posts.service';

@Module({
  controllers: [PostsController],
  providers: [
    PrismaService,
    { provide: POST_REPOSITORY, useClass: PrismaPostRepository },


    {
      provide: CreatePostService,
      useFactory: (repo: PrismaPostRepository) => new CreatePostService(repo),
      inject: [POST_REPOSITORY],
    },
    {
      provide: GetPostService,
      useFactory: (repo: PrismaPostRepository) => new GetPostService(repo),
      inject: [POST_REPOSITORY],
    },
    {
      provide: ListPostsService,
      useFactory: (repo: PrismaPostRepository) => new ListPostsService(repo),
      inject: [POST_REPOSITORY],
    },
  ],
})
export class NewsletterModule {}
