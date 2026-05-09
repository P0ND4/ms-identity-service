import { SetMetadata } from '@nestjs/common';

/**
 * Decorator that prevents {@link ApiResponseInterceptor} from wrapping the
 * response. Use on controllers consumed by internal microservices that expect
 * a raw JSON body instead of the wrapped `{ success, data, message, ... }`
 * envelope.
 */
export const SKIP_RESPONSE_WRAPPER_KEY = 'skipResponseWrapper';

export const SkipResponseWrapper = () =>
  SetMetadata(SKIP_RESPONSE_WRAPPER_KEY, true);
