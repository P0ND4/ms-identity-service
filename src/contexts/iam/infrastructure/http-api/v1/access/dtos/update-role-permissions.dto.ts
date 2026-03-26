import { ArrayNotEmpty, ArrayUnique, IsArray, IsString } from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class UpdateRolePermissionsDto {
  @IsArray({ message: FoodaExceptionCodes.Ex1042.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1044.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1028.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1043.message })
  permissionKeys!: string[];
}
