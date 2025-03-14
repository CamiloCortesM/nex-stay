import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../interfaces/user.interface';
import { GqlContext } from '../interfaces/gql-context.interface';

export const GetUser = createParamDecorator(
  (data: keyof User | undefined, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const gqlContext = gqlCtx.getContext<GqlContext>();
    const request = gqlContext.req;
    const user = request.user as User;

    if (!user)
      throw new InternalServerErrorException('User not found in request');

    return data ? user[data] : user;
  },
);
