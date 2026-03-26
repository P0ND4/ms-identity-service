import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class UpdateCollaboratorRolesDto {
  @ApiProperty({
    type: [String],
    example: ['admin', 'viewer'],
    description: 'Lista de roleKeys a dejar asignadas al colaborador.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1050.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1052.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1029.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1051.message })
  roleKeys!: string[];
}
