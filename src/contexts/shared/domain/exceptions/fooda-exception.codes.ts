export class FoodaExceptionInfo {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly service: string = 'identity-service',
  ) {}
}

const SERVICE_PREFIX = 'ID';

export const FoodaExceptionCodes = {
  // Error Generico
  Ex0000: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-0000`,
    'Ha ocurrido un error desconocido en la solicitud.',
  ),
  // Errores Generales (9000+)
  Ex9999: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-9999`,
    'Error interno del servidor.',
  ),

  // Errores de Validación (1000-1999)
  Ex1000: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1000`,
    'El formato del correo es inválido',
  ),

  Ex1001: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1001`,
    'La contraseña es obligatoria',
  ),

  Ex1002: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1002`,
    'La contraseña debe tener al menos 6 caracteres',
  ),

  Ex1003: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1003`,
    'Credenciales inválidas',
  ),

  Ex1004: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1004`,
    'Contraseña incorrecta',
  ),

  Ex1005: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1005`,
    'Formato de refresh token inválido',
  ),

  Ex1006: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1006`,
    'Refresh token inválido o expirado',
  ),

  Ex1007: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1007`,
    'Refresh token inválido',
  ),

  Ex1008: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1008`,
    'Usuario no encontrado',
  ),
};
