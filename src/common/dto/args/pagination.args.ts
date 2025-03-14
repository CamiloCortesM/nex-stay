import { ArgsType, Field, Int } from '@nestjs/graphql';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { Transform } from 'class-transformer';

@ArgsType()
export class PaginationArgs {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Transform(({ value }): number => (value === null ? 0 : value))
  offset: number = 0;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Transform(({ value }): number => (value === null ? 10 : value))
  limit: number = 10;
}
