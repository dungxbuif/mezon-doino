import {
  BadRequestException,
  ClassSerializerInterceptor,
  INestApplication,
  ValidationPipe,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { HttpExceptionFilter } from '@src/common/filters/http-exception.filter';
import { TransformInterceptor } from '@src/common/interceptors/transform.interceptor';
import loggingMiddleware from '@src/common/middlewares/logger.middleware';
import compression from 'compression';
import * as httpContext from 'express-http-context';
import helmet from 'helmet';
import morgan from 'morgan';
import { swaggerConfig } from './swagger.config';

export default async function bootstrapConfig(app: INestApplication) {
  // only if you're behind a reverse proxy (Heroku, Bluemix, AWS ELB, Nginx, etc)
  //   app.enable('trust proxy');
  app.use(httpContext.middleware);
  app.use(loggingMiddleware);
  app.use(helmet());
  app.use(compression());
  app.use(morgan('combined'));
  app.enableVersioning();
  await swaggerConfig(app);
  const reflector = app.get(Reflector);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      skipMissingProperties: true,
      exceptionFactory: (validationErrors = []) => {
        const errors = validationErrors.map((error) => ({
          property: error.property,
          constraints: error.constraints,
        }));
        return new BadRequestException(errors);
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new TransformInterceptor(),
  );
}
