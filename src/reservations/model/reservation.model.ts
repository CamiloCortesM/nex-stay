import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Room } from 'src/rooms/model/room.model';

@ObjectType()
export class Reservation {
  @Field(() => ID)
  id: string;

  @Field(() => Date)
  checkIn: Date;

  @Field(() => Date)
  checkOut: Date;

  @Field(() => Number)
  people: number;

  @Field(() => Number)
  roomId: number;

  @Field(() => String)
  userId: string;

  @Field(() => Number)
  totalPrice: number;

  @Field(() => String)
  status: string;

  @Field(() => Boolean)
  allInclusive: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Room)
  room: Room;
}
