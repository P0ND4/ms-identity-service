# Plan: Hardening de Seguridad - Apple Sign-In

## 1. Resumen Ejecutivo

La implementación actual de Apple Sign-In tiene vulnerabilidades críticas que deben corregirse antes de salir a producción. Este plan detalla las mejoras de seguridad necesarias.

### Estado Actual
| Aspecto | Estado | Severidad |
|---------|--------|-----------|
| Verificación de firma JWT | ❌ No implementada | CRÍTICA |
| Gestión de private key | ⚠️ Env var simple | ALTA |
| Manejo de email privado | ⚠️ Parcial | MEDIA |
| Revocación de tokens | ❌ No implementada | MEDIA |
| Nonce validation | ❌ No implementada | MEDIA |

---

## 2. Vulnerabilidades y Soluciones

### 2.1 Verificación Criptográfica del JWT (CRÍTICA)

**Problema:**
El código actual usa `jwt.decode()` que solo decodifica el token SIN verificar la firma criptográfica. Un atacante podría fabricar tokens falsos.

**Arquitectura de Apple:**
- Apple firma los ID tokens con ES256 (ECDSA sobre P-256)
- Las public keys están disponibles en `https://appleid.apple.com/auth/keys`
- Cada key tiene un `kid` (key ID) que debe coincidir con el header del token

**Solución propuesta:**

```
┌─────────────────────────────────────────────────────────────┐
│                    Token Verification Flow                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   1. Download & Cache Apple Public Keys                     │
│      └─ GET https://appleid.apple.com/auth/keys            │
│      └─ Cache for 24h (Apple rotates keys periodically)    │
│                                                             │
│   2. Extract kid from JWT header                           │
│      └─ header.kid = "KEY_ID"                              │
│                                                             │
│   3. Find matching key                                      │
│      └─ keys[] where key.kid === header.kid                │
│                                                             │
│   4. Verify signature                                      │
│      └─ crypto.verify(ES256, payload, publicKey)           │
│                                                             │
│   5. Validate claims                                       │
│      └─ aud === APPLE_CLIENT_ID                            │
│      └─ iss === "https://appleid.apple.com"                │
│      └─ exp > now                                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**Archivos a modificar:**
- `src/contexts/iam/application/auth/helpers/apple-oauth.helper.ts`

**Nueva estructura:**
```typescript
// Services
- ApplePublicKeysService (descarga y cache de keys)
- AppleTokenVerifier (verificación completa)

// Helper actualizado
verifyAppleIdTokenAndBuildOAuthProfile(params):
  1. Obtener keys (con cache)
  2. Extraer kid del header
  3. Buscar key pública
  4. Verificar firma
  5. Validar claims
  6. Retornar OAuthProfile
```

---

### 2.2 Gestión Segura de Private Key (ALTA)

**Problema:**
La `APPLE_PRIVATE_KEY` está almacenada como variable de entorno simple, expuesta en logs y archivos de configuración.

**Solución:**
1. Usar AWS Secrets Manager / HashiCorp Vault / Azure Key Vault
2. Cifrar en descanso
3. Rotación automática
4. No logging de la key

**Implementación sugerida:**
```typescript
// apple-private-key.service.ts
@Injectable()
class ApplePrivateKeyService {
  private key: string | null = null;

  async getPrivateKey(): Promise<string> {
    if (this.key) return this.key;

    // Opción 1: AWS Secrets Manager
    // const secret = await this.secretsManager.getSecret('apple-private-key');
    // this.key = secret;

    // Opción 2: Vault
    // const secret = await this.vault.read('secret/apple/private-key');

    // Fallback: env var (solo en desarrollo)
    this.key = this.configService.get<string>('APPLE_PRIVATE_KEY');
    return this.key;
  }
}
```

---

### 2.3 Manejo de Email Privado de Apple (MEDIA)

**Problema:**
Apple puede retornar:
- Email real: `usuario@gmail.com`
- Email privado Apple: `abc123@privatemail.com` (relay)

El email privado funciona para login pero no se le puede enviar emails.

**Solución:**
```typescript
// En Collaborator entity
emailType: 'personal' | 'apple_relay' | null;

// En resolveCollaboratorFromOAuth
if (isAppleRelayEmail(profile.email)) {
  // Guardar pero marcar como no-enviable
  collaborator.emailType = 'apple_relay';
}

// Utilidad
function isAppleRelayEmail(email: string): boolean {
  return email?.endsWith('@privatemail.com');
}
```

---

### 2.4 Revocación de Tokens (MEDIA)

**Problema:**
Apple puede revocar tokens de sesión. Un usuario podría ser desactivado en Apple pero seguir logueado.

**Solución:**
1. Opcional: Verificar token con `https://appleid.apple.com/auth/revoke`
2. Mejor: Implementar refresh token con verificación periódica

```typescript
// Nuevo endpoint
POST /api/v1/iam/auth/apple/revoke
Body: { token: string }

async revokeAppleToken(token: string): Promise<void> {
  const response = await fetch('https://appleid.apple.com/auth/revoke', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      token: token,
      client_id: this.configService.get('APPLE_CLIENT_ID'),
      client_secret: await this.generateClientSecret(),
    }),
  });
  // Apple returns 200 even if token not found
}
```

---

### 2.5 Nonce Validation (MEDIA)

**Problema:**
Sin `nonce`, un atacante podría usar un token de Apple en un sitio diferente (replay attack).

**Contexto:**
- `nonce` es un random string que el cliente genera
- Se envía en el request inicial a Apple
- Apple lo incluye en el ID token
- El backend verifica que coincida

**Solución:**
```typescript
// En auth.controller.ts - loginAppleToken
async loginAppleToken(@Body() body: LoginAppleTokenDto): Promise<AuthResponse> {
  // nonce debería venir en el DTO o ser un parámetro requerido
  const { idToken, nonce } = body;
  // ...
}

// En apple-oauth.helper.ts
async verifyAppleIdTokenAndBuildOAuthProfile(
  params: VerifyAppleIdTokenParams & { nonce?: string }
): Promise<OAuthProfile> {
  // Validar nonce si viene
  if (params.nonce && payload.nonce !== params.nonce) {
    throw new FoodaException(FoodaExceptionCodes.ExXXXX, HttpStatus.UNAUTHORIZED);
  }
}
```

---

## 3. Plan de Implementación

### Fase 1: Seguridad Crítica (1-2 días)

| Tarea | Descripción | Archivos |
|-------|-------------|----------|
| 1.1 | Crear `ApplePublicKeysService` con cache | `apple-public-keys.service.ts` |
| 1.2 | Implementar verificación de firma ES256 | `apple-oauth.helper.ts` |
| 1.3 | Añadir codes de error para nonce inválido | `identity-exception.codes.ts` |
| 1.4 | Tests de verificación de firma | `apple-oauth.helper.spec.ts` |

### Fase 2: Mejoras de Seguridad (2-3 días)

| Tarea | Descripción | Archivos |
|-------|-------------|----------|
| 2.1 | Crear `ApplePrivateKeyService` con secret manager | `apple-private-key.service.ts` |
| 2.2 | Actualizar DTO para incluir nonce | `login-apple-token.dto.ts` |
| 2.3 | Validar nonce en verificación | `apple-oauth.helper.ts` |
| 2.4 | Implementar endpoint de revocación | `auth.controller.ts`, `auth.service.ts` |

### Fase 3: Manejo de Email (1 día)

| Tarea | Descripción | Archivos |
|-------|-------------|----------|
| 3.1 | Añadir campo `emailType` a Collaborator | `collaborator.entity.ts` |
| 3.2 | Detectar y marcar emails Apple relay | `apple-oauth.helper.ts` |
| 3.3 | Tests de email handling | - |

---

## 4. Dependencias a Añadir

```bash
# Para criptografía
pnpm add jose          # Verificación JWT moderna
pnpm add -D @types/jose

# O usar crypto nativo de Node.js (ya incluido)
```

---

## 5. Variables de Entorno Adicionales

```env
# Nonce (opcional, para extra seguridad)
APPLE_NONCE_ENABLED=true

# Revocación
APPLE_REVOCATION_CHECK_ENABLED=false  # true en producción

# Cache de keys (en segundos)
APPLE_PUBLIC_KEYS_CACHE_TTL=86400    # 24 horas
```

---

## 6. Tests de Seguridad a Implementar

```typescript
describe('Apple JWT Security', () => {
  it('should reject token with invalid signature')
  it('should reject token when kid does not match any key')
  it('should reject token when issuer is not apple')
  it('should reject expired token')
  it('should reject token with wrong audience')
  it('should reject tampered payload')
  it('should accept valid token from Apple')
  it('should cache public keys to avoid repeated fetches')
  it('should refresh cache after TTL expires')
})
```

---

## 7. Checklist Pre-Lanzamiento

- [ ] Verificación de firma JWT implementada y testeada
- [ ] Private key en secret manager (no env var en prod)
- [ ] Nonce validation habilitada
- [ ] Endpoint de revocación implementado
- [ ] Email type (relay vs personal) guardado
- [ ] Tests de seguridad pasando
- [ ] Code review de seguridad
- [ ] Pen testing básico

---

## 8. Consideraciones Adicionales

### 8.1 Rate Limiting
Implementar rate limiting en `/login/apple/token` para prevenir ataques de fuerza bruta.

### 8.2 Logging
No loguear tokens, emails privados o información sensible.

### 8.3 Compliance
Apple Sign-In requiere cumplir con:
- Apple App Store Review Guidelines
- GDPR (para usuarios EU)
- CCPA (para usuarios California)

---

## 9. Estimación de Esfuerzo

| Fase | Tiempo | Complejidad |
|------|--------|-------------|
| Fase 1 | 1-2 días | Media |
| Fase 2 | 2-3 días | Media-Alta |
| Fase 3 | 1 día | Baja |
| **Total** | **4-6 días** | - |

---

## 10. Archivos del Plan

```
docs/
├── PLAN-APPLE-SIGNIN.md              # Plan original de implementación
└── PLAN-APPLE-SECURITY-HARDENING.md # Este documento
```
