import {
  Controller, Get, Post, Body, Param, Query,
  HttpCode, HttpStatus, NotFoundException, ConflictException, UnprocessableEntityException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';

import { CreatePostRequestDto } from '../dto/create-post.request.dto';
import { CreatePostService } from '@/domain/newsletter/services/create-post.service';
import { GetPostService } from '@/domain/newsletter/services/get-post.service';
import { ListPostsService } from '@/domain/newsletter/services/list-posts.service';

@ApiTags('Posts')
@Controller('v1/posts')
export class PostsController {
  constructor(
    private readonly createPost: CreatePostService,
    private readonly getPost: GetPostService,
    private readonly listPosts: ListPostsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new post' })
  @ApiBody({ type: CreatePostRequestDto })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 409, description: 'Slug already exists' })
  @ApiResponse({ status: 422, description: 'Validation error' })
  async create(@Body() dto: CreatePostRequestDto) {
    try {
      return await this.createPost.execute(dto);
    } catch (e: any) {
      if (e.code === 'CONFLICT') throw new ConflictException({ error: { code: 'CONFLICT', message: e.message ?? 'Conflicto' } });
      if (e.code === 'VALIDATION_ERROR') throw new UnprocessableEntityException({ error: { code: 'VALIDATION_ERROR', message: 'Datos inválidos' }, fieldErrors: e.fieldErrors });
      throw e;
    }
  }

  @Get(':idOrSlug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get post by id or slug' })
  @ApiParam({ name: 'idOrSlug', description: 'Post ID or slug' })
  @ApiResponse({ status: 200, description: 'Post found' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async findOne(@Param('idOrSlug') idOrSlug: string) {
    try {
      return await this.getPost.byIdOrSlug(idOrSlug, true);
    } catch (e: any) {
      if (e.code === 'NOT_FOUND') throw new NotFoundException({ error: { code: 'NOT_FOUND', message: 'No encontrado' } });
      throw e;
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List posts (paginated)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'pageSize', required: false, example: 10 })
  @ApiQuery({ name: 'q', required: false, description: 'Free text search' })
  @ApiQuery({ name: 'tag', required: false, description: 'Tag slug' })
  @ApiQuery({ name: 'type', required: false, enum: ['EVENT', 'NEWS', 'ANNOUNCEMENT'] })
  @ApiResponse({ status: 200, description: 'Paginated list of posts' })
  async list(
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '10',
    @Query('q') q?: string,
    @Query('tag') tag?: string,
    @Query('type') type?: 'EVENT' | 'NEWS' | 'ANNOUNCEMENT',
  ) {
    return await this.listPosts.execute({
      page: Number(page),
      pageSize: Number(pageSize),
      query: q,
      tag,
      type,
    });
  }
}
