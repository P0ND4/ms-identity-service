import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class UpdateCollaboratorRolesDto {
  @IsArray({ message: FoodaExceptionCodes.Ex1050.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1052.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1029.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1051.message })
  roleKeys!: string[];
}
