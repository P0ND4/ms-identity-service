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
  Ex1001: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1001`,
    'El campo fecha es obligatorio.',
  ),
};
