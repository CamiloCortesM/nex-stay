import { Field, ObjectType, Float } from '@nestjs/graphql';
import { Room } from '../models/room.model';

@ObjectType()
export class AvailableRoomResult {
  @Field(() => Room)
  room: Room;

  @Field(() => Number, { description: 'Number of days in the reservation' })
  daysCount: number;

  @Field(() => Number, { description: 'Number of nights in the reservation' })
  nightsCount: number;

  @Field(() => Float, { description: 'Base value applied to the reservation' })
  baseValue: number;

  @Field(() => Float, { description: 'Total weekend increment applied' })
  weekendIncrement: number;

  @Field(() => Float, { description: 'Total discount for days' })
  daysDiscount: number;

  @Field(() => Float, { description: 'Total for all inclusive' })
  allInclusiveTotal: number;

  @Field(() => Float, { description: 'Total price for the stay' })
  totalPrice: number;
}
