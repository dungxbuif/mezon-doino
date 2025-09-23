import { Request } from 'express';

import { AccessTokenPayload } from './access-token-payload.type';

export type AppRequest = {
  user: AccessTokenPayload;
} & Request;
