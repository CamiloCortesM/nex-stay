import { AwsCognitoService } from './aws-cognito.service';
import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  IAuthenticationCallback,
  CognitoAccessToken,
  CognitoIdToken,
  CognitoRefreshToken,
} from 'amazon-cognito-identity-js';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ConfirmPasswordInput,
} from './dto/input';
import { ForgotPaswordResponse } from './types';

// Complete mock of Cognito dependencies
jest.mock('amazon-cognito-identity-js', () => ({
  CognitoUserPool: jest.fn(),
  CognitoUser: jest.fn(),
  AuthenticationDetails: jest.fn(),
  CognitoUserAttribute: jest.fn(),
}));

interface ForgotPasswordCallback {
  onSuccess: (data: any) => void;
  onFailure: (err: Error) => void;
}

interface ConfirmPasswordCallback {
  onSuccess: () => void;
  onFailure: (err: Error) => void;
}

const mockCognitoUserPool = CognitoUserPool as jest.MockedClass<
  typeof CognitoUserPool
>;
const mockCognitoUser = CognitoUser as jest.MockedClass<typeof CognitoUser>;
const mockAuthenticationDetails = AuthenticationDetails as jest.MockedClass<
  typeof AuthenticationDetails
>;
const mockCognitoUserAttribute = CognitoUserAttribute as jest.MockedClass<
  typeof CognitoUserAttribute
>;

describe('AwsCognitoService', () => {
  let service: AwsCognitoService;

  // Base configuration of mocks
  const mockUserPoolInstance = {
    signUp: jest.fn(),
  };

  const mockUserInstance = {
    authenticateUser: jest.fn(),
    changePassword: jest.fn(),
    forgotPassword: jest.fn(),
    confirmPassword: jest.fn(),
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Configure base implementations of mocks
    mockCognitoUserPool.mockImplementation(
      () => mockUserPoolInstance as unknown as CognitoUserPool,
    );

    mockCognitoUser.mockImplementation(
      () => mockUserInstance as unknown as CognitoUser,
    );

    mockAuthenticationDetails.mockImplementation(
      (data) => ({ ...data }) as unknown as AuthenticationDetails,
    );

    mockCognitoUserAttribute.mockImplementation(
      (data) => ({ ...data }) as unknown as CognitoUserAttribute,
    );

    service = new AwsCognitoService();
  });

  describe('registerUser', () => {
    it('should register a user successfully', async () => {
      // Mock successful response
      mockUserPoolInstance.signUp.mockImplementation(
        (
          email,
          password,
          attributes,
          _,
          callback: (err: Error | null, data: any) => void,
        ) => {
          callback(null, {
            userConfirmed: false,
            user: { getUsername: () => email as string },
          });
        },
      );

      const input: RegisterInput = {
        email: 'test@example.com',
        password: 'P@ssw0rd!123',
        name: 'Test User',
      };

      const result = await service.registerUser(input);

      expect(mockCognitoUserPool).toHaveBeenCalled();
      expect(mockUserPoolInstance.signUp).toHaveBeenCalledWith(
        input.email,
        input.password,
        [expect.objectContaining({ Name: 'name', Value: input.name })],
        [],
        expect.any(Function),
      );
      expect(result).toEqual({
        userConfirmed: false,
        message: `User ${input.email} has been created`,
      });
    });

    it('should handle registration errors', async () => {
      const error = new Error('Registration error');
      mockUserPoolInstance.signUp.mockImplementation((...args) => {
        const callback = args[4] as (err: Error | null, data: any) => void;
        callback(error, null);
      });

      const input: RegisterInput = {
        email: 'test@example.com',
        password: 'P@ssw0rd!123',
        name: 'Test User',
      };

      await expect(service.registerUser(input)).rejects.toThrow(error);
    });
  });

  describe('authenticateUser', () => {
    it('should authenticate successfully', async () => {
      // Mock successful authentication
      mockUserInstance.authenticateUser.mockImplementation(
        (
          authDetails: AuthenticationDetails,
          callbacks: IAuthenticationCallback,
        ) => {
          callbacks.onSuccess({
            getAccessToken: () => ({
              getJwtToken: () => 'access_token',
              payload: {},
              getExpiration: () => 0,
              getIssuedAt: () => 0,
              decodePayload: () => ({}),
            }),
            getRefreshToken: () => ({ getToken: () => 'refresh_token' }),
            getIdToken: () => ({
              getJwtToken: () => 'id_token',
              payload: {},
              getExpiration: () => 0,
              getIssuedAt: () => 0,
              decodePayload: () => ({}),
            }),
            isValid: () => true,
          });
        },
      );

      const input: LoginInput = {
        email: 'test@example.com',
        password: 'P@ssw0rd!',
      };

      const result = await service.authenticateUser(input);

      expect(mockCognitoUser).toHaveBeenCalledWith({
        Username: input.email,
        Pool: mockUserPoolInstance,
      });
      expect(mockAuthenticationDetails).toHaveBeenCalledWith({
        Username: input.email,
        Password: input.password,
      });
      expect(result).toEqual({
        accessToken: 'access_token',
        refreshToken: 'refresh_token',
      });
    });

    it('should handle authentication errors', async () => {
      const error = new Error('Authentication error');
      mockUserInstance.authenticateUser.mockImplementation(
        (
          authDetails: AuthenticationDetails,
          callbacks: IAuthenticationCallback,
        ) => {
          callbacks.onFailure(error);
        },
      );

      const input: LoginInput = {
        email: 'test@example.com',
        password: 'P@ssw0rd!',
      };

      await expect(service.authenticateUser(input)).rejects.toThrow(error);
    });
  });

  describe('changeUserPassword', () => {
    it('should change password successfully', async () => {
      // Mock successful complete flow
      mockUserInstance.authenticateUser.mockImplementation(
        (
          authDetails: AuthenticationDetails,
          callbacks: IAuthenticationCallback,
        ) => {
          callbacks.onSuccess({
            getIdToken: function (): CognitoIdToken {
              throw new Error('Function not implemented.');
            },
            getRefreshToken: function (): CognitoRefreshToken {
              throw new Error('Function not implemented.');
            },
            getAccessToken: function (): CognitoAccessToken {
              throw new Error('Function not implemented.');
            },
            isValid: function (): boolean {
              throw new Error('Function not implemented.');
            },
          });
        },
      );

      mockUserInstance.changePassword.mockImplementation(
        (
          oldPass: string,
          newPass: string,
          callback: (err: Error | null, result: string) => void,
        ) => {
          callback(null, 'SUCCESS');
        },
      );

      const input: ChangePasswordInput = {
        email: 'test@example.com',
        currentPassword: 'oldPass',
        newPassword: 'newPass',
      };

      const result = await service.changeUserPassword(input);

      expect(mockUserInstance.authenticateUser).toHaveBeenCalled();
      expect(mockUserInstance.changePassword).toHaveBeenCalledWith(
        input.currentPassword,
        input.newPassword,
        expect.any(Function),
      );
      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('forgotUserPassword', () => {
    it('should initiate password recovery', async () => {
      const mockResponse: ForgotPaswordResponse = {
        CodeDeliveryDetails: {
          AttributeName: 'email',
          DeliveryMedium: 'EMAIL',
          Destination: 't***@e***.com',
        },
      };

      mockUserInstance.forgotPassword.mockImplementation(
        (callbacks: ForgotPasswordCallback) => {
          callbacks.onSuccess(mockResponse);
        },
      );

      const input: ForgotPasswordInput = {
        email: 'test@example.com',
      };

      const result = await service.forgotUserPassword(input);

      expect(mockUserInstance.forgotPassword).toHaveBeenCalled();
      expect(result).toEqual(mockResponse);
    });
  });

  describe('confirmUserPassword', () => {
    it('should confirm new password', async () => {
      mockUserInstance.confirmPassword.mockImplementation(
        (code: string, newPass: string, callbacks: ConfirmPasswordCallback) => {
          callbacks.onSuccess();
        },
      );

      const input: ConfirmPasswordInput = {
        email: 'test@example.com',
        confirmationCode: '123456',
        newPassword: 'N3wP@ss!',
      };

      const result = await service.confirmUserPassword(input);

      expect(mockUserInstance.confirmPassword).toHaveBeenCalledWith(
        input.confirmationCode,
        input.newPassword,
        expect.any(Object),
      );
      expect(result).toEqual({ status: 'success' });
    });
  });
});
