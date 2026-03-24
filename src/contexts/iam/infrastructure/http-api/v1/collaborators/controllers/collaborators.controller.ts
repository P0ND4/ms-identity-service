import { Controller, Get, Patch, Post, Put } from '@nestjs/common';
import { V1_IAM } from '../../../route.constants';

@Controller(V1_IAM + '/collaborators')
export class CollaboratorsController {
  constructor() {}

  @Get('me')
  getMe() {}

  @Get()
  getCollaborators() {}

  @Post()
  createCollaborator() {}

  @Put(':id/roles')
  updateCollaboratorRoles() {}

  @Patch(':id/status')
  updateCollaboratorStatus() {}
}
