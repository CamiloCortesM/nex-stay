import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class AuthRegisterResponse {
  @Field(() => Boolean)
  userConfirmed: boolean;

  @Field(() => String)
  message: string;
}
