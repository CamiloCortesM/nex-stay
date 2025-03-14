import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { passportJwtSecret } from 'jwks-rsa';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { envs } from 'src/config/envs';
import { CognitoPayload } from '../interfaces/jwt-response.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer: envs.awsCognitoAuthority,
      algorithms: ['RS256'],
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: envs.awsCognitoAuthority + '/.well-known/jwks.json',
      }),
    });
  }

  validate(payload: CognitoPayload) {
    return { idUser: payload.sub };
  }
}
