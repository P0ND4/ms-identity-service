import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class CreateRoleDto {
  @IsString({ message: FoodaExceptionCodes.Ex1036.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1037.message })
  key!: string;

  @IsString({ message: FoodaExceptionCodes.Ex1038.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1039.message })
  name!: string;

  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1040.message })
  description?: string;

  @IsOptional()
  @IsBoolean({ message: FoodaExceptionCodes.Ex1041.message })
  isDefault?: boolean;

  @IsOptional()
  @IsArray({ message: FoodaExceptionCodes.Ex1042.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1028.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1043.message })
  permissionKeys?: string[];
}
