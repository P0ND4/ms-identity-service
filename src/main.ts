import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { API } from './app/routes/route.constants';
import { CustomValidationPipe } from './contexts/shared/domain/exceptions/custom-validation.pipe';
import { FoodaExceptionFilter } from './contexts/shared/domain/exceptions/fooda-exception.filter';
import { ApiResponseInterceptor } from './contexts/shared/interceptors/api.response.interceptor';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import environment from './config/environment.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  if ((await environment()).NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Identity Service')
      .setDescription('Microservice Identity Service')
      .setVersion('1.0')
      .addTag('identity')
      .build();

    const documentFactory = () => SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, documentFactory());
  }

  app.use((req: any, res: any, next: any) => {
    const logger = new Logger('HTTP');
    const { method, originalUrl } = req;
    const CYAN = '\x1b[36m';
    const RESET = '\x1b[0m';

    res.on('finish', () => {
      const errorCode = res.errorCode
        ? ` - ${CYAN}${res.errorCode}${RESET}`
        : '';
      logger.verbose(
        `${method} ${originalUrl} - ${res.statusCode}${errorCode}`,
      );
    });

    next();
  });

  app.useGlobalPipes(new CustomValidationPipe());
  app.useGlobalFilters(new FoodaExceptionFilter());
  app.useGlobalInterceptors(new ApiResponseInterceptor());
  app.setGlobalPrefix(API);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.log(err);
  process.exit(1);
});
