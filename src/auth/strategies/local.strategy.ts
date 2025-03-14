import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AwsCognitoService } from '../aws-cognito.service';
import { AuthResponse } from '../types/auth.type';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private awsCognitoService: AwsCognitoService) {
    super({ usernameField: 'email' });
  }

  async validate(email: string, password: string): Promise<AuthResponse> {
    try {
      const user = await this.awsCognitoService.authenticateUser({
        email,
        password,
      });

      if (!user) {
        throw new UnauthorizedException('invalid credentials');
      }

      return user;
    } catch {
      throw new UnauthorizedException('invalid credentials');
    }
  }
}
