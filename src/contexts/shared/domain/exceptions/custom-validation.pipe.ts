import {
  BadRequestException,
  Injectable,
  ValidationPipe,
} from '@nestjs/common';
import { FoodaException } from './fooda.exception';
import {
  FoodaExceptionCodes,
  FoodaExceptionInfo,
} from './fooda-exception.codes';

@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      transform: true,
      whitelist: true,
      exceptionFactory: (errors) => {
        let errorKey: string | undefined;

        // Intenta encontrar la primera clave de error de validación (que debería ser nuestra clave 'ExXXXX')
        if (errors.length > 0) {
          const firstError = errors[0];
          if (firstError.constraints) {
            const constraintKeys = Object.keys(firstError.constraints);
            if (constraintKeys.length > 0) {
              errorKey = firstError.constraints[constraintKeys[0]]; // Esto debería ser 'ExXXXX'
            }
          }
          // Si no hay restricciones directas, verifica los hijos (para DTOs anidados, aunque no directamente aplicable aquí)
          if (
            !errorKey &&
            firstError.children &&
            firstError.children.length > 0
          ) {
            const childError = firstError.children[0];
            if (childError.constraints) {
              const childConstraintKeys = Object.keys(childError.constraints);
              if (childConstraintKeys.length > 0) {
                errorKey = childError.constraints[childConstraintKeys[0]];
              }
            }
          }
        }

        let errorInfo: FoodaExceptionInfo;

        // Si encontramos una clave y existe en FoodaExceptionCodes, la usamos
        if (
          errorKey &&
          FoodaExceptionCodes[errorKey as keyof typeof FoodaExceptionCodes]
        ) {
          // Es un DTO nuevo, lanzamos la excepción personalizada
          errorInfo =
            FoodaExceptionCodes[errorKey as keyof typeof FoodaExceptionCodes];
          return new FoodaException(errorInfo, 400);
        } else {
          // Es un DTO antiguo o un error inesperado.
          // Devolvemos la excepción estándar de NestJS para no romper otros módulos.
          const originalMessages = errors.flatMap((error) =>
            Object.values(error.constraints || {}),
          );
          return new BadRequestException(originalMessages);
        }
      },
    });
  }
}
