import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthResponse } from '../types/auth.type';
import { GqlExecutionContext } from '@nestjs/graphql';
import { GqlContext } from '../interfaces/gql-context.interface';

export const GetAuth = createParamDecorator(
  (data: keyof AuthResponse | undefined, ctx: ExecutionContext) => {
    const gqlCtx = GqlExecutionContext.create(ctx);
    const gqlContext = gqlCtx.getContext<GqlContext>();
    const user = gqlContext.user as AuthResponse;

    if (!user)
      throw new InternalServerErrorException('User not found in request');

    return data ? user[data] : user;
  },
);
