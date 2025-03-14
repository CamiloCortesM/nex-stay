import { Request } from 'express';
import { AuthResponse } from '../types/auth.type';

export interface GqlContext {
  req: Request;
  user?: AuthResponse;
}
