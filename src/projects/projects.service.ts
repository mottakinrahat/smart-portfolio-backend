import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    // Verify category exists
    const category = await this.prisma.projectCategory.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category #${dto.categoryId} not found`);
    }

    return this.prisma.project.create({
      data: dto,
      include: { category: true },
    });
  }

  findAll(query: { categoryId?: string; featured?: string; published?: string }) {
    const where: Record<string, unknown> = {};

    if (query.categoryId) where.categoryId = query.categoryId;
    if (query.featured !== undefined) where.featured = query.featured === 'true';
    if (query.published !== undefined)
      where.published = query.published === 'true';

    return this.prisma.project.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!project) throw new NotFoundException(`Project #${id} not found`);
    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    await this.findOne(id);

    if (dto.categoryId) {
      const category = await this.prisma.projectCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Category #${dto.categoryId} not found`);
      }
    }

    return this.prisma.project.update({
      where: { id },
      data: dto,
      include: { category: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.project.delete({ where: { id } });
    return { message: `Project #${id} deleted successfully` };
  }
}
