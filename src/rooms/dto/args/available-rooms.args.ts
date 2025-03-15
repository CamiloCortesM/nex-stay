import { ArgsType, Field } from '@nestjs/graphql';
import {
  IsDate,
  IsOptional,
  IsBoolean,
  Min,
  IsString,
  Max,
  IsNumber,
} from 'class-validator';
import { RoomType } from '@prisma/client';

@ArgsType()
export class AvailableRoomsArgs {
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

  @Field(() => RoomType, { nullable: true })
  @IsString()
  @IsOptional()
  roomType: RoomType;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  exteriorViewOnly?: boolean = false;

  @Field(() => Boolean, { nullable: true })
  @IsBoolean()
  @IsOptional()
  allInclusive?: boolean = false;
}
