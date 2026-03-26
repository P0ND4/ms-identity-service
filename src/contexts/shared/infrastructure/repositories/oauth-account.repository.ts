import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TypeOrmRepository } from './base.repository';
import {
  OAuthAccount,
  OAuthProvider,
} from '../../domain/entities/oauth-account.entity';
import { IOAuthAccountRepository } from '../../domain/repositories/oauth-account.repository.interface';

@Injectable()
export class TypeOrmOAuthAccountRepository
  extends TypeOrmRepository<OAuthAccount>
  implements IOAuthAccountRepository
{
  constructor(
    @InjectRepository(OAuthAccount)
    repository: Repository<OAuthAccount>,
  ) {
    super(repository);
  }

  async findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccount | null> {
    return await this.repository.findOne({
      where: { provider, providerAccountId },
      relations: ['collaborator'],
    });
  }
}
