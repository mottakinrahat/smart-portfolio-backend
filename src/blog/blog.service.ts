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

    return this.prisma.blogPost.create({
      data: { ...dto, slug },
    });
  }

  findAll(query: { published?: string }) {
    const where: Record<string, unknown> = {};
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

  async findById(id: string) {
    const post = await this.prisma.blogPost.findUnique({ where: { id } });
    if (!post) throw new NotFoundException(`Blog post #${id} not found`);
    return post;
  }

  async update(id: string, dto: UpdateBlogDto) {
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

    return this.prisma.blogPost.update({
      where: { id },
      data: { ...dto, ...extra },
    });
  }

  async remove(id: string) {
    await this.prisma.blogPost.delete({ where: { id } });
    return { message: `Blog post #${id} deleted successfully` };
  }
}
