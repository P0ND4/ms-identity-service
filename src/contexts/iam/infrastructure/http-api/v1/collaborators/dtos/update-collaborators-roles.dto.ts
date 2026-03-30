import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsNotEmpty,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class UpdateCollaboratorRolesBulkItemDto {
  @ApiProperty({
    example: '6b49fc1d-f7d6-4d0e-a523-7f6e0fbeec1a',
    description: 'Id del colaborador a actualizar.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1072.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1073.message })
  @IsUUID('4', { message: FoodaExceptionCodes.Ex1061.message })
  id!: string;

  @ApiProperty({
    type: [String],
    example: ['admin', 'operator'],
    description: 'Lista final de roleKeys del colaborador.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1050.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1052.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1029.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1051.message })
  roleKeys!: string[];
}

export class UpdateCollaboratorsRolesDto {
  @ApiProperty({
    type: () => [UpdateCollaboratorRolesBulkItemDto],
    description: 'Listado de colaboradores con su lista final de roleKeys.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1085.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1086.message })
  @ValidateNested({ each: true, message: FoodaExceptionCodes.Ex1087.message })
  @Type(() => UpdateCollaboratorRolesBulkItemDto)
  updates!: UpdateCollaboratorRolesBulkItemDto[];
}
