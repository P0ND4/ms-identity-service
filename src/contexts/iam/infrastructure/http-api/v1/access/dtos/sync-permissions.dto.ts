import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class PermissionTreeNodeDto {
  @ApiProperty({
    example: 'users:manage',
    description: 'Key unica del permiso.',
  })
  @IsString({ message: FoodaExceptionCodes.Ex1030.message })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1031.message })
  key!: string;

  @ApiPropertyOptional({
    example: 'Permite gestionar usuarios',
    description: 'Descripcion opcional del permiso.',
  })
  @IsOptional()
  @IsString({ message: FoodaExceptionCodes.Ex1032.message })
  description?: string;

  @ApiPropertyOptional({
    type: () => [PermissionTreeNodeDto],
    description: 'Permisos hijos para construir jerarquia.',
  })
  @IsOptional()
  @IsArray({ message: FoodaExceptionCodes.Ex1033.message })
  @ValidateNested({ each: true, message: FoodaExceptionCodes.Ex1026.message })
  @Type(() => PermissionTreeNodeDto)
  children?: PermissionTreeNodeDto[];
}

export class SyncPermissionsDto {
  @ApiProperty({
    type: () => [PermissionTreeNodeDto],
    description: 'Raiz del arbol de permisos a sincronizar.',
  })
  @IsArray({ message: FoodaExceptionCodes.Ex1034.message })
  @ArrayNotEmpty({ message: FoodaExceptionCodes.Ex1035.message })
  @ValidateNested({ each: true, message: FoodaExceptionCodes.Ex1027.message })
  @Type(() => PermissionTreeNodeDto)
  permissions!: PermissionTreeNodeDto[];
}
