import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class UpdateCollaboratorStatusDto {
  @ApiProperty({
    enum: CollaboratorStatus,
    example: CollaboratorStatus.ACTIVE,
    description: 'Nuevo estado del colaborador.',
  })
  @IsEnum(CollaboratorStatus, { message: FoodaExceptionCodes.Ex1049.message })
  status!: CollaboratorStatus;
}
