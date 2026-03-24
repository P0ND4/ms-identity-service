import { Injectable } from '@nestjs/common';
import { IAuthUseCase } from '../../domain/use-cases/auth-use-case.interface';

@Injectable()
export class AuthService implements IAuthUseCase {
  constructor() {}

  async loginLocal(email: string, password: string): Promise<void> {
    console.log(email, password);
  }
}
