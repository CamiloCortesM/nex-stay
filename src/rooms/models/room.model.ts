import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Reservation } from 'src/reservations/models/reservation.model';

@ObjectType()
export class Room {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  type: string;

  @Field(() => String)
  view: string;

  @Field(() => Int)
  basePrice: number;

  @Field(() => Int)
  maxCapacity: number;

  @Field(() => Boolean)
  isDeleted: boolean;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => [Reservation], { nullable: true })
  reservations?: Reservation[];
}
