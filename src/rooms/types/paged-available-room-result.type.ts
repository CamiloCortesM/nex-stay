import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AvailableRoomResult } from './available-room-result.type';

@ObjectType()
export class PagedAvailableRoomResult {
  @Field(() => [AvailableRoomResult])
  items: AvailableRoomResult[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  offset: number;

  @Field(() => Int)
  limit: number;

  @Field(() => Boolean)
  hasMore: boolean;
}
