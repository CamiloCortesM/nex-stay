import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { LoginInput } from '../dto/input/login.input';
import { GqlContext } from '../interfaces/gql-context.interface';

@Injectable()
export class GqlAuthGuard extends AuthGuard('local') {
  constructor() {
    super();
  }
  //! Override
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    const gqlContext = ctx.getContext<GqlContext>();
    const request = gqlContext.req;
    const args = ctx.getArgs<{ loginUserInput: LoginInput }>();

    request.body = args.loginUserInput;
    return request;
  }
}
