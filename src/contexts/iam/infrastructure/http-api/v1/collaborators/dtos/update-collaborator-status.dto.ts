import { IsEnum } from 'class-validator';
import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class UpdateCollaboratorStatusDto {
  @IsEnum(CollaboratorStatus, { message: FoodaExceptionCodes.Ex1049.message })
  status!: CollaboratorStatus;
}
