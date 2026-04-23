# Plan: Implementación de Apple Sign-In OAuth

## 1. Resumen

Agregar autenticación OAuth con Apple Sign-In al identity-service, siguiendo el mismo patrón existente para Google, Microsoft, Slack y GitHub.

## 2. Flujos soportados

### 2.1 Flujo Redirect (browser-based)
```
Frontend → GET /api/v1/iam/auth/login/apple
        → Apple OAuth → /login/apple/callback
        → Devuelve tokens del servicio
```

### 2.2 Flujo Token Exchange (SDK/One Tap)
```
Frontend obtiene idToken de Apple (Sign in with Apple JS/SDK)
       → POST /api/v1/iam/auth/login/apple/token { idToken }
       → Backend valida idToken → Devuelve tokens del servicio
```

## 3. Archivos a crear

### 3.1 Helper: `src/contexts/iam/application/auth/helpers/apple-oauth.helper.ts`

Valida Apple ID tokens (JWT) y construye un `OAuthProfile`.

**Dependencias:** `jsonwebtoken` (ya incluido en `passport-apple` o usar `jose`)

**Funciones:**
- `verifyAppleIdTokenAndBuildOAuthProfile(params)` - Verifica JWT de Apple y retorna `OAuthProfile`
- `decodeAppleIdToken(token)` - Decodifica el JWT sin verificación (para testing)

**Notas técnicas:**
- Apple usa JWT firmado con clave privada (ES256)
- Se debe verificar el `kid` (key ID) y usar la clave pública de Apple para verificar
- Los endpoints de Apple para verificar: `https://appleid.apple.com/auth/keys`
- Audience debe ser el `APPLE_CLIENT_ID` (bundle ID de la app)

### 3.2 Estrategia: `src/contexts/iam/infrastructure/http-api/v1/auth/strategies/apple.strategy.ts`

Estrategia Passport para flujo redirect.

**Extiende:** `PassportStrategy(Strategy, 'apple')`

**Configuración:**
```typescript
callbackURL: APPLE_CALLBACK_URL
scope: ['email', 'name']  // Apple puede devolver name solo en primer login
```

**Validate callback:** Retorna `OAuthProfile`

### 3.3 Guard: `src/contexts/iam/infrastructure/http-api/v1/auth/guards/apple-oauth.guard.ts`

```typescript
export class AppleOAuthGuard extends AuthGuard('apple') {
  canActivate(context: ExecutionContext) {
    const enabled = configService.get<boolean>('ENABLE_APPLE_OAUTH_REDIRECT');
    if (!enabled) throw new FoodaException(FoodaExceptionCodes.Ex1027);
    return super.canActivate(context);
  }
}
```

### 3.4 DTO: `src/contexts/iam/infrastructure/http-api/v1/auth/dtos/login-apple-token.dto.ts`

```typescript
export class LoginAppleTokenDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'eyJhbGciOiJSUzI1NiIsInR5cCI6Ik...apple-id-token' })
  idToken: string;
}
```

## 4. Archivos a modificar

### 4.1 Entity: `src/contexts/shared/domain/entities/oauth-account.entity.ts`

**Cambio:** Añadir `APPLE = 'apple'` al enum `OAuthProvider`

```typescript
export enum OAuthProvider {
  GOOGLE = 'google',
  MICROSOFT = 'microsoft',
  SLACK = 'slack',
  GITHUB = 'github',
  APPLE = 'apple',  // <-- NUEVO
}
```

### 4.2 Interface: `src/contexts/iam/domain/use-cases/auth/auth-use-case.interface.ts`

**Cambios:**
1. Añadir `'apple'` a `OAuthProfile.provider`:
```typescript
export interface OAuthProfile {
  provider: 'google' | 'microsoft' | 'slack' | 'github' | 'apple';
  // ...
}
```

2. Añadir método abstracto:
```typescript
abstract loginAppleIdToken(idToken: string): Promise<AuthResponse>;
```

### 4.3 Use Case: `src/contexts/iam/application/auth/auth.use-case.ts`

**Cambios:**

1. Importar helper:
```typescript
import { verifyAppleIdTokenAndBuildOAuthProfile } from './helpers/apple-oauth.helper';
```

2. Añadir método:
```typescript
async loginAppleIdToken(idToken: string): Promise<AuthResponse> {
  const clientId = this.configService.get<string>('APPLE_CLIENT_ID');
  if (!clientId) {
    throw new FoodaException(FoodaExceptionCodes.Ex1028, HttpStatus.INTERNAL_SERVER_ERROR);
  }

  const profile = await verifyAppleIdTokenAndBuildOAuthProfile({
    idToken,
    audience: clientId,
  });

  return await this.loginOAuth(profile);
}
```

### 4.4 Controller: `src/contexts/iam/infrastructure/http-api/v1/auth/controllers/auth.controller.ts`

**Cambios:**

1. Imports:
```typescript
import { AppleOAuthGuard } from '../guards/apple-oauth.guard';
import { LoginAppleTokenDto } from '../dtos/login-apple-token.dto';
```

2. Endpoints (después de GitHub, antes de refresh):

```typescript
@Get('login/apple')
@ApiOperation({ summary: 'Iniciar login OAuth con Apple' })
@UseGuards(AppleOAuthGuard)
loginApple() {}

@Get('login/apple/callback')
@ApiOperation({ summary: 'Callback OAuth de Apple' })
@UseGuards(AppleOAuthGuard)
async loginAppleCallback(@Req() req: OAuthRequest): Promise<AuthResponse> {
  return await this.authService.loginOAuth(req.user);
}

@Post('login/apple/token')
@ApiOperation({ summary: 'Intercambiar ID token de Apple por tokens del servicio' })
@ApiBody({ type: LoginAppleTokenDto })
@ApiOkResponse({ description: 'Intercambio de token exitoso.' })
@ApiUnauthorizedResponse({ description: 'ID token de Apple invalido.' })
async loginAppleToken(@Body() body: LoginAppleTokenDto): Promise<AuthResponse> {
  const enabled = this.configService.get<boolean>('ENABLE_APPLE_TOKEN_EXCHANGE') ?? true;
  if (!enabled) {
    throw new FoodaException(FoodaExceptionCodes.Ex1029, HttpStatus.NOT_FOUND);
  }
  return await this.authService.loginAppleIdToken(body.idToken);
}
```

### 4.5 Auth Module: `src/contexts/iam/infrastructure/http-api/v1/auth/auth.module.ts`

**Cambios:**

1. Imports:
```typescript
import { AppleOAuthGuard } from './guards/apple-oauth.guard';
import { AppleStrategy } from './strategies/apple.strategy';
```

2. Providers array:
```typescript
AppleOAuthGuard,
AppleStrategy,
```

### 4.6 Exception Codes: `src/contexts/shared/domain/exceptions/identity-exception.codes.ts`

**Añadir después de Ex1092:**

```typescript
Ex1027: new FoodaExceptionInfo(
  `${SERVICE_PREFIX}-1027`,
  'Apple OAuth redirect esta deshabilitado',
),
Ex1028: new FoodaExceptionInfo(
  `${SERVICE_PREFIX}-1028`,
  'Configuración de Apple Sign-In incompleta',
),
Ex1029: new FoodaExceptionInfo(
  `${SERVICE_PREFIX}-1029`,
  'Apple token exchange esta deshabilitado',
),
Ex1093: new FoodaExceptionInfo(
  `${SERVICE_PREFIX}-1093`,
  'idToken de Apple invalido o correo no verificado',
),
Ex1094: new FoodaExceptionInfo(
  `${SERVICE_PREFIX}-1094`,
  'idToken de Apple tiene que ser un string',
),
Ex1095: new FoodaExceptionInfo(
  `${SERVICE_PREFIX}-1095`,
  'idToken de Apple no tiene que estar vacío',
),
```

### 4.7 Environment Config: `src/config/environment.config.ts`

**Interface Environment - añadir:**
```typescript
APPLE_CLIENT_ID?: string;
APPLE_TEAM_ID?: string;
APPLE_KEY_ID?: string;
APPLE_PRIVATE_KEY?: string;
APPLE_CALLBACK_URL?: string;
ENABLE_APPLE_OAUTH_REDIRECT: boolean;
ENABLE_APPLE_TOKEN_EXCHANGE: boolean;
```

**Return object - añadir:**
```typescript
APPLE_CLIENT_ID: process.env.APPLE_CLIENT_ID,
APPLE_TEAM_ID: process.env.APPLE_TEAM_ID,
APPLE_KEY_ID: process.env.APPLE_KEY_ID,
APPLE_PRIVATE_KEY: process.env.APPLE_PRIVATE_KEY,
APPLE_CALLBACK_URL: process.env.APPLE_CALLBACK_URL,
ENABLE_APPLE_OAUTH_REDIRECT: process.env.ENABLE_APPLE_OAUTH_REDIRECT === 'true',
ENABLE_APPLE_TOKEN_EXCHANGE: process.env.ENABLE_APPLE_TOKEN_EXCHANGE !== 'false',
```

## 5. Dependencias

### 5.1 Instalar package

```bash
pnpm add passport-apple
pnpm add -D @types/passport-apple
```

O verificar si existe versión compatible.

### 5.2 Packages relacionados ya instalados

- `passport` (^0.7.0) ✓
- `jsonwebtoken` (para verificar JWT de Apple - verificado)

## 6. Variables de entorno necesarias

```env
# Apple Sign-In Configuration
APPLE_CLIENT_ID=com.tuempresa.app  # Bundle ID de la app
APPLE_TEAM_ID=XXXXXXXXXX            # Team ID de Apple Developer
APPLE_KEY_ID=XXXXXXXXXX            # Key ID de la Auth Key
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----
APPLE_CALLBACK_URL=http://localhost:3000/api/v1/iam/auth/login/apple/callback

# Flags
ENABLE_APPLE_OAUTH_REDIRECT=false  # true para habilitar flujo redirect
ENABLE_APPLE_TOKEN_EXCHANGE=true    # true para habilitar token exchange
```

## 7. Configuración en Apple Developer Portal (fuera del código)

1. **Crear App ID** en Certificates, Identifiers & Profiles
   - Habilitar "Sign in with Apple" capability

2. **Crear Service ID** (para OAuth client)
   - Configurar redirect URLs

3. **Crear Auth Key** en Keys
   - Descargar clave privada (.p8)
   - Guardar el contenido como `APPLE_PRIVATE_KEY`

## 8. Estructura de archivos final

```
src/contexts/iam/application/auth/helpers/
├── apple-oauth.helper.ts          # NUEVO

src/contexts/iam/infrastructure/http-api/v1/auth/
├── strategies/
│   └── apple.strategy.ts         # NUEVO
├── guards/
│   └── apple-oauth.guard.ts      # NUEVO
├── dtos/
│   └── login-apple-token.dto.ts   # NUEVO
└── controllers/
    └── auth.controller.ts        # MODIFICADO
```

## 9. Consideraciones

### 9.1 Apple ID Token (JWT)

Apple devuelve un JWT que:
- Usa ES256 (ECDSA con P-256 y SHA-256)
- Debe verificarse con la clave pública de Apple
- Endpoint de claves: `https://appleid.apple.com/auth/keys`
- El `aud` (audience) debe ser el `APPLE_CLIENT_ID`

### 9.2 Email privado de Apple

Apple puede devolver `email` como `null` si el usuario usa "Hide My Email". En ese caso:
- Apple proporciona un relay email `xxxxx@privatemail.com`
- El email sigue siendo funcional para login
- `email_verified` puede ser `true` porque Apple ya verificó el email real

### 9.3 Name en primer login

Apple solo devuelve el nombre (`name`) en el primer OAuth authorization. Después hay que obtenerlo de `metadata`.

## 10. Orden de implementación

1. Modificar `oauth-account.entity.ts` (enum)
2. Modificar `identity-exception.codes.ts` (códigos error)
3. Modificar `environment.config.ts` (variables)
4. Crear `apple-oauth.helper.ts`
5. Crear `login-apple-token.dto.ts`
6. Crear `apple.strategy.ts`
7. Crear `apple-oauth.guard.ts`
8. Modificar `auth-use-case.interface.ts`
9. Modificar `auth.use-case.ts`
10. Modificar `auth.controller.ts`
11. Modificar `auth.module.ts`
12. Instalar dependencias (`pnpm add passport-apple`)
13. Tests
