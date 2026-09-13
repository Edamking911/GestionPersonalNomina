import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './Interceptor/response.interceptor';
import { AllExceptionsFilter } from './Filtros/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🔑 Interceptor global (formato estándar de respuestas)
  app.useGlobalInterceptors(new ResponseInterceptor());

  // 🔑 Filtro global de excepciones (formato estándar de errores)
  app.useGlobalFilters(new AllExceptionsFilter());

  // 🔑 Pipes de validación
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // 🔑 CORS para el frontend
  app.enableCors({
    origin: [
      'http://localhost:5173',  // Vite
      'http://localhost:3001',  // Alternativo
      'http://localhost:4200',  // Angular
      'http://localhost:8080',  // Vue
      'http://127.0.0.1:5173',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:4200',
      'http://127.0.0.1:8080',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // 🔑 Swagger
  const config = new DocumentBuilder()
    .setTitle('Gestión de Nóminas de Personal - API')
    .setDescription(
      'Backend para sistema de gestión de nómina y personal empresarial',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 🔑 Escuchar en todas las interfaces (útil para acceso desde red local)
  const port = 3000;
  await app.listen(port, '0.0.0.0');

  console.log('');
  console.log('🚀 ============================================');
  console.log(`🚀  Backend corriendo en: http://localhost:${port}`);
  console.log(`🚀  Swagger docs: http://localhost:${port}/api/docs`);
  console.log('🚀 ============================================');
  console.log('');
}

bootstrap();