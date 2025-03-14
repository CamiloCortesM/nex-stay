import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class CodeDeliveryDetails {
  @Field(() => String)
  AttributeName: string;

  @Field(() => String)
  DeliveryMedium: string;

  @Field(() => String)
  Destination: string;
}

@ObjectType()
export class ForgotPaswordResponse {
  @Field(() => CodeDeliveryDetails)
  CodeDeliveryDetails: CodeDeliveryDetails;
}
