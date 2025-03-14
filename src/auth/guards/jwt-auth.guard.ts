import { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { GqlContext } from '../interfaces/gql-context.interface';

export class JwtAuthGuard extends AuthGuard('jwt') {
  //! Override
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();
    const request = gqlContext.req;
    return request;
  }
}
