import { Body, Controller, Get, Param, Post, Put } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { V1_IAM } from '../../../route.constants';
import { IAccessUseCase } from 'src/contexts/iam/domain/use-cases/access-use-case.interface';
import { SyncPermissionsDto } from '../dtos/sync-permissions.dto';
import { CreateRoleDto } from '../dtos/create-role.dto';
import { UpdateRolePermissionsDto } from '../dtos/update-role-permissions.dto';

@ApiTags('IAM Access')
@Controller(V1_IAM + '/access')
export class AccessController {
  constructor(private readonly accessUseCase: IAccessUseCase) {}

  @Post('permissions/sync')
  @ApiOperation({
    summary: 'Sincronizar arbol de permisos',
    description:
      'Recibe el arbol de permisos definido por la aplicacion cliente y lo sincroniza en el IAM.',
  })
  @ApiBody({ type: SyncPermissionsDto })
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
  @ApiBody({ type: CreateRoleDto })
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

  @Put('roles/:id/permissions')
  @ApiOperation({
    summary: 'Actualizar permisos de rol',
    description:
      'Reemplaza los permisos asociados a un rol por permissionKeys.',
  })
  @ApiBody({ type: UpdateRolePermissionsDto })
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
}
