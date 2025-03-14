import { Field, InputType } from '@nestjs/graphql';
import { IsEmail, IsString, Matches } from 'class-validator';

@InputType()
export class ConfirmPasswordInput {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsString()
  confirmationCode: string;

  @Field(() => String)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d@$&+,:;=?@#|'<>.^*()%!-]{8,}$/,
    { message: 'invalid password' },
  )
  newPassword: string;
}
