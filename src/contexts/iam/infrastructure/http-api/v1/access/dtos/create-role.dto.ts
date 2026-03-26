import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    example: 'admin',
    description: 'Key unica del rol.',
  })
  @IsString({ message: 'Ex1036' })
  @IsNotEmpty({ message: 'Ex1037' })
  key!: string;

  @ApiProperty({
    example: 'Administrador',
    description: 'Nombre visible del rol.',
  })
  @IsString({ message: 'Ex1038' })
  @IsNotEmpty({ message: 'Ex1039' })
  name!: string;

  @ApiPropertyOptional({
    example: 'Rol con acceso completo al sistema.',
    description: 'Descripcion opcional del rol.',
  })
  @IsOptional()
  @IsString({ message: 'Ex1040' })
  description?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Indica si es rol por defecto.',
  })
  @IsOptional()
  @IsBoolean({ message: 'Ex1041' })
  isDefault?: boolean;

  @ApiPropertyOptional({
    type: [String],
    example: ['users:manage', 'roles:update'],
    description: 'permissionKeys iniciales del rol.',
  })
  @IsOptional()
  @IsArray({ message: 'Ex1042' })
  @ArrayUnique({ message: 'Ex1028' })
  @IsString({ each: true, message: 'Ex1043' })
  permissionKeys?: string[];
}
