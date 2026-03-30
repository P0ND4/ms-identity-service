import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { CreateCollaboratorDto } from './create-collaborator.dto';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class CreateCollaboratorsDto {
  @ApiProperty({
    type: () => [CreateCollaboratorDto],
    description: 'Listado de colaboradores a crear.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1069.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1070.message })
  @ValidateNested({ each: true, message: FoodaExceptionCodes.Ex1071.message })
  @Type(() => CreateCollaboratorDto)
  collaborators!: CreateCollaboratorDto[];
}
