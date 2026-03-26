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

  Ex1009: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1009`,
    'Refresh token tiene que ser proporcionado',
  ),

  Ex1010: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1010`,
    'idToken tiene que ser un string',
  ),

  Ex1011: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1011`,
    'idToken no tiene que estar vacío',
  ),

  Ex1012: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1012`,
    'Configuración de Google One Tap incompleta',
  ),

  Ex1013: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1013`,
    'idToken de Google inválido o correo no verificado',
  ),

  Ex1014: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1014`,
    'accessToken de Microsoft tiene que ser un string',
  ),

  Ex1015: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1015`,
    'accessToken de Microsoft no tiene que estar vacío',
  ),

  Ex1016: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1016`,
    'accessToken de Slack tiene que ser un string',
  ),

  Ex1017: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1017`,
    'accessToken de Slack no tiene que estar vacío',
  ),

  Ex1018: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1018`,
    'accessToken de Microsoft inválido o perfil incompleto',
  ),

  Ex1019: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1019`,
    'accessToken de Slack inválido o perfil incompleto',
  ),

  Ex1020: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1020`,
    'Google OAuth redirect esta deshabilitado',
  ),

  Ex1021: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1021`,
    'Microsoft OAuth redirect esta deshabilitado',
  ),

  Ex1022: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1022`,
    'Slack OAuth redirect esta deshabilitado',
  ),

  Ex1023: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1023`,
    'Google token exchange esta deshabilitado',
  ),

  Ex1024: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1024`,
    'Microsoft token exchange esta deshabilitado',
  ),

  Ex1025: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1025`,
    'Slack token exchange esta deshabilitado',
  ),
};
