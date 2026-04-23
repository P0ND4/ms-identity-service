export class FoodaExceptionInfo {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly service: string = 'identity-service',
  ) {}
}

const SERVICE_PREFIX = 'ID';

export const FoodaExceptionCodes = {
  Ex0000: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-0000`,
    'Ha ocurrido un error desconocido en la solicitud.',
  ),
  Ex0001: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-0001`,
    'Ruta o recurso no encontrado',
  ),

  Ex9999: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-9999`,
    'Error interno del servidor.',
  ),

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
    'El key del rol tiene que ser un string',
  ),
  Ex1032: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1032`,
    'El key del permiso no puede estar vacio',
  ),
  Ex1033: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1033`,
    'La descripcion del permiso tiene que ser un string',
  ),
  Ex1034: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1034`,
    'children del permiso tiene que ser un arreglo',
  ),
  Ex1035: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1035`,
    'permissions tiene que ser un arreglo',
  ),
  Ex1036: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1036`,
    'permissions no puede estar vacio',
  ),
  Ex1037: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1037`,
    'El key del rol tiene que ser un string',
  ),
  Ex1038: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1038`,
    'El key del rol no puede estar vacio',
  ),
  Ex1039: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1039`,
    'El nombre del rol tiene que ser un string',
  ),
  Ex1040: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1040`,
    'El nombre del rol no puede estar vacio',
  ),
  Ex1041: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1041`,
    'La descripcion del rol tiene que ser un string',
  ),
  Ex1042: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1042`,
    'isDefault tiene que ser boolean',
  ),
  Ex1043: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1043`,
    'permissionKeys tiene que ser un arreglo',
  ),
  Ex1044: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1044`,
    'Cada permissionKey tiene que ser un string',
  ),
  Ex1045: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1045`,
    'permissionKeys no puede estar vacio',
  ),
  Ex1046: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1046`,
    'firstName tiene que ser un string',
  ),
  Ex1047: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1047`,
    'firstName no puede estar vacio',
  ),
  Ex1048: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1048`,
    'lastName tiene que ser un string',
  ),
  Ex1049: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1049`,
    'lastName no puede estar vacio',
  ),
  Ex1050: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1050`,
    'status de colaborador invalido',
  ),
  Ex1051: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1051`,
    'roleKeys tiene que ser un arreglo',
  ),
  Ex1052: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1052`,
    'Cada roleKey tiene que ser un string',
  ),
  Ex1053: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1053`,
    'roleKeys no puede estar vacio',
  ),
  Ex1054: new FoodaExceptionInfo(`${SERVICE_PREFIX}-1054`, 'El rol ya existe'),
  Ex1055: new FoodaExceptionInfo(`${SERVICE_PREFIX}-1055`, 'Rol no encontrado'),
  Ex1056: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1056`,
    'Una o mas permissionKeys no existen',
  ),
  Ex1057: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1057`,
    'Colaborador no encontrado',
  ),
  Ex1058: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1058`,
    'El correo del colaborador ya existe',
  ),
  Ex1059: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1059`,
    'x-collaborator-id es requerido',
  ),
  Ex1060: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1060`,
    'Uno o mas roleKeys no existen',
  ),
  Ex1061: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1061`,
    'El identificador del rol debe ser un UUID valido',
  ),
  Ex1062: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1062`,
    'El identificador del colaborador debe ser un UUID valido',
  ),
  Ex1063: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1063`,
    'avatarUrl debe ser una URL valida',
  ),
  Ex1064: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1064`,
    'collaborators tiene que ser un arreglo',
  ),
  Ex1065: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1065`,
    'collaborators no puede estar vacio',
  ),
  Ex1066: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1066`,
    'collaborators contiene elementos invalidos',
  ),
  Ex1067: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1067`,
    'id de colaborador tiene que ser un string',
  ),
  Ex1068: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1068`,
    'id de colaborador no puede estar vacio',
  ),
  Ex1069: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1069`,
    'updates de colaboradores tiene que ser un arreglo',
  ),
  Ex1070: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1070`,
    'updates de colaboradores no puede estar vacio',
  ),
  Ex1071: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1071`,
    'updates de colaboradores contiene elementos invalidos',
  ),
  Ex1072: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1072`,
    'id de rol tiene que ser un string',
  ),
  Ex1073: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1073`,
    'id de rol no puede estar vacio',
  ),
  Ex1074: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1074`,
    'updates de roles tiene que ser un arreglo',
  ),
  Ex1075: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1075`,
    'updates de roles no puede estar vacio',
  ),
  Ex1076: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1076`,
    'updates de roles contiene elementos invalidos',
  ),
  Ex1077: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1077`,
    'updates de permisos por rol tiene que ser un arreglo',
  ),
  Ex1078: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1078`,
    'updates de permisos por rol no puede estar vacio',
  ),
  Ex1079: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1079`,
    'updates de permisos por rol contiene elementos invalidos',
  ),
  Ex1080: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1080`,
    'updates de roles por colaborador tiene que ser un arreglo',
  ),
  Ex1081: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1081`,
    'updates de roles por colaborador no puede estar vacio',
  ),
  Ex1082: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1082`,
    'updates de roles por colaborador contiene elementos invalidos',
  ),

  Ex1083: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1083`,
    'updates de permisos por rol tiene que ser un arreglo',
  ),
  Ex1084: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1084`,
    'updates de permisos por rol no puede estar vacio',
  ),
  Ex1085: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1085`,
    'updates de permisos por rol contiene elementos invalidos',
  ),
  Ex1086: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1086`,
    'updates de roles por colaborador tiene que ser un arreglo',
  ),
  Ex1087: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1087`,
    'updates de roles por colaborador no puede estar vacio',
  ),
  Ex1088: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1088`,
    'updates de roles por colaborador contiene elementos invalidos',
  ),

  Ex1090: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1090`,
    'El token de GitHub es requerido',
  ),
  Ex1091: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1091`,
    'Token de GitHub invalido',
  ),
  Ex1092: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1092`,
    'Email de GitHub no verificado o no disponible',
  ),
  Ex1096: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1096`,
    'Apple OAuth redirect esta deshabilitado',
  ),
  Ex1097: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1097`,
    'Configuración de Apple Sign-In incompleta',
  ),
  Ex1098: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1098`,
    'Apple token exchange esta deshabilitado',
  ),
  Ex1099: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1099`,
    'idToken de Apple invalido o correo no verificado',
  ),
  Ex1100: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1100`,
    'idToken de Apple tiene que ser un string',
  ),
  Ex1101: new FoodaExceptionInfo(
    `${SERVICE_PREFIX}-1101`,
    'idToken de Apple no tiene que estar vacío',
  ),
};
