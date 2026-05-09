import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { V1_IAM } from '../../../route.constants';
import { ICollaboratorsUseCase } from 'src/contexts/iam/domain/use-cases/collaborators/collaborators-use-case.interface';
import { CreateCollaboratorDto } from '../dtos/create-collaborator.dto';
import { UpdateCollaboratorRolesDto } from '../dtos/update-collaborator-roles.dto';
import { UpdateCollaboratorStatusDto } from '../dtos/update-collaborator-status.dto';
import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';
import { CreateCollaboratorsDto } from '../dtos/create-collaborators.dto';
import { UpdateCollaboratorDto } from '../dtos/update-collaborator.dto';
import { UpdateCollaboratorsDto } from '../dtos/update-collaborators.dto';
import { UpdateCollaboratorsRolesDto } from '../dtos/update-collaborators-roles.dto';
import { SkipResponseWrapper } from 'src/contexts/shared/decorators/skip-response-wrapper.decorator';

const COLLABORATOR_STATUS_VALUES = Object.values(CollaboratorStatus);

@SkipResponseWrapper()
@ApiTags('IAM Collaborators')
@ApiHeader({
  name: 'x-tenant-id',
  required: true,
  description: 'Identificador del tenant (schema de la base de datos)',
  example: 'tenant_abc',
})
@Controller(V1_IAM + '/collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsUseCase: ICollaboratorsUseCase) {}

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener colaborador por ID',
    description:
      'Devuelve el perfil del colaborador incluyendo roles, buscado por UUID.',
  })
  @ApiOkResponse({ description: 'Colaborador encontrado.' })
  @ApiBadRequestResponse({ description: 'ID debe ser UUID valido.' })
  @ApiNotFoundResponse({ description: 'Colaborador no encontrado.' })
  async getById(@Param('id') id: string) {
    return await this.collaboratorsUseCase.getMe(id);
  }

  @Get('me')
  @ApiOperation({
    summary: 'Obtener colaborador autenticado',
    description:
      'Devuelve el perfil del colaborador segun el header x-collaborator-id.',
  })
  @ApiHeader({
    name: 'x-collaborator-id',
    required: true,
    description: 'Id del colaborador autenticado.',
  })
  @ApiOkResponse({
    description: 'Perfil de colaborador obtenido exitosamente.',
  })
  @ApiBadRequestResponse({
    description: 'x-collaborator-id es requerido y debe ser UUID valido.',
  })
  @ApiNotFoundResponse({ description: 'Colaborador no encontrado.' })
  async getMe(@Headers('x-collaborator-id') collaboratorId: string) {
    return await this.collaboratorsUseCase.getMe(collaboratorId);
  }

  @Get()
  @ApiOperation({
    summary: 'Listar colaboradores',
    description: 'Devuelve el listado de colaboradores y sus roles actuales.',
  })
  @ApiOkResponse({ description: 'Listado de colaboradores exitoso.' })
  async getCollaborators() {
    return await this.collaboratorsUseCase.getCollaborators();
  }

  @Post()
  @ApiOperation({
    summary: 'Crear colaborador',
    description:
      'Crea un colaborador con password para login local y asignacion inicial de roles opcional.',
  })
  @ApiHeader({
    name: 'x-assigned-by',
    required: false,
    description: 'Id del actor que realiza la asignacion de roles.',
  })
  @ApiBody({ type: CreateCollaboratorDto })
  @ApiOkResponse({ description: 'Colaborador creado exitosamente.' })
  @ApiConflictResponse({ description: 'El correo del colaborador ya existe.' })
  @ApiBadRequestResponse({ description: 'Payload de colaborador invalido.' })
  async createCollaborator(
    @Headers('x-assigned-by') assignedBy: string,
    @Body() body: CreateCollaboratorDto,
  ) {
    return await this.collaboratorsUseCase.createCollaborator({
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      password: body.password,
      status: body.status,
      roleKeys: body.roleKeys,
      assignedBy,
    });
  }

  @Post('bulk')
  @ApiOperation({
    summary: 'Crear multiples colaboradores',
    description:
      'Crea varios colaboradores en una sola solicitud, cada uno con password y roles opcionales.',
  })
  @ApiHeader({
    name: 'x-assigned-by',
    required: false,
    description: 'Id del actor que realiza la asignacion de roles.',
  })
  @ApiBody({
    type: CreateCollaboratorsDto,
    description: 'Listado de colaboradores a crear.',
    examples: {
      creacionMasiva: {
        summary: 'Crear dos colaboradores',
        value: {
          collaborators: [
            {
              email: 'ana@empresa.com',
              firstName: 'Ana',
              lastName: 'Gomez',
              password: 'Secreto123',
              status: 'active',
              roleKeys: ['admin'],
            },
            {
              email: 'mario@empresa.com',
              firstName: 'Mario',
              lastName: 'Diaz',
              password: 'Secreto123',
              status: 'pending',
              roleKeys: ['operator'],
            },
          ],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Colaboradores creados exitosamente.' })
  @ApiBadRequestResponse({ description: 'Payload invalido.' })
  @ApiConflictResponse({ description: 'Uno o mas correos ya existen.' })
  async createCollaborators(
    @Headers('x-assigned-by') assignedBy: string,
    @Body() body: CreateCollaboratorsDto,
  ) {
    return await this.collaboratorsUseCase.createCollaborators({
      collaborators: body.collaborators,
      assignedBy,
    });
  }

  @Put(':id')
  @ApiOperation({
    summary: 'Actualizar colaborador',
    description:
      'Actualiza datos de perfil del colaborador (email, nombre, apellido, avatar o password) sin modificar roles ni status.',
  })
  @ApiBody({
    type: UpdateCollaboratorDto,
    description: 'Campos editables de perfil del colaborador.',
    examples: {
      actualizarPerfil: {
        summary: 'Actualizar datos basicos',
        value: {
          firstName: 'Ana Maria',
          lastName: 'Gomez Ruiz',
          avatarUrl: 'https://cdn.company.com/avatars/ana.png',
        },
      },
      actualizarPassword: {
        summary: 'Actualizar password de login local',
        value: {
          password: 'NuevaClave123',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Colaborador actualizado exitosamente.' })
  @ApiNotFoundResponse({ description: 'Colaborador no encontrado.' })
  @ApiBadRequestResponse({
    description: 'Payload o id de colaborador invalido.',
  })
  @ApiConflictResponse({ description: 'El correo del colaborador ya existe.' })
  async updateCollaborator(
    @Param('id') collaboratorId: string,
    @Body() body: UpdateCollaboratorDto,
  ) {
    return await this.collaboratorsUseCase.updateCollaborator(collaboratorId, {
      email: body.email,
      firstName: body.firstName,
      lastName: body.lastName,
      avatarUrl: body.avatarUrl,
      password: body.password,
    });
  }

  @Put()
  @ApiOperation({
    summary: 'Actualizar multiples colaboradores',
    description:
      'Actualiza datos de perfil de varios colaboradores en una sola solicitud, sin modificar roles ni status.',
  })
  @ApiBody({
    type: UpdateCollaboratorsDto,
    description: 'Listado de colaboradores y campos a actualizar.',
    examples: {
      actualizacionMasiva: {
        summary: 'Actualizar dos colaboradores',
        value: {
          updates: [
            {
              id: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
              firstName: 'Ana Maria',
            },
            {
              id: '10f65189-6a56-41af-a6a0-6f9f159010f6',
              avatarUrl: 'https://cdn.company.com/avatars/mario.png',
            },
          ],
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Colaboradores actualizados exitosamente.' })
  @ApiNotFoundResponse({
    description: 'Uno o mas colaboradores no encontrados.',
  })
  @ApiBadRequestResponse({ description: 'Payload invalido.' })
  async updateCollaborators(@Body() body: UpdateCollaboratorsDto) {
    return await this.collaboratorsUseCase.updateCollaborators(body.updates);
  }

  @Put(':id/roles')
  @ApiOperation({
    summary: 'Actualizar roles de colaborador',
    description: 'Reemplaza los roles asignados al colaborador por roleKeys.',
  })
  @ApiHeader({
    name: 'x-assigned-by',
    required: false,
    description: 'Id del actor que realiza la asignacion de roles.',
  })
  @ApiBody({
    type: UpdateCollaboratorRolesDto,
    description:
      'Envía la lista final de roleKeys que debe conservar el colaborador. Los roles previos se reemplazan por completo.',
    examples: {
      reemplazoCompleto: {
        summary: 'Reemplazar roles del colaborador',
        value: {
          roleKeys: ['admin', 'operator'],
        },
      },
      rolUnico: {
        summary: 'Dejar colaborador con un solo rol',
        value: {
          roleKeys: ['operator'],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Roles del colaborador actualizados exitosamente.',
  })
  @ApiNotFoundResponse({ description: 'Colaborador no encontrado.' })
  @ApiBadRequestResponse({
    description:
      'roleKeys invalido o id de colaborador con formato incorrecto.',
  })
  async updateCollaboratorRoles(
    @Param('id') collaboratorId: string,
    @Headers('x-assigned-by') assignedBy: string,
    @Body() body: UpdateCollaboratorRolesDto,
  ) {
    return await this.collaboratorsUseCase.updateCollaboratorRoles(
      collaboratorId,
      body.roleKeys,
      assignedBy,
    );
  }

  @Put('roles')
  @ApiOperation({
    summary: 'Actualizar roles de multiples colaboradores',
    description:
      'Reemplaza los roles de varios colaboradores en una sola solicitud.',
  })
  @ApiHeader({
    name: 'x-assigned-by',
    required: false,
    description: 'Id del actor que realiza la asignacion de roles.',
  })
  @ApiBody({
    type: UpdateCollaboratorsRolesDto,
    description:
      'Listado de colaboradores con su lista final de roleKeys. Cada colaborador reemplaza completamente sus roles previos.',
    examples: {
      actualizacionMasivaRoles: {
        summary: 'Actualizar roles de dos colaboradores',
        value: {
          updates: [
            {
              id: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
              roleKeys: ['admin', 'operator'],
            },
            {
              id: '10f65189-6a56-41af-a6a0-6f9f159010f6',
              roleKeys: ['operator'],
            },
          ],
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Roles de colaboradores actualizados exitosamente.',
  })
  @ApiNotFoundResponse({
    description: 'Uno o mas colaboradores no encontrados.',
  })
  @ApiBadRequestResponse({
    description: 'Payload invalido o roleKeys inexistentes.',
  })
  async updateCollaboratorsRoles(
    @Headers('x-assigned-by') assignedBy: string,
    @Body() body: UpdateCollaboratorsRolesDto,
  ) {
    return await this.collaboratorsUseCase.updateCollaboratorsRoles(
      body.updates,
      assignedBy,
    );
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar estado de colaborador',
    description: `Actualiza el estado del colaborador. Estados permitidos: ${COLLABORATOR_STATUS_VALUES.join(', ')}.`,
  })
  @ApiBody({
    type: UpdateCollaboratorStatusDto,
    description: `Valores permitidos para status: ${COLLABORATOR_STATUS_VALUES.join(', ')}.`,
    examples: {
      activarColaborador: {
        summary: 'Activar colaborador',
        value: {
          status: CollaboratorStatus.ACTIVE,
        },
      },
      suspenderColaborador: {
        summary: 'Suspender colaborador',
        value: {
          status: CollaboratorStatus.SUSPENDED,
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Estado del colaborador actualizado exitosamente.',
  })
  @ApiNotFoundResponse({ description: 'Colaborador no encontrado.' })
  @ApiBadRequestResponse({
    description: 'status invalido o id de colaborador con formato incorrecto.',
  })
  async updateCollaboratorStatus(
    @Param('id') collaboratorId: string,
    @Body() body: UpdateCollaboratorStatusDto,
  ) {
    return await this.collaboratorsUseCase.updateCollaboratorStatus(
      collaboratorId,
      body.status,
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Eliminar colaborador (logico)',
    description:
      'Realiza borrado logico del colaborador (soft delete), preservando trazabilidad historica.',
  })
  @ApiOkResponse({ description: 'Colaborador eliminado logicamente.' })
  @ApiNotFoundResponse({ description: 'Colaborador no encontrado.' })
  @ApiBadRequestResponse({ description: 'id de colaborador invalido.' })
  async deleteCollaborator(@Param('id') collaboratorId: string) {
    await this.collaboratorsUseCase.deleteCollaborator(collaboratorId);
    return { deleted: true };
  }
}
