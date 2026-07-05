import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { BlogService } from './blog.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

@ApiTags('Blog')
@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new blog post (slug auto-generated)' })
  @ApiResponse({ status: 201, description: 'Blog post created successfully' })
  create(@Body() dto: CreateBlogDto) {
    return this.blogService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all blog posts' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'published', required: false, type: Boolean })
  findAll(
    @Query('category') category?: string,
    @Query('published') published?: string,
  ) {
    return this.blogService.findAll({ category, published });
  }

  @Get('id/:id')
  @ApiOperation({ summary: 'Get a blog post by ID' })
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.findById(id);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a blog post by slug' })
  @ApiResponse({ status: 404, description: 'Blog post not found' })
  findBySlug(@Param('slug') slug: string) {
    return this.blogService.findBySlug(slug);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a blog post' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBlogDto,
  ) {
    return this.blogService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a blog post' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.blogService.remove(id);
  }
}
