import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/identity-exception.codes';

export class UpdateCollaboratorDto {
  @ApiPropertyOptional({
    example: 'colaborador@empresa.com',
    description: 'Nuevo correo del colaborador.',
  })
  @IsOptional()
  @IsEmail({}, { message: FoodaExceptionCodes.Ex1000.message })
  email?: string;

  @ApiPropertyOptional({
    example: 'Juan',
    description: 'Nuevo nombre del colaborador.',
  })
  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1045.message })
  firstName?: string;

  @ApiPropertyOptional({
    example: 'Perez',
    description: 'Nuevo apellido del colaborador.',
  })
  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1047.message })
  lastName?: string;

  @ApiPropertyOptional({
    example: 'https://cdn.company.com/avatars/juan-perez.png',
    description: 'URL de avatar del colaborador.',
  })
  @IsOptional()
  @IsUrl({}, { message: FoodaExceptionCodes.Ex1068.message })
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'NuevaClave123',
    minLength: 6,
    description: 'Nueva contraseña para login local.',
  })
  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1001.message })
  @MinLength(6, { message: FoodaExceptionCodes.Ex1002.message })
  password?: string;
}
