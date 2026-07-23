import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── Global prefix ───────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── CORS ────────────────────────────────────────────────────
  const allowedOrigins = (
    process.env.CORS_ORIGINS ??
    'http://localhost:3000,http://localhost:3001,https://md-mottakin-rahat.vercel.app'
  ).split(',');

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // ── Global Validation Pipe ──────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // ── Global Exception Filter ─────────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());

  // ── Global Response Interceptor ─────────────────────────────
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger Docs ────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rahat Smart Portfolio API')
    .setDescription(
      'REST API for the Smart Portfolio — Projects, Blog, Subscribers, AI Chat, and Admin',
    )
    .setVersion('1.0')
    .addTag('Projects', 'Portfolio project management')
    .addTag('Blog', 'Blog post management')
    .addTag('Subscribers', 'Newsletter subscriber management')
    .addTag('Chat (Ask Rahat)', 'AI-powered chatbot sessions')
    .addTag('Admin', 'Admin audit logs')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
    customSiteTitle: 'Rahat Portfolio API Docs',
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  console.log(`🚀 Server running on: http://localhost:${port}/api/v1`);
  console.log(`📄 Swagger docs at:   http://localhost:${port}/api/v1/docs`);
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap application:', err);
});
