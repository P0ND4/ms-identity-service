# Identity Service

Servicio de identidad y acceso para autenticacion, autorizacion y gestion de colaboradores, basado en NestJS, PostgreSQL y Redis.

## Alcance
- Autenticacion local y proveedores OAuth.
- Emision y renovacion de tokens.
- Gestion de colaboradores, roles y permisos.
- Revocacion y blacklist de tokens en Redis.

## Stack
- NestJS
- TypeORM
- PostgreSQL
- Redis (ioredis)
- Swagger
- Jest (unit y e2e)
- Docker / Docker Compose

## Inicio rapido
1. Instalar dependencias.
```bash
pnpm install
```
2. Preparar entorno.
```bash
cp .env.example .env
```
3. Levantar en desarrollo.
```bash
pnpm setup:dev
```

## Scripts principales
- `pnpm setup`
- `pnpm setup:dev`
- `pnpm setup:prod`
- `pnpm start:dev`
- `pnpm build`
- `pnpm test:unit`
- `pnpm test:e2e`
- `pnpm test:cov`

## Docker
Arranque del stack:
```bash
docker compose up -d --build
```

Politica de puertos:
- Solo se expone el puerto del servicio principal (`3000`).
- PostgreSQL y Redis quedan accesibles solo dentro de la red interna de Docker.

## Endpoints base
- Base API: `/api`
- Dominio IAM: `/api/v1/iam`
- Swagger (no produccion): `/api`

## Documentacion operativa
Para procedimientos detallados de despliegue, troubleshooting y checklist:
- [docs/OPERACION_PROYECTO.md](docs/OPERACION_PROYECTO.md)
