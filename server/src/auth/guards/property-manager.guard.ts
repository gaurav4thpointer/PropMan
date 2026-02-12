import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';

@Injectable()
export class PropertyManagerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as { role?: string } | undefined;
    if (!user || user.role !== UserRole.PROPERTY_MANAGER) {
      throw new ForbiddenException('Property manager access required');
    }
    return true;
  }
}
