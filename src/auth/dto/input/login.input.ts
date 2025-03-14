import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, Matches } from 'class-validator';

@InputType()
export class LoginInput {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[$&+,:;=?@#|'<>.^*()%!-])[A-Za-z\d@$&+,:;=?@#|'<>.^*()%!-]{8,}$/,
    { message: 'invalid password' },
  )
  password: string;
}
