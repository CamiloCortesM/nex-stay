import 'dotenv/config';
import * as joi from 'joi';
import { EnvVars } from './interfaces';

const envsSchema = joi
  .object<EnvVars>({
    PORT: joi.number().required().default(3005),

    AWS_COGNITO_CLIENT_ID: joi.string().required(),
    AWS_COGNITO_USER_POOL_ID: joi.string().required(),
    AWS_COGNITO_AUTHORITY: joi.string().required(),
  })
  .unknown(true);

const validateEnv = (): EnvVars => {
  try {
    const validationResult = envsSchema.validate({
      ...process.env,
    });

    if (validationResult.error) {
      throw new Error(
        `Environment validation error: ${validationResult.error.message}`,
      );
    }

    return validationResult.value;
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Config initialization error: ${errorMessage}`);
  }
};

const validatedEnv = validateEnv();

export const envs = {
  port: validatedEnv.PORT,
  awsCognitoClientId: validatedEnv.AWS_COGNITO_CLIENT_ID,
  awsCognitoUserPoolId: validatedEnv.AWS_COGNITO_USER_POOL_ID,
  awsCognitoAuthority: validatedEnv.AWS_COGNITO_AUTHORITY,
} as const;
