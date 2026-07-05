import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProjectDto) {
    const project = await this.prisma.project.create({ data: dto });

    await this.prisma.adminLog.create({
      data: {
        action: 'created_project',
        detail: `Project "${project.title}" created (id=${project.id})`,
      },
    });

    return project;
  }

  findAll(query: { category?: string; featured?: string; published?: string }) {
    const where: Record<string, unknown> = {};

    if (query.category) where.category = query.category;
    if (query.featured !== undefined) where.featured = query.featured === 'true';
    if (query.published !== undefined)
      where.published = query.published === 'true';

    return this.prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project #${id} not found`);
    return project;
  }

  async update(id: number, dto: UpdateProjectDto) {
    await this.findOne(id);

    const project = await this.prisma.project.update({
      where: { id },
      data: dto,
    });

    await this.prisma.adminLog.create({
      data: {
        action: 'updated_project',
        detail: `Project "${project.title}" updated (id=${project.id})`,
      },
    });

    return project;
  }

  async remove(id: number) {
    const project = await this.findOne(id);

    await this.prisma.project.delete({ where: { id } });

    await this.prisma.adminLog.create({
      data: {
        action: 'deleted_project',
        detail: `Project "${project.title}" deleted (id=${id})`,
      },
    });

    return { message: `Project #${id} deleted successfully` };
  }
}
