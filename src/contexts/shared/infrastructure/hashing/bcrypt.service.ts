import { Injectable } from '@nestjs/common';
import { IHashing } from '../../domain/interfaces/hashing.interface';
import * as bcrypt from 'bcrypt';

@Injectable()
export class BcryptService implements IHashing {
  private readonly saltRounds = 10;

  async hash(data: string | Buffer): Promise<string> {
    const salt = await bcrypt.genSalt(this.saltRounds);
    return bcrypt.hash(data, salt);
  }

  async compare(data: string | Buffer, encrypted: string): Promise<boolean> {
    return bcrypt.compare(data, encrypted);
  }
}
