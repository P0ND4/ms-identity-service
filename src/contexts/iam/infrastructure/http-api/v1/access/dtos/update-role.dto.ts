import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class UpdateRoleDto {
  @ApiPropertyOptional({
    example: 'admin',
    description: 'Nuevo key único del rol.',
  })
  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1036.message })
  key?: string;

  @ApiPropertyOptional({
    example: 'Administrador Global',
    description: 'Nuevo nombre visible del rol.',
  })
  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1038.message })
  name?: string;

  @ApiPropertyOptional({
    example: 'Rol con acceso total al panel administrativo.',
    description: 'Nueva descripción del rol.',
  })
  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1040.message })
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Define si el rol es rol por defecto.',
  })
  @IsOptional()
  @IsBoolean({ message: FoodaExceptionCodes.Ex1041.message })
  isDefault?: boolean;
}
