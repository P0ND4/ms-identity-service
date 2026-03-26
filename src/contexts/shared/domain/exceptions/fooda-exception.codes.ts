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

  Ex1026: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1026`,
    'children contiene nodos de permisos invalidos',
  ),

  Ex1027: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1027`,
    'permissions contiene nodos de permisos invalidos',
  ),

  Ex1028: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1028`,
    'permissionKeys no puede contener valores duplicados',
  ),

  Ex1029: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1029`,
    'roleKeys no puede contener valores duplicados',
  ),

  Ex1030: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1030`,
    'El key del permiso tiene que ser un string',
  ),

  Ex1031: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1031`,
    'El key del permiso no puede estar vacio',
  ),

  Ex1032: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1032`,
    'La descripcion del permiso tiene que ser un string',
  ),

  Ex1033: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1033`,
    'children del permiso tiene que ser un arreglo',
  ),

  Ex1034: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1034`,
    'permissions tiene que ser un arreglo',
  ),

  Ex1035: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1035`,
    'permissions no puede estar vacio',
  ),

  Ex1036: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1036`,
    'El key del rol tiene que ser un string',
  ),

  Ex1037: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1037`,
    'El key del rol no puede estar vacio',
  ),

  Ex1038: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1038`,
    'El nombre del rol tiene que ser un string',
  ),

  Ex1039: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1039`,
    'El nombre del rol no puede estar vacio',
  ),

  Ex1040: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1040`,
    'La descripcion del rol tiene que ser un string',
  ),

  Ex1041: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1041`,
    'isDefault tiene que ser boolean',
  ),

  Ex1042: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1042`,
    'permissionKeys tiene que ser un arreglo',
  ),

  Ex1043: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1043`,
    'Cada permissionKey tiene que ser un string',
  ),

  Ex1044: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1044`,
    'permissionKeys no puede estar vacio',
  ),

  Ex1045: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1045`,
    'firstName tiene que ser un string',
  ),

  Ex1046: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1046`,
    'firstName no puede estar vacio',
  ),

  Ex1047: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1047`,
    'lastName tiene que ser un string',
  ),

  Ex1048: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1048`,
    'lastName no puede estar vacio',
  ),

  Ex1049: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1049`,
    'status de colaborador invalido',
  ),

  Ex1050: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1050`,
    'roleKeys tiene que ser un arreglo',
  ),

  Ex1051: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1051`,
    'Cada roleKey tiene que ser un string',
  ),

  Ex1052: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1052`,
    'roleKeys no puede estar vacio',
  ),

  Ex1053: new FoodaExceptionInfo(`${SERVICE_PREFIX}-1053`, 'El rol ya existe'),

  Ex1054: new FoodaExceptionInfo(`${SERVICE_PREFIX}-1054`, 'Rol no encontrado'),

  Ex1055: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1055`,
    'Una o mas permissionKeys no existen',
  ),

  Ex1056: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1056`,
    'Colaborador no encontrado',
  ),

  Ex1057: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1057`,
    'El correo del colaborador ya existe',
  ),

  Ex1058: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1058`,
    'x-collaborator-id es requerido',
  ),

  Ex1059: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1059`,
    'Uno o mas roleKeys no existen',
  ),
};
