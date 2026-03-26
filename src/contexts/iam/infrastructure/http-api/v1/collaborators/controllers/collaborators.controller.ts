import {
  Body,
  Controller,
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
import { ICollaboratorsUseCase } from 'src/contexts/iam/domain/use-cases/collaborators-use-case.interface';
import { CreateCollaboratorDto } from '../dtos/create-collaborator.dto';
import { UpdateCollaboratorRolesDto } from '../dtos/update-collaborator-roles.dto';
import { UpdateCollaboratorStatusDto } from '../dtos/update-collaborator-status.dto';

@ApiTags('IAM Collaborators')
@Controller(V1_IAM + '/collaborators')
export class CollaboratorsController {
  constructor(private readonly collaboratorsUseCase: ICollaboratorsUseCase) {}

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
  @ApiBadRequestResponse({ description: 'x-collaborator-id es requerido.' })
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
      'Crea un colaborador, opcionalmente con password y asignacion inicial de roles.',
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
  @ApiBody({ type: UpdateCollaboratorRolesDto })
  @ApiOkResponse({
    description: 'Roles del colaborador actualizados exitosamente.',
  })
  @ApiNotFoundResponse({ description: 'Colaborador no encontrado.' })
  @ApiBadRequestResponse({ description: 'roleKeys invalido.' })
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

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Actualizar estado de colaborador',
    description:
      'Actualiza el estado del colaborador (active, inactive, suspended, pending).',
  })
  @ApiBody({ type: UpdateCollaboratorStatusDto })
  @ApiOkResponse({
    description: 'Estado del colaborador actualizado exitosamente.',
  })
  @ApiNotFoundResponse({ description: 'Colaborador no encontrado.' })
  @ApiBadRequestResponse({ description: 'status invalido.' })
  async updateCollaboratorStatus(
    @Param('id') collaboratorId: string,
    @Body() body: UpdateCollaboratorStatusDto,
  ) {
    return await this.collaboratorsUseCase.updateCollaboratorStatus(
      collaboratorId,
      body.status,
    );
  }
}
