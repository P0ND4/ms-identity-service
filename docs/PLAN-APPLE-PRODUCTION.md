# Plan: Producción - Apple Sign-In

## Estado Actual

| Aspecto | Estado | Severidad |
|---------|--------|-----------|
| Verificación de firma JWT | ✅ Implementada (Fase 1) | CRÍTICA |
| Gestión de private key | ❌ Pendiente | ALTA |
| Nonce validation | ✅ Implementada | MEDIA |
| Revocación de tokens | ❌ Pendiente | MEDIA |
| Manejo email Apple relay | ⚠️ Detección, sin persistencia | MEDIA |
| Tests | ⚠️ 1 pre-existing failure | BAJA |

---

## 1. Gestión Segura de Private Key (ALTA)

### Problema
La `APPLE_PRIVATE_KEY` está en variable de entorno sin cifrado, expuesta en logs.

### Solución: ApplePrivateKeyService

```typescript
// src/contexts/iam/application/auth/helpers/apple-private-key.service.ts
@Injectable()
export class ApplePrivateKeyService {
  private key: string | null = null;

  async getPrivateKey(): Promise<string> {
    if (this.key) return this.key;

    // Producción: AWS Secrets Manager / Vault
    // Desarrollo: fallback a env var
    const secretName = this.configService.get('APPLE_PRIVATE_KEY_SECRET_NAME');
    if (secretName) {
      this.key = await this.fetchFromSecretManager(secretName);
    } else {
      this.key = this.configService.get<string>('APPLE_PRIVATE_KEY');
    }
    return this.key;
  }
}
```

### Archivos
- **Nuevo:** `apple-private-key.service.ts`
- **Modificar:** `auth.module.ts` - registrar servicio

### Dependencias (opcional)
- `@aws-sdk/client-secrets-manager` (si se usa AWS)

### Variables de entorno
```env
# Desarrollo
APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

# Producción
APPLE_PRIVATE_KEY_SECRET_NAME=prod/apple-sign-in/private-key
AWS_REGION=us-east-1
```

---

## 2. Endpoint de Revocación de Tokens (MEDIA)

### Problema
Apple puede revocar tokens de sesión. Un usuario podría ser desactivado en Apple pero seguir logueado.

### Solución

```typescript
// POST /api/v1/iam/auth/apple/revoke
async revokeAppleToken(@Body() body: { token: string }): Promise<void>
```

**Flujo:**
```
1. Cliente envía refresh token o access token
2. Backend llama a https://appleid.apple.com/auth/revoke
3. Si Apple acepta, revoke en nuestro sistema
4. Return success
```

### Archivos
- **Modificar:** `auth.controller.ts` - nuevo endpoint
- **Modificar:** `auth.use-case.ts` - implementar `revokeAppleToken()`
- **Modificar:** `auth-use-case.interface.ts` - añadir método abstracto
- **Modificar:** `login-apple-token.dto.ts` - DTO para revoke

### Endpoint
```
POST /api/v1/iam/auth/apple/revoke
Body: { token: string }
Response: 200 OK | 400 Bad Request
```

---

## 3. Persistencia de Email Type (MEDIA)

### Problema
Los emails `@privatemail.com` son de Apple Private Email Relay. No se pueden enviar emails a estos destinatarios. Actualmente solo se detecta pero no se persiste.

### Solución

**Opción A: Campo emailType en Collaborator**
```typescript
// collaborator.entity.ts
emailType: 'personal' | 'apple_relay' | null;

// En resolveCollaboratorFromOAuth
if (profile.metadata?.isAppleRelayEmail) {
  collaborator.emailType = 'apple_relay';
}
```

**Opción B: Solo marcar en OAuthAccount metadata**
```typescript
// No cambiar Collaborator, solo guardar en metadata
metadata: {
  ...profile.metadata,
  emailType: isAppleRelayEmail ? 'apple_relay' : 'personal'
}
```

**Recomendación:** Opción B (menos invasivo, no requiere migración de schema)

### Archivos
- **Modificar:** `auth.use-case.ts` - en `resolveCollaboratorFromOAuth()` guardar emailType en metadata

---

## 4. Tests Pre-Existing Failure (BAJA)

### Problema
```
test/unit/iam/auth/auth.use-case.spec.ts:603
expect(result.user.roles).toEqual([]);
Expected: []
Received: undefined
```

### Solución
Revisar el test `loginLocal: returns user with roles when roles exist` y ajustar el mock o el código.

---

## 5. Checklist Pre-Producción

- [ ] **ALTA: Private key en secret manager**
  - [ ] Crear ApplePrivateKeyService
  - [ ] Configurar AWS Secrets Manager o Vault (o indicar que se use env var en prod con restricciones)
  - [ ] Tests

- [ ] **MEDIA: Revocación de tokens**
  - [ ] Endpoint POST /apple/revoke
  - [ ] Llamada a Apple revoke API
  - [ ] Tests

- [ ] **MEDIA: Email type persistence**
  - [ ] Guardar emailType='apple_relay' en metadata
  - [ ] Tests

- [ ] **BAJA: Fix pre-existing test failure**
  - [ ] Investigar y corregir auth.use-case.spec.ts:603

- [ ] **Seguridad general**
  - [ ] Rate limiting en /login/apple/token
  - [ ] No loguear tokens ni emails sensibles
  - [ ] Code review

---

## 6. Estimación de Esfuerzo

| Tarea | Complejidad | Tiempo |
|-------|-------------|--------|
| ApplePrivateKeyService | Media | 0.5 día |
| Endpoint revoke | Media | 0.5 día |
| Email type persistence | Baja | 0.25 día |
| Fix test failure | Baja | 0.25 día |
| Rate limiting | Media | 0.5 día |
| Code review | - | 0.5 día |
| **Total** | | **~2.5 días** |

---

## 7. Orden de Implementación Sugerida

1. **ApplePrivateKeyService** - Seguridad crítica (ALTA)
2. **Fix pre-existing test** - Limpiar el backlog
3. **Email type persistence** - Cambio sencillo
4. **Endpoint revoke** - Última funcionalidad crítica
5. **Rate limiting** - hardening adicional

---

## 8. Documentación Requerida para Apple

Para configurar Apple Sign-In en producción, necesitas:

### Apple Developer Portal
1. **App ID** - `com.tuempresa.app`
   - Habilitar "Sign in with Apple" capability

2. **Service ID** - Para OAuth redirect
   - Redirect URLs configuradas

3. **Auth Key** - Para firma de cliente (solo si usas client secret JWT)
   - Crear en "Certificates, Identifiers & Profiles" > "Keys"

### Variables de entorno Producción
```env
APPLE_CLIENT_ID=com.tuempresa.app
APPLE_TEAM_ID=XXXXXXXXXX
APPLE_KEY_ID=XXXXXXXXXX
APPLE_PRIVATE_KEY_SECRET_NAME=prod/apple-sign-in/private-key
APPLE_CALLBACK_URL=https://api.tuempresa.com/api/v1/iam/auth/login/apple/callback
ENABLE_APPLE_TOKEN_EXCHANGE=true
```

---

## 9. Archivos del Plan

```
docs/
├── PLAN-APPLE-SIGNIN.md                    # Implementación original
├── PLAN-APPLE-SECURITY-HARDENING.md       # Hardening completado
└── PLAN-APPLE-PRODUCTION.md               # Este documento
```
