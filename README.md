# Identity Service

Servicio de identidad y acceso para autenticacion, autorizacion y gestion de colaboradores, basado en NestJS, PostgreSQL y Redis.

## Alcance
- Autenticacion local y proveedores OAuth.
- Emision y renovacion de tokens.
- Gestion de colaboradores, roles y permisos.
- Revocacion y blacklist de tokens en Redis.

## Endpoints
<img width="1468" height="715" alt="image" src="https://github.com/user-attachments/assets/a398075b-ed39-4520-aa9c-5c90afb75910" />
<img width="1447" height="600" alt="image" src="https://github.com/user-attachments/assets/65ee287b-7cbf-4017-aeac-826f83b39f78" />
<img width="1451" height="606" alt="image" src="https://github.com/user-attachments/assets/513a675e-d354-4f99-b520-c5d1af19dc94" />

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
