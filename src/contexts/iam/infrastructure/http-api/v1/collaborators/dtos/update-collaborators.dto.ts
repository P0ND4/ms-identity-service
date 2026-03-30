import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UpdateCollaboratorDto } from './update-collaborator.dto';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class UpdateCollaboratorBulkItemDto extends UpdateCollaboratorDto {
  @ApiProperty({
    example: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
    description: 'Id del colaborador a actualizar.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1072.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1073.message })
  @IsUUID('4', { message: FoodaExceptionCodes.Ex1061.message })
  id!: string;
}

export class UpdateCollaboratorsDto {
  @ApiProperty({
    type: () => [UpdateCollaboratorBulkItemDto],
    description: 'Listado de colaboradores a actualizar.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1074.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1075.message })
  @ValidateNested({ each: true, message: FoodaExceptionCodes.Ex1076.message })
  @Type(() => UpdateCollaboratorBulkItemDto)
  updates!: UpdateCollaboratorBulkItemDto[];
}
