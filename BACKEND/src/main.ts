import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './Interceptor/response.interceptor';
import { AllExceptionsFilter } from './Filtros/all-exceptions.filter';
import * as fs from 'fs';   // 👈 NUEVO
import * as path from 'path';

async function bootstrap() {
  // =========================================================
  // 🔒 Cargar certificados HTTPS (mkcert)
  // =========================================================
  // Los archivos .pem deben estar en la RAÍZ del backend
  // (donde está package.json)
  // =========================================================
  const httpsOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), 'localhost+2.pem')),
  };

  // 🔑 Crear app con HTTPS
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });

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

<<<<<<< Updated upstream
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
=======
  // =========================================================
  // 🔓 CORS — Acepta HTTP + HTTPS + LAN + localhost
  // =========================================================
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      // 📋 Lista de orígenes comunes de desarrollo
      const allowedOrigins = [
        'http://localhost:5173',
        'https://localhost:5173',
        'http://localhost:3001',
        'https://localhost:3001',
        'http://localhost:4200',
        'https://localhost:4200',
        'http://localhost:8080',
        'https://localhost:8080',
        'http://127.0.0.1:5173',
        'https://127.0.0.1:5173',
        'http://127.0.0.1:3001',
        'https://127.0.0.1:3001',
        'http://127.0.0.1:4200',
        'https://127.0.0.1:4200',
        'http://127.0.0.1:8080',
        'https://127.0.0.1:8080',
      ];

      // ✅ Permitir cualquier localhost/127.0.0.1 (HTTP o HTTPS)
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // ✅ Permitir IPs privadas de red local (LAN)
      //    192.168.x.x, 10.x.x.x, 172.16-31.x.x, 172.18.x.x
      //    Acepta HTTP **y** HTTPS
      const isLocalNetwork =
        /^https?:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+$/.test(
          origin,
        );

      if (isLocalNetwork) {
        return callback(null, true);
      }

      // 🚫 Bloquear cualquier otro origen
      console.warn(`🚫 CORS bloqueado para: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
>>>>>>> Stashed changes
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

  // 🔑 Escuchar en todas las interfaces
  const port = 3000;
  await app.listen(port, '0.0.0.0');

  console.log('');
<<<<<<< Updated upstream
  console.log('🚀 ============================================');
  console.log(`🚀  Backend corriendo en: http://localhost:${port}`);
  console.log(`🚀  Swagger docs: http://localhost:${port}/api/docs`);
  console.log('🚀 ============================================');
=======
  console.log('🔒 ============================================');
  console.log(`🔒  Backend HTTPS en: https://localhost:${port}`);
  console.log(`🔒  Swagger docs: https://localhost:${port}/api/docs`);
  console.log('');
  console.log('📡  IPs accesibles desde la red local (HTTPS):');
  ips.forEach((ip) => {
    console.log(`      👉 https://${ip}:${port}`);
  });
  console.log('🔒 ============================================');
>>>>>>> Stashed changes
  console.log('');
}

bootstrap();