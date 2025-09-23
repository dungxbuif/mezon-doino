import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';

import { ContextProvider } from 'src/common/providers';
import { AccessTokenPayload } from 'src/common/types';
import { AppRequest } from 'src/common/types/app-request.type';

@Injectable()
export class AuthUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<AppRequest>();

    const user = <AccessTokenPayload>request.user;
    ContextProvider.setAuthUser(user);

    return next.handle();
  }
}
