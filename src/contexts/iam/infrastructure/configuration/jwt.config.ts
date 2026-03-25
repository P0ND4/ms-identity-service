import { JwtModuleOptions } from '@nestjs/jwt';
import environment from 'src/config/environment.config';

export const jwtConfig = async (): Promise<JwtModuleOptions> => {
  const env = await environment();

  return {
    secret: env.JWT_SECRET,
    signOptions: { expiresIn: env.JWT_EXPIRES_IN as any },
  };
};
