import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { BlogModule } from './blog/blog.module';
import { SubscribersModule } from './subscribers/subscribers.module';
import { ChatModule } from './chat/chat.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProjectsModule,
    BlogModule,
    SubscribersModule,
    ChatModule,
    CategoriesModule,
  ],
})
export class AppModule {}
