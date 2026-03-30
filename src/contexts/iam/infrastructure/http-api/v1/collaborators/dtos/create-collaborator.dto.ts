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
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CollaboratorStatus } from 'src/contexts/shared/domain/entities';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class CreateCollaboratorDto {
  @ApiProperty({
    example: 'colaborador@empresa.com',
    description: 'Correo unico del colaborador.',
  })
  @IsEmail({}, { message: FoodaExceptionCodes.Ex1000.message })
  email!: string;

  @ApiProperty({
    example: 'Juan',
    description: 'Nombre del colaborador.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1045.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1046.message })
  firstName!: string;

  @ApiProperty({
    example: 'Perez',
    description: 'Apellido del colaborador.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1047.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1048.message })
  lastName!: string;

  @ApiProperty({
    example: 'Secreto123',
    minLength: 6,
    description: 'Contraseña para login local.',
  })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1001.message })
  @IsString({ message: FoodaExceptionCodes.Ex1001.message })
  @MinLength(6, { message: FoodaExceptionCodes.Ex1002.message })
  password!: string;

  @ApiPropertyOptional({
    enum: CollaboratorStatus,
    example: CollaboratorStatus.PENDING,
    description: 'Estado inicial del colaborador.',
  })
  @IsOptional()
  @IsEnum(CollaboratorStatus, { message: FoodaExceptionCodes.Ex1049.message })
  status?: CollaboratorStatus;

  @ApiPropertyOptional({
    type: [String],
    example: ['admin', 'editor'],
    description: 'Keys de roles a asignar inicialmente.',
  })
  @IsOptional()
  @IsArray({ message: FoodaExceptionCodes.Ex1050.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1029.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1051.message })
  roleKeys?: string[];
}
