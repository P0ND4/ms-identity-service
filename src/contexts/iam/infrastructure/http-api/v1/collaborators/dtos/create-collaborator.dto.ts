import {
  ArrayUnique,
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class CreateCollaboratorDto {
  @IsEmail({}, { message: FoodaExceptionCodes.Ex1000.message })
  email!: string;

  @IsString({ message: FoodaExceptionCodes.Ex1045.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1046.message })
  firstName!: string;

  @IsString({ message: FoodaExceptionCodes.Ex1047.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1048.message })
  lastName!: string;

  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1001.message })
  @MinLength(6, { message: FoodaExceptionCodes.Ex1002.message })
  password?: string;

  @IsOptional()
  @IsEnum(CollaboratorStatus, { message: FoodaExceptionCodes.Ex1049.message })
  status?: CollaboratorStatus;

  @IsOptional()
  @IsArray({ message: FoodaExceptionCodes.Ex1050.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1029.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1051.message })
  roleKeys?: string[];
}
