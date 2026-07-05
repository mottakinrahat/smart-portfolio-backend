import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubscriberDto } from './dto/create-subscriber.dto';

@Injectable()
export class SubscribersService {
  constructor(private readonly prisma: PrismaService) {}

  async subscribe(dto: CreateSubscriberDto) {
    const existing = await this.prisma.subscriber.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Email "${dto.email}" is already subscribed.`,
      );
    }

    const subscriber = await this.prisma.subscriber.create({ data: dto });

    await this.prisma.adminLog.create({
      data: {
        action: 'new_subscriber',
        detail: `${dto.email} subscribed to the newsletter`,
      },
    });

    return subscriber;
  }

  findAll() {
    return this.prisma.subscriber.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(id: number) {
    const subscriber = await this.prisma.subscriber.findUnique({
      where: { id },
    });

    if (!subscriber) {
      throw new NotFoundException(`Subscriber #${id} not found`);
    }

    await this.prisma.subscriber.delete({ where: { id } });

    await this.prisma.adminLog.create({
      data: {
        action: 'removed_subscriber',
        detail: `${subscriber.email} unsubscribed`,
      },
    });

    return { message: `Subscriber #${id} removed successfully` };
  }
}
