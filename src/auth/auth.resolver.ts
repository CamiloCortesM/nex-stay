import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';

import { AwsCognitoService } from './aws-cognito.service';
import { GetAuth } from './decorators/get-auth.decorator';
import { GqlAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterInput } from './dto/input/register.input';
import { LoginInput } from './dto/input/login.input';
import { ChangePasswordInput } from './dto/input/change-password.input';
import { ForgotPasswordInput } from './dto/input/forgot-password.type';
import { ConfirmPasswordInput } from './dto/input/confirm-password.input';
import { AuthResponse } from './types/auth.type';
import { AuthRegisterResponse } from './types/auth-register.type';
import { ForgotPaswordResponse } from './types/forgot-password.type';
import { StandardResponseAuth } from './types/standar-response-auth';

/**
 * Handles all authentication operations via GraphQL
 * Delegates actual implementation to AWS Cognito service
 */
@Resolver()
export class AuthResolver {
  constructor(private readonly awsCognitoService: AwsCognitoService) {}

  /**
   * Creates new user accounts
   * Returns detailed response for client-side handling of confirmation flow
   */
  @Mutation(() => AuthRegisterResponse, { name: 'signup' })
  signup(
    @Args('signupInput') authRegisterUser: RegisterInput,
  ): Promise<AuthRegisterResponse> {
    return this.awsCognitoService.registerUser(authRegisterUser);
  }

  /**
   * Authenticates users and returns JWT tokens
   * Note: Although LoginInput is declared, credentials are extracted by GqlAuthGuard
   */
  @Mutation(() => AuthResponse, { name: 'login' })
  @UseGuards(GqlAuthGuard)
  login(
    @Args('loginUserInput') _: LoginInput,
    @GetAuth() authResponse: AuthResponse,
  ): AuthResponse {
    return authResponse;
  }

  /**
   * Updates user password for authenticated users
   * Requires valid JWT token for authorization
   */
  @Mutation(() => StandardResponseAuth, { name: 'changePassword' })
  @UseGuards(JwtAuthGuard)
  async changePassword(
    @Args('changePasswordInput') changePasswordInput: ChangePasswordInput,
  ): Promise<StandardResponseAuth> {
    return this.awsCognitoService.changeUserPassword(changePasswordInput);
  }

  /**
   * Initiates password reset process
   * Triggers verification code delivery to user's email
   */
  @Mutation(() => ForgotPaswordResponse, { name: 'forgotPassword' })
  async forgotPassword(
    @Args('forgotPasswordInput') forgotPasswordInput: ForgotPasswordInput,
  ): Promise<ForgotPaswordResponse> {
    return this.awsCognitoService.forgotUserPassword(forgotPasswordInput);
  }

  /**
   * Completes password reset with verification code
   * Must be called after forgotPassword mutation
   */
  @Mutation(() => StandardResponseAuth, { name: 'confirmPassword' })
  async confirmPassword(
    @Args('confirmPasswordInput') confirmPasswordInput: ConfirmPasswordInput,
  ): Promise<StandardResponseAuth> {
    return this.awsCognitoService.confirmUserPassword(confirmPasswordInput);
  }
}
