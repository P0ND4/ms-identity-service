import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FoodaExceptionCodes } from 'src/contexts/shared/domain/exceptions/fooda-exception.codes';

export class LoginLocalDto {
  @ApiProperty({
    example: 'usuario@empresa.com',
    description: 'Correo del colaborador.',
  })
  @IsEmail({}, { message: FoodaExceptionCodes.Ex1000.message })
  email!: string;

  @ApiProperty({
    example: 'Secreto123',
    minLength: 6,
    description: 'Contraseña del colaborador.',
  })
  @IsNotEmpty({ message: FoodaExceptionCodes.Ex1001.message })
  @MinLength(6, { message: FoodaExceptionCodes.Ex1002.message })
  password!: string;
}
