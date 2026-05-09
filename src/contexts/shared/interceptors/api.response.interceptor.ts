import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../api.response';
import { SKIP_RESPONSE_WRAPPER_KEY } from '../decorators/skip-response-wrapper.decorator';

@Injectable()
export class ApiResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T> | T
> {
  constructor(private readonly reflector: Reflector) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T> | T> {
    // Skips wrapping when the class or handler is decorated with
    // @SkipResponseWrapper() — e.g. internal microservice endpoints
    // consumed by the Gateway.
    const skip = this.reflector.getAllAndOverride<boolean>(
      SKIP_RESPONSE_WRAPPER_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (skip) {
      return next.handle();
    }

    return next.handle().pipe(
      map((data) => {
        const res: any = context.switchToHttp().getResponse();
        const statusCode: number = res?.statusCode ?? 200;
        const statusMessage: string | undefined = res?.statusMessage;
        const defaultMessage =
          statusCode >= 200 && statusCode < 300
            ? 'Request successful'
            : 'Request failed';

        return {
          success: true,
          data,
          message: statusMessage || defaultMessage,
          statusCode,
        };
      }),
    );
  }
}
