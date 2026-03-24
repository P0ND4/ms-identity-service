import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';
import { FoodaException } from './fooda.exception';

@Catch(FoodaException)
export class FoodaExceptionFilter implements ExceptionFilter {
  catch(exception: FoodaException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as {
      code: number;
      message: string;
    };

    (response as any).errorCode = exceptionResponse.code;
    response.status(status).json(exceptionResponse);
  }
}
