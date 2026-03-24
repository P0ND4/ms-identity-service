export abstract class IAuthUseCase {
  abstract loginLocal(email: string, password: string): Promise<void>;
}
