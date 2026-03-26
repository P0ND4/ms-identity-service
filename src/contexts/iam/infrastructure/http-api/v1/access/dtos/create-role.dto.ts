import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class CreateRoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'Key unica del rol.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1036.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1037.message })
  key!: string;

  @ApiProperty({
    example: 'Administrador',
    description: 'Nombre visible del rol.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1038.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1039.message })
  name!: string;

  @ApiPropertyOptional({
    example: 'Rol con acceso completo al sistema.',
    description: 'Descripcion opcional del rol.',
  })
  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1040.message })
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica si es rol por defecto.',
  })
  @IsOptional()
  @IsBoolean({ message: FoodaExceptionCodes.Ex1041.message })
  isDefault?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['users:manage', 'roles:update'],
    description: 'permissionKeys iniciales del rol.',
  })
  @IsOptional()
  @IsArray({ message: FoodaExceptionCodes.Ex1042.message })
  @ArrayUnique({ message: FoodaExceptionCodes.Ex1028.message })
  @IsString({ each: true, message: FoodaExceptionCodes.Ex1043.message })
  permissionKeys?: string[];
}
