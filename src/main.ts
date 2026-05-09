import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { API } from './app/routes/route.constants';
import { CustomValidationPipe } from './contexts/shared/domain/exceptions/custom-validation.pipe';
import { FoodaExceptionFilter } from './contexts/shared/domain/exceptions/identity-exception.filter';
import { ApiResponseInterceptor } from './contexts/shared/interceptors/api.response.interceptor';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { DataSource } from 'typeorm';
import { SchemaResolver } from './contexts/shared/infrastructure/tenant/schema-resolver.service';
import { TenantMiddleware } from './contexts/shared/infrastructure/tenant/tenant-middleware';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const dataSource = app.get(DataSource);
  const schemaResolver = new SchemaResolver(dataSource);
  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const port = configService.get<number>('PORT') ?? 3000;

  app.setGlobalPrefix(API);

  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Identity Service')
      .setDescription('Microservice Identity Service')
      .setVersion('1.0')
      .addServer('/api')
      .build();

    const documentFactory = () =>
      SwaggerModule.createDocument(app, config, {
        ignoreGlobalPrefix: true,
      });
    SwaggerModule.setup('api', app, documentFactory());
  }

  // HTTP logger must be first so ALL requests are logged
  app.use((req: any, res: any, next: any) => {
    const logger = new Logger('HTTP');
    const { method, originalUrl } = req;
    const CYAN = '\x1b[36m';
    const RESET = '\x1b[0m';

    res.on('finish', () => {
      const errorCode = res.errorCode
        ? ` - ${CYAN}${res.errorCode}${RESET}`
        : '';
      logger.log(`${method} ${originalUrl} - ${res.statusCode}${errorCode}`);
    });

    next();
  });

  app.use((req: any, res: any, next: any) => {
    const middleware = new TenantMiddleware();
    middleware.use(req, res, next);
  });

  const provisioningLogger = new Logger('TenantProvisioning');

  app.use(async (req: any, res: any, next: any) => {
    const tenantId = req.tenantId;

    if (tenantId && tenantId !== 'system') {
      try {
        await schemaResolver.ensureSchema(tenantId);
      } catch (error) {
        provisioningLogger.error(
          `Failed to provision schema for tenant "${tenantId}": ${(error as Error).message}`,
          (error as Error).stack,
        );
      }
    }

    next();
  });

  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new FoodaExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor(app.get(Reflector)));

  await app.listen(port);
}

bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
