import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateBlogDto) {
    const baseSlug = slugify(dto.title);

    // Ensure unique slug by appending a timestamp suffix if needed
    const existing = await this.prisma.blogPost.findUnique({
      where: { slug: baseSlug },
    });
    const slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;

    const post = await this.prisma.blogPost.create({
      data: { ...dto, slug },
    });

    await this.prisma.adminLog.create({
      data: {
        action: 'created_blog',
        detail: `Blog post "${post.title}" created (id=${post.id})`,
      },
    });

    return post;
  }

  findAll(query: { category?: string; published?: string }) {
    const where: Record<string, unknown> = {};
    if (query.category) where.category = query.category;
    if (query.published !== undefined)
      where.published = query.published === 'true';

    return this.prisma.blogPost.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { slug } });
    if (!post) throw new NotFoundException(`Blog post "${slug}" not found`);
    return post;
  }

  async findById(id: number) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Blog post #${id} not found`);
    return post;
  }

  async update(id: number, dto: UpdateBlogDto) {
    await this.findById(id);

    // Re-generate slug if title changed
    const extra: { slug?: string } = {};
    if (dto.title) {
      const baseSlug = slugify(dto.title);
      const existing = await this.prisma.blogPost.findFirst({
        where: { slug: baseSlug, NOT: { id } },
      });
      extra.slug = existing ? `${baseSlug}-${Date.now()}` : baseSlug;
    }

    const post = await this.prisma.blogPost.update({
      where: { id },
      data: { ...dto, ...extra },
    });

    await this.prisma.adminLog.create({
      data: {
        action: 'updated_blog',
        detail: `Blog post "${post.title}" updated (id=${post.id})`,
      },
    });

    return post;
  }

  async remove(id: number) {
    const post = await this.findById(id);
    await this.prisma.blogPost.delete({ where: { id } });

    await this.prisma.adminLog.create({
      data: {
        action: 'deleted_blog',
        detail: `Blog post "${post.title}" deleted (id=${id})`,
      },
    });

    return { message: `Blog post #${id} deleted successfully` };
  }
}
