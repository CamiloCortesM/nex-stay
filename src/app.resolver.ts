import { Resolver, Query } from '@nestjs/graphql';

@Resolver()
export class AppResolver {
  constructor() {}

  @Query(() => String, { name: 'hello' })
  hello() {
    return 'Hello World!';
  }
}
