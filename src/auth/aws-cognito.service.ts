import { Injectable } from '@nestjs/common';
import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserAttribute,
  CognitoUserPool,
  IAuthenticationCallback,
} from 'amazon-cognito-identity-js';

import { LoginInput } from './dto/input/login.input';
import { RegisterInput } from './dto/input/register.input';
import { ChangePasswordInput } from './dto/input/change-password.input';
import { ForgotPasswordInput } from './dto/input/forgot-password.type';
import { ConfirmPasswordInput } from './dto/input/confirm-password.input';
import { AuthResponse } from './types/auth.type';
import { ForgotPaswordResponse } from './types/forgot-password.type';
import { AuthRegisterResponse } from './types/auth-register.type';
import { StandardResponseAuth } from './types/standar-response-auth';
import { envs } from '../config/envs';

/**
 * Service responsible for AWS Cognito integration
 * Implements Single Responsibility Principle by focusing only on authentication operations
 */
@Injectable()
export class AwsCognitoService {
  private userPool: CognitoUserPool;

  constructor() {
    // Initialize Cognito connection once to improve performance
    this.userPool = new CognitoUserPool({
      UserPoolId: envs.awsCognitoUserPoolId,
      ClientId: envs.awsCognitoClientId,
    });
  }

  /**
   * Registers a new user in Cognito
   * Handles attribute configuration and user creation
   */
  async registerUser(
    registerInput: RegisterInput,
  ): Promise<AuthRegisterResponse> {
    const { name, email, password } = registerInput;

    // Promise wrapper provides better error handling and async/await compatibility
    return new Promise((resolve, reject) => {
      this.userPool.signUp(
        email,
        password,
        [
          // Cognitive attributes are applied as an array for extensibility
          new CognitoUserAttribute({
            Name: 'name',
            Value: name,
          }),
        ],
        [], // No validation data needed
        (err, result) => {
          if (!result) {
            // Enhanced error handling with type safety
            reject(
              err instanceof Error ? err : new Error('Registration failed'),
            );
          } else {
            resolve({
              userConfirmed: result.userConfirmed,
              message: `User ${result.user.getUsername()} has been created`,
            });
          }
        },
      );
    });
  }

  /**
   * Authenticates a user against Cognito
   * Returns tokens required for subsequent authenticated API calls
   */
  async authenticateUser(loginUserInput: LoginInput): Promise<AuthResponse> {
    const { email, password } = loginUserInput;

    // Creating user data object for Cognito
    const userData = this.createCognitoUserData(email);

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const userCognito = new CognitoUser(userData);

    // Wrapping callback-based API in a Promise for cleaner async usage
    return new Promise((resolve, reject) => {
      userCognito.authenticateUser(authenticationDetails, {
        onSuccess: (result) => {
          resolve({
            accessToken: result.getAccessToken().getJwtToken(),
            refreshToken: result.getRefreshToken().getToken(),
          });
        },
        onFailure: (err: Error) => {
          reject(err);
        },
      } as IAuthenticationCallback);
    });
  }

  /**
   * Updates user password after successful authentication
   * Two-step process: authenticate first, then change password
   */
  async changeUserPassword(
    changePasswordInput: ChangePasswordInput,
  ): Promise<StandardResponseAuth> {
    const { email, currentPassword, newPassword } = changePasswordInput;

    const userData = this.createCognitoUserData(email);

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: currentPassword,
    });

    const userCognito = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      userCognito.authenticateUser(authenticationDetails, {
        onSuccess: () => {
          userCognito.changePassword(currentPassword, newPassword, (err) => {
            if (err) {
              reject(
                err instanceof Error
                  ? err
                  : new Error('Change password failed'),
              );
              return;
            }
            resolve({ status: 'success' });
          });
        },
        onFailure: (err: Error) => {
          reject(err);
        },
      } as IAuthenticationCallback);
    });
  }

  /**
   * Initiates password recovery flow
   * Triggers email with verification code to user
   */
  async forgotUserPassword(
    forgotPasswordInput: ForgotPasswordInput,
  ): Promise<ForgotPaswordResponse> {
    const { email } = forgotPasswordInput;

    const userData = this.createCognitoUserData(email);
    const userCognito = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      userCognito.forgotPassword({
        onSuccess: (result: ForgotPaswordResponse) => {
          resolve(result);
        },
        onFailure: (err: Error) => {
          reject(err);
        },
      });
    });
  }

  /**
   * Completes password reset with verification code
   * Final step of the forgot password flow
   */
  async confirmUserPassword(
    confirmPasswordInput: ConfirmPasswordInput,
  ): Promise<StandardResponseAuth> {
    const { email, confirmationCode, newPassword } = confirmPasswordInput;

    const userData = this.createCognitoUserData(email);
    const userCognito = new CognitoUser(userData);

    return new Promise((resolve, reject) => {
      userCognito.confirmPassword(confirmationCode, newPassword, {
        onSuccess: () => {
          resolve({ status: 'success' });
        },
        onFailure: (err: Error) => {
          reject(err);
        },
      });
    });
  }

  /**
   * Helper method to create Cognito user data object
   * Extracted to follow DRY principle and reduce code duplication
   */
  private createCognitoUserData(username: string) {
    return {
      Username: username,
      Pool: this.userPool,
    };
  }
}
