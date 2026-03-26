# Documentacion Operativa - Identity Service

## 1. Resumen
Este servicio es un microservicio de identidad basado en NestJS, TypeORM, PostgreSQL y Redis.
Esta diseñado como un microservicio generico y extremadamente personalizable, para adaptarse a distintos dominios, reglas de negocio y esquemas de despliegue.

Responsabilidades principales:
- Autenticacion local y OAuth.
- Emision y renovacion de tokens.
- Gestion de colaboradores, roles y permisos.
- Blacklist de tokens en Redis.

Prefijos importantes:
- API base: `/api`
- Dominio IAM v1: `/api/v1/iam`
- Swagger (no produccion): `/api`

## 2. Requisitos
- Node.js 22+
- pnpm (via Corepack recomendado)
- PostgreSQL 16+ (compatible 14+ en general)
- Redis 7+

## 3. Archivos de Configuracion Clave
- Configuracion de entorno: `src/config/environment.config.ts`
- Configuracion de DB (TypeORM): `src/config/database.config.ts`
- Conexion Redis: `src/database/redis.module.ts`
- Bootstrap app: `src/main.ts`

## 4. Variables de Entorno
Usar `.env.example` como base.

### 4.1 Minimas para levantar local
- `PORT`
- `DB_HOST`
- `DB_PORT`
- `DB_USERNAME`
- `DB_PASSWORD`
- `DB_DATABASE`
- `REDIS_HOST`
- `REDIS_PORT`
- `JWT_SECRET`

### 4.2 Recomendadas en produccion
- `NODE_ENV=production`
- `DB_SYNCHRONIZE=false`
- `DB_LOGGING=false`
- `DB_SSL=true` (segun entorno)
- `JWT_SECRET` robusto (32+ chars)
- `REFRESH_TOKEN_TTL_SECONDS` acorde a politica de seguridad

## 5. Ejecucion Local (sin Docker)
1. Instalar dependencias:
```bash
pnpm install
```
2. Crear `.env` desde `.env.example`.
3. Levantar PostgreSQL y Redis.
4. Compilar:
```bash
pnpm build
```
5. Ejecutar en desarrollo:
```bash
pnpm start:dev
```

## 6. Scripts Utiles
- `pnpm build`: compila TypeScript.
- `pnpm start:dev`: arranque en desarrollo.
- `pnpm start:prod`: arranque desde `dist`.
- `pnpm test:unit`: unit tests.
- `pnpm test:e2e`: e2e tests.
- `pnpm test:cov`: cobertura.

## 7. Que se debe hacer
- Mantener `DB_SYNCHRONIZE=false` en produccion.
- Versionar cambios de esquema con migraciones (si se incorporan).
- Validar cambios con `pnpm build` y tests antes de desplegar.
- Asegurar secretos por variables de entorno o gestor de secretos.
- Restringir acceso a Redis y PostgreSQL por red privada.

## 8. Que no se debe hacer
- No usar `JWT_SECRET=secret` en ambientes reales.
- No exponer Redis/Postgres publicamente sin controles de red.
- No depender de `synchronize=true` para cambios de esquema en produccion.
- No mezclar configuraciones de OAuth de desarrollo en produccion.
- No hacer deploy sin revisar flags OAuth (`ENABLE_*`).

## 9. Docker

### 9.1 Dockerfile (2 stages)
Se implementaron 2 etapas:
- `builder`: instala dependencias, compila y deja dependencias de runtime.
- `runner`: imagen final liviana con `dist` y `node_modules` de produccion.

### 9.2 Levantar stack con Docker Compose
```bash
docker-compose up -d --build
```

Servicios levantados:
- `identity-service` (app)
- `identity-postgres` (PostgreSQL)
- `identity-redis` (Redis)

### 9.3 Detener stack
```bash
docker-compose down
```

### 9.4 Limpiar volumenes (destructivo)
```bash
docker-compose down -v
```

## 10. Si uso una base de datos diferente, que pasa?
Actualmente el servicio esta acoplado a PostgreSQL en `database.config.ts`:
```ts
type: 'postgres'
```

### 10.1 Que pasa si solo cambias variables sin cambiar codigo
- La app no se conectara correctamente.
- Pueden fallar tipos y features (uuid, enum, jsonb, extensiones).
- Es probable error de arranque del datasource.

### 10.2 Que deberias cambiar
1. Cambiar `type` en `database.config.ts`.
2. Instalar driver compatible:
- MySQL/MariaDB: `mysql2`
- SQL Server: `mssql`
- SQLite: `sqlite3` o `better-sqlite3`
3. Adaptar entidades y tipos incompatibles:
- `enum` y `jsonb`
- comportamiento de `uuid`
- defaults y precision de fechas
4. Revisar consultas/repositorios con SQL especifico.
5. Volver a validar tests y flujos de auth.

### 10.3 Recomendacion
Si necesitas DB distinta de PostgreSQL, planifica una migracion controlada y prueba completa de:
- login/logout/refresh
- roles/permisos
- operaciones bulk
- filtros y errores personalizados

## 11. Redis: notas de compatibilidad
- Si usas `REDIS_URL`, la app prioriza URL sobre host/port.
- Si activas password en Redis, configura `REDIS_PASSWORD` y `REDIS_USERNAME` cuando aplique ACL.
- Si Redis no esta disponible, funciones de blacklist pueden fallar y afectar logout/revocacion.

## 12. Troubleshooting rapido

### 12.1 Error de conexion PostgreSQL
- Verifica `DB_HOST`, `DB_PORT`, credenciales y red.
- Revisa logs del contenedor postgres.

### 12.2 Error de conexion Redis
- Verifica `REDIS_HOST`, `REDIS_PORT`, y password/ACL.

### 12.3 App arranca pero endpoint esperado da 404
- Verifica prefijo global `/api` y rutas `/v1/iam`.

### 12.4 Swagger no aparece
- Solo se expone fuera de produccion (`NODE_ENV != production`).

## 13. Checklist antes de produccion
- [ ] `NODE_ENV=production`
- [ ] `DB_SYNCHRONIZE=false`
- [ ] secretos reales y rotacion definida
- [ ] pruebas unitarias en verde
- [ ] build en verde
- [ ] politicas de backup para PostgreSQL
- [ ] monitoreo de Redis y DB

## 14. Comandos recomendados de verificacion
```bash
pnpm build
pnpm test:unit
docker-compose config
docker-compose up -d --build
```
