import { InputType, Field, registerEnumType } from '@nestjs/graphql';
import { RoomType } from '@prisma/client';
import { IsBoolean, IsDate, IsEnum, IsNumber, Max, Min } from 'class-validator';

registerEnumType(RoomType, {
  name: 'RoomType',
  description: 'The available room types',
});

@InputType()
export class CreateReservationInput {
  @Field(() => Date)
  @IsDate()
  checkIn: Date;

  @Field(() => Date)
  @IsDate()
  checkOut: Date;

  @Field(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4)
  people: number;

  @Field(() => RoomType)
  @IsEnum(RoomType)
  roomType: RoomType;

  @Field(() => Boolean)
  @IsBoolean()
  allInclusive: boolean;
}
