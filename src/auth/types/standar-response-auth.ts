import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class StandardResponseAuth {
  @Field(() => String)
  status: string;
}
