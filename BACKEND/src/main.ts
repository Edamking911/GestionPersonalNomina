import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ResponseInterceptor } from './Interceptor/response.interceptor';
import { AllExceptionsFilter } from './Filtros/all-exceptions.filter';
import * as fs from 'fs';
import * as path from 'path';

async function bootstrap() {
  // =========================================================
  // 🔐 Certificados HTTPS (mkcert)
  // =========================================================
  const httpsOptions = {
    key: fs.readFileSync(path.join(process.cwd(), 'localhost+2-key.pem')),
    cert: fs.readFileSync(path.join(process.cwd(), 'localhost+2.pem')),
  };

  const app = await NestFactory.create(AppModule, { httpsOptions });

  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  const config = new DocumentBuilder()
    .setTitle('Gestión de Nóminas de Personal - API')
    .setDescription('Backend para sistema de gestión de nómina y personal empresarial')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = 3001;
  await app.listen(port, '0.0.0.0');

  const os = await import('os');
  const nets = os.networkInterfaces();
  const ips: string[] = [];

  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        ips.push(net.address);
      }
    }
  }

  console.log('');
  console.log('🔐 ============================================');
  console.log(`🔐  Backend HTTPS:  https://localhost:${port}`);
  console.log(`🔐  Swagger docs:  https://localhost:${port}/api/docs`);
  console.log('');
  console.log('📡  IPs accesibles desde la red local:');
  ips.forEach((ip) => {
    console.log(`      👉 https://${ip}:${port}`);
  });
  console.log('🔐 ============================================');
  console.log('');
}

bootstrap();