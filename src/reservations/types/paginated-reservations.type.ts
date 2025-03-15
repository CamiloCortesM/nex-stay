import { Field, ObjectType } from '@nestjs/graphql';
import { Reservation } from '../models/reservation.model';

@ObjectType()
export class PaginatedReservations {
  @Field(() => [Reservation], { description: 'Past reservations' })
  past: Reservation[];

  @Field(() => [Reservation], { description: 'Current reservations' })
  current: Reservation[];

  @Field(() => [Reservation], { description: 'Future reservations' })
  future: Reservation[];

  @Field(() => Number, { description: 'Total count of past reservations' })
  totalPast: number;

  @Field(() => Number, { description: 'Total count of current reservations' })
  totalCurrent: number;

  @Field(() => Number, { description: 'Total count of future reservations' })
  totalFuture: number;
}
