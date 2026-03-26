import { OAuthAccount, OAuthProvider } from '../entities/oauth-account.entity';
import { IRepository } from './repository.interface';

export abstract class IOAuthAccountRepository extends IRepository<OAuthAccount> {
  abstract findByProviderAccount(
    provider: OAuthProvider,
    providerAccountId: string,
  ): Promise<OAuthAccount | null>;
}
