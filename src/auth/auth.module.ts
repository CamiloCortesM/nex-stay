import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AuthResolver } from './auth.resolver';
import { AwsCognitoService } from './aws-cognito.service';

import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
  providers: [AuthResolver, AwsCognitoService, LocalStrategy, JwtStrategy],
})
export class AuthModule {}
