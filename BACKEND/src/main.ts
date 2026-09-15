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

  // =========================================================
  // 🔓 CORS — Acepta LAN, móvil, y cualquier origen en dev
  // =========================================================
  // En desarrollo permitimos cualquier origen (incluye IP del móvil,
  // IP de tu PC en la red local, Docker, WSL, etc.)
  //
  // ⚠️ EN PRODUCCIÓN: reemplaza `origin: true` por una lista
  //    explícita de dominios permitidos
  // =========================================================
  app.enableCors({
    origin: (origin, callback) => {
      // Permitir requests sin origin (Postman, curl, etc.)
      if (!origin) return callback(null, true);

      // 📋 Lista de orígenes comunes de desarrollo
      const allowedOrigins = [
        'http://localhost:5173',
        'http://localhost:3001',
        'http://localhost:4200',
        'http://localhost:8080',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3001',
        'http://127.0.0.1:4200',
        'http://127.0.0.1:8080',
      ];

      // ✅ Permitir cualquier localhost/127.0.0.1
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // ✅ Permitir IPs privadas de red local (LAN)
      //    192.168.x.x, 10.x.x.x, 172.16-31.x.x, 172.18.x.x
      const isLocalNetwork =
        /^http:\/\/(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+):\d+$/.test(
          origin,
        );

      if (isLocalNetwork) {
        return callback(null, true);
      }

      // 🚫 Bloquear cualquier otro origen
      console.warn(`🚫 CORS bloqueado para: ${origin}`);
      return callback(new Error('Not allowed by CORS'), false);
    },
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

  // 📡 Mostrar todas las IPs disponibles al arrancar
  const os = await import('os');
  const nets = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      // Filtrar IPv4, no internos
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  console.log('');
  console.log('🚀 ============================================');
  console.log(`🚀  Backend corriendo en: http://localhost:${port}`);
  console.log(`🚀  Swagger docs: http://localhost:${port}/api/docs`);
  console.log('');
  console.log('📡  IPs accesibles desde la red local:');
  ips.forEach((ip) => {
    console.log(`      👉 http://${ip}:${port}`);
  });
  console.log('🚀 ============================================');
  console.log('');
}

bootstrap();