import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = slugify(dto.name);

    const existingName = await this.prisma.projectCategory.findUnique({
      where: { name: dto.name },
    });
    if (existingName) {
      throw new ConflictException(`Category "${dto.name}" already exists`);
    }

    const existingSlug = await this.prisma.projectCategory.findUnique({
      where: { slug },
    });
    if (existingSlug) {
      throw new ConflictException(`Category slug "${slug}" already exists`);
    }

    return this.prisma.projectCategory.create({
      data: {
        name: dto.name,
        slug,
      },
    });
  }

  findAll() {
    return this.prisma.projectCategory.findMany({
      include: {
        _count: {
          select: { projects: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.projectCategory.findUnique({
      where: { id },
      include: { projects: true },
    });
    if (!category) throw new NotFoundException(`Category #${id} not found`);
    return category;
  }

  async remove(id: string) {
    const category = await this.findOne(id);
    
    if (category.projects.length > 0) {
      throw new ConflictException(
        `Cannot delete category because it has ${category.projects.length} associated projects`,
      );
    }

    await this.prisma.projectCategory.delete({ where: { id } });
    return { message: `Category "${category.name}" deleted successfully` };
  }
}
