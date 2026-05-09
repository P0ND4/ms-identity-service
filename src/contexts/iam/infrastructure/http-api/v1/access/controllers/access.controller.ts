import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiHeader,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { V1_IAM } from '../../../route.constants';
import { IAccessUseCase } from 'src/contexts/iam/domain/use-cases/access/access-use-case.interface';
import { SyncPermissionsDto } from '../dtos/sync-permissions.dto';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRolePermissionsDto } from '../dtos/update-role-permissions.dto';
import { UpdateRoleDto } from '../dtos/update-role.dto';
import { UpdateRolesDto } from '../dtos/update-roles.dto';
import { UpdateRolesPermissionsDto } from '../dtos/update-roles-permissions.dto';
import { SkipResponseWrapper } from 'src/contexts/shared/decorators/skip-response-wrapper.decorator';

@SkipResponseWrapper()
@ApiTags('IAM Access')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'Identificador del tenant (schema de la base de datos)',
  example: 'tenant_abc',
})
@Controller(V1_IAM + '/access')
export class AccessController {
  constructor(private readonly accessUseCase: IAccessUseCase) {}

  @Post('permissions/sync')
  @ApiOperation({
    summary: 'Sincronizar arbol de permisos',
    description:
      'Recibe el arbol de permisos definido por la aplicacion cliente y lo sincroniza en el IAM.',
  })
  @ApiBody({
    type: SyncPermissionsDto,
    description:
      'Cada nodo representa un permiso. `children` es un arreglo de permisos hijos. Si un permiso no tiene hijos, enviar `children: []` o no enviar la propiedad.',
    examples: {
      arbolCompleto: {
        summary: 'Ejemplo completo de arbol de permisos',
        value: {
          permissions: [
            {
              key: 'users',
              description: 'Modulo de usuarios',
              children: [
                {
                  key: 'users:read',
                  description: 'Ver usuarios',
                  children: [],
                },
                {
                  key: 'users:write',
                  description: 'Crear y editar usuarios',
                  children: [
                    {
                      key: 'users:write:status',
                      description: 'Cambiar estado de usuarios',
                      children: [],
                    },
                  ],
                },
              ],
            },
            {
              key: 'roles',
              description: 'Modulo de roles',
              children: [
                {
                  key: 'roles:read',
                  description: 'Ver roles',
                  children: [],
                },
                {
                  key: 'roles:update',
                  description: 'Actualizar permisos de roles',
                  children: [],
                },
              ],
            },
          ],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Sincronizacion de permisos exitosa.' })
  @ApiBadRequestResponse({ description: 'Payload de permisos invalido.' })
  async syncPermissions(@Body() body: SyncPermissionsDto) {
    return await this.accessUseCase.syncPermissions(body.permissions);
  }

  @Get('permissions/tree')
  @ApiOperation({
    summary: 'Obtener arbol de permisos',
    description:
      'Devuelve la estructura jerarquica de permisos persistida en el IAM.',
  })
  @ApiOkResponse({ description: 'Arbol de permisos obtenido exitosamente.' })
  async getPermissionsTree() {
    return await this.accessUseCase.getPermissionsTree();
  }

  @Get('permissions')
  @ApiOperation({
    summary: 'Listar permisos planos',
    description:
      'Devuelve todos los permisos en una lista plana, sin estructura jerarquica.',
  })
  @ApiOkResponse({ description: 'Listado plano de permisos exitoso.' })
  async getPermissions() {
    return await this.accessUseCase.getPermissions();
  }

  @Get('roles')
  @ApiOperation({
    summary: 'Listar roles',
    description:
      'Lista todos los roles registrados junto con sus permisos asociados.',
  })
  @ApiOkResponse({ description: 'Listado de roles exitoso.' })
  async getRoles() {
    return await this.accessUseCase.getRoles();
  }

  @Post('roles')
  @ApiOperation({
    summary: 'Crear rol',
    description: 'Crea un nuevo rol y opcionalmente asigna permisos por key.',
  })
  @ApiBody({
    type: CreateRoleDto,
    description:
      'Define la informacion base del rol. permissionKeys es opcional y permite asignar permisos desde la creacion.',
    examples: {
      rolAdministrador: {
        summary: 'Ejemplo de creacion de rol con permisos',
        value: {
          key: 'admin',
          name: 'Administrador',
          description: 'Rol con acceso de administracion del sistema',
          isDefault: false,
          permissionKeys: [
            'users:read',
            'users:write',
            'roles:read',
            'roles:update',
          ],
        },
      },
      rolBaseSinPermisos: {
        summary: 'Ejemplo de creacion de rol sin permisos iniciales',
        value: {
          key: 'operator',
          name: 'Operador',
          description: 'Rol operativo base',
          isDefault: false,
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Rol creado exitosamente.' })
  @ApiConflictResponse({ description: 'El rol ya existe.' })
  @ApiBadRequestResponse({ description: 'permissionKeys invalido.' })
  async createRole(@Body() body: CreateRoleDto) {
    return await this.accessUseCase.createRole({
      key: body.key,
      name: body.name,
      description: body.description,
      isDefault: body.isDefault,
      permissionKeys: body.permissionKeys,
    });
  }

  @Patch('roles/:id')
  @ApiOperation({
    summary: 'Actualizar rol',
    description:
      'Actualiza la informacion del rol (key, name, description, isDefault) sin modificar sus permisos.',
  })
  @ApiBody({
    type: UpdateRoleDto,
    description: 'Campos editables del rol.',
    examples: {
      actualizarNombre: {
        summary: 'Cambiar nombre y descripcion del rol',
        value: {
          name: 'Administrador Global',
          description: 'Rol con acceso total a la plataforma',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Rol actualizado exitosamente.' })
  @ApiConflictResponse({ description: 'El key del rol ya existe.' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado.' })
  @ApiBadRequestResponse({ description: 'id de rol o payload invalido.' })
  async updateRole(@Param('id') roleId: string, @Body() body: UpdateRoleDto) {
    return await this.accessUseCase.updateRole(roleId, {
      key: body.key,
      name: body.name,
      description: body.description,
      isDefault: body.isDefault,
    });
  }

  @Patch('roles')
  @ApiOperation({
    summary: 'Actualizar varios roles',
    description:
      'Actualiza datos de multiples roles en una sola solicitud (sin tocar permisos).',
  })
  @ApiBody({
    type: UpdateRolesDto,
    description: 'Listado de roles y campos a actualizar.',
    examples: {
      actualizacionMasiva: {
        summary: 'Actualizar varios roles',
        value: {
          updates: [
            {
              id: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
              name: 'Administrador Global',
            },
            {
              id: '10f65189-6a56-41af-a6a0-6f9f159010f6',
              description: 'Rol operativo para soporte y monitoreo',
            },
          ],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Roles actualizados exitosamente.' })
  @ApiBadRequestResponse({ description: 'Payload invalido.' })
  @ApiNotFoundResponse({ description: 'Uno o mas roles no encontrados.' })
  async updateRoles(@Body() body: UpdateRolesDto) {
    return await this.accessUseCase.updateRoles(body.updates);
  }

  @Put('roles/permissions')
  @ApiOperation({
    summary: 'Actualizar permisos de varios roles',
    description:
      'Reemplaza los permissionKeys de multiples roles en una sola solicitud.',
  })
  @ApiBody({
    type: UpdateRolesPermissionsDto,
    description: 'Listado de roleId con su lista final de permissionKeys.',
    examples: {
      permisosMasivos: {
        summary: 'Actualizar permisos de varios roles',
        value: {
          updates: [
            {
              roleId: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
              permissionKeys: ['users:read', 'users:write', 'roles:update'],
            },
            {
              roleId: '10f65189-6a56-41af-a6a0-6f9f159010f6',
              permissionKeys: ['users:read'],
            },
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Permisos de roles actualizados exitosamente.',
  })
  @ApiBadRequestResponse({ description: 'Payload invalido.' })
  @ApiNotFoundResponse({ description: 'Uno o mas roles no encontrados.' })
  async updateRolePermissionsBulk(@Body() body: UpdateRolesPermissionsDto) {
    return await this.accessUseCase.updateRolePermissionsBulk(body.updates);
  }

  @Put('roles/:id/permissions')
  @ApiOperation({
    summary: 'Actualizar permisos de rol',
    description:
      'Reemplaza los permisos asociados a un rol por permissionKeys.',
  })
  @ApiBody({
    type: UpdateRolePermissionsDto,
    description:
      'Envía la lista final de permissionKeys que debe conservar el rol. La asignación previa se reemplaza por completo.',
    examples: {
      reemplazoCompleto: {
        summary: 'Reemplazar permisos del rol',
        value: {
          permissionKeys: [
            'users:read',
            'users:write',
            'users:write:status',
            'roles:read',
          ],
        },
      },
      permisosMinimos: {
        summary: 'Dejar el rol con permisos mínimos',
        value: {
          permissionKeys: ['users:read'],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Permisos del rol actualizados exitosamente.' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado.' })
  @ApiBadRequestResponse({ description: 'permissionKeys invalido.' })
  async updateRolePermissions(
    @Param('id') roleId: string,
    @Body() body: UpdateRolePermissionsDto,
  ) {
    return await this.accessUseCase.updateRolePermissions(
      roleId,
      body.permissionKeys,
    );
  }

  @Delete('roles/:id')
  @ApiOperation({
    summary: 'Eliminar rol',
    description:
      'Elimina el rol y quita sus asignaciones de colaboradores y permisos relacionados.',
  })
  @ApiOkResponse({ description: 'Rol eliminado exitosamente.' })
  @ApiNotFoundResponse({ description: 'Rol no encontrado.' })
  @ApiBadRequestResponse({ description: 'id de rol invalido.' })
  async deleteRole(@Param('id') roleId: string) {
    await this.accessUseCase.deleteRole(roleId);
    return { deleted: true };
  }
}
