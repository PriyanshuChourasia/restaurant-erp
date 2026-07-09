import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { IActiveUser } from '../interfaces/active-user.interface';

export const CurrentUser = createParamDecorator(
  (data: keyof IActiveUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user: IActiveUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
