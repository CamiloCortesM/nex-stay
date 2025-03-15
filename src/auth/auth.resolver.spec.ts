/* eslint-disable @typescript-eslint/unbound-method */
import { Test } from '@nestjs/testing';
import { AuthResolver } from './auth.resolver';
import { AwsCognitoService } from './aws-cognito.service';
import {
  ChangePasswordInput,
  ConfirmPasswordInput,
  ForgotPasswordInput,
  LoginInput,
  RegisterInput,
} from './dto/input';
import {
  AuthResponse,
  AuthRegisterResponse,
  ForgotPaswordResponse,
  StandardResponseAuth,
} from './types';

// 1. Enhanced mock with base implementations
class MockAwsCognitoService {
  registerUser = jest.fn<Promise<AuthRegisterResponse>, [RegisterInput]>();
  changeUserPassword = jest.fn<
    Promise<StandardResponseAuth>,
    [ChangePasswordInput]
  >();
  forgotUserPassword = jest.fn<
    Promise<ForgotPaswordResponse>,
    [ForgotPasswordInput]
  >();
  confirmUserPassword = jest.fn<
    Promise<StandardResponseAuth>,
    [ConfirmPasswordInput]
  >();
}

const mockAuthResponse: AuthResponse = {
  accessToken: 'token',
  refreshToken: 'refresh-token',
};

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let awsCognitoService: MockAwsCognitoService;

  beforeEach(async () => {
    // 2. Correct mock instantiation
    const mockService = new MockAwsCognitoService();

    const module = await Test.createTestingModule({
      providers: [
        AuthResolver,
        {
          provide: AwsCognitoService,
          useValue: mockService, // Use the mock instance
        },
      ],
    }).compile();

    resolver = module.get<AuthResolver>(AuthResolver);
    awsCognitoService = module.get<AwsCognitoService>(
      AwsCognitoService,
    ) as unknown as MockAwsCognitoService;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('signup', () => {
    it('should register a user correctly', async () => {
      const mockRegisterInput: RegisterInput = {
        email: 'test@example.com',
        password: 'P@ssw0rd!1234',
        name: 'Test User',
      };

      const mockResponse: AuthRegisterResponse = {
        userConfirmed: false,
        message: 'User registered',
      };

      awsCognitoService.registerUser.mockResolvedValue(mockResponse);

      const result = await resolver.signup(mockRegisterInput);

      expect(awsCognitoService.registerUser).toHaveBeenCalledWith(
        mockRegisterInput,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('login', () => {
    it('should return the authentication response', () => {
      const mockLoginInput: LoginInput = {
        email: 'test@example.com',
        password: 'P@ssw0rd!',
      };

      const result = resolver.login(mockLoginInput, mockAuthResponse);

      expect(result).toEqual(mockAuthResponse);
    });

    it('should use GqlAuthGuard', () => {
      type GuardMetadata = Array<{ name: string }>;

      // Create a properly typed reference to avoid Function type warning
      const loginMethod: (
        this: void,
        loginInput: LoginInput,
        authResponse: AuthResponse,
      ) => AuthResponse = AuthResolver.prototype.login;

      const metadata = Reflect.getMetadata(
        '__guards__',
        loginMethod,
      ) as GuardMetadata;

      expect(metadata[0].name).toBe('GqlAuthGuard');
    });
  });

  describe('changePassword', () => {
    it('should change the password correctly', async () => {
      const mockChangePasswordInput: ChangePasswordInput = {
        currentPassword: 'oldPass',
        email: 'test@google.com',
        newPassword: 'newPass',
      };

      const mockResponse: StandardResponseAuth = {
        status: 'SUCCESS',
      };

      // 4. Use the correct service instance
      awsCognitoService.changeUserPassword.mockResolvedValue(mockResponse);

      const result = await resolver.changePassword(mockChangePasswordInput);

      expect(awsCognitoService.changeUserPassword).toHaveBeenCalledWith(
        mockChangePasswordInput,
      );
      expect(result).toEqual(mockResponse);
    });

    it('should use JwtAuthGuard', () => {
      // Define proper type for guard metadata
      type GuardMetadata = Array<{ name: string }>;

      // Create a properly typed reference to avoid unbound method warning
      const changePasswordMethod: (this: void, ...args: any[]) => any =
        AuthResolver.prototype.changePassword;
      const metadata = Reflect.getMetadata(
        '__guards__',
        changePasswordMethod,
      ) as GuardMetadata;

      expect(metadata[0].name).toBe('JwtAuthGuard');
    });
  });

  describe('forgotPassword', () => {
    it('should initiate the recovery process', async () => {
      const mockForgotPasswordInput: ForgotPasswordInput = {
        email: 'test@example.com',
      };

      const mockResponse: ForgotPaswordResponse = {
        CodeDeliveryDetails: {
          AttributeName: 'email',
          DeliveryMedium: 'EMAIL',
          Destination: 'test',
        },
      };

      awsCognitoService.forgotUserPassword.mockResolvedValue(mockResponse);

      const result = await resolver.forgotPassword(mockForgotPasswordInput);

      expect(awsCognitoService.forgotUserPassword).toHaveBeenCalledWith(
        mockForgotPasswordInput,
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('confirmPassword', () => {
    it('should confirm the new password', async () => {
      const mockConfirmPasswordInput: ConfirmPasswordInput = {
        email: 'test@google.com',
        confirmationCode: '123456',
        newPassword: 'newPass',
      };

      const mockResponse: StandardResponseAuth = {
        status: 'SUCCESS',
      };

      awsCognitoService.confirmUserPassword.mockResolvedValue(mockResponse);

      const result = await resolver.confirmPassword(mockConfirmPasswordInput);

      expect(awsCognitoService.confirmUserPassword).toHaveBeenCalledWith(
        mockConfirmPasswordInput,
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
