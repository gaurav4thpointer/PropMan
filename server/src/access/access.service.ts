import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns property IDs the user is allowed to access (view/edit).
   * USER/SUPER_ADMIN: owned properties only.
   */
  async getAccessiblePropertyIds(userId: string, role: UserRole): Promise<string[]> {
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      const owned = await this.prisma.property.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      return owned.map((p) => p.id);
    }
    return [];
  }

  async canAccessProperty(userId: string, role: UserRole, propertyId: string): Promise<boolean> {
    const ids = await this.getAccessiblePropertyIds(userId, role);
    return ids.includes(propertyId);
  }

  /** True if user is owner of the property. */
  async isPropertyOwner(userId: string, propertyId: string): Promise<boolean> {
    const p = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { ownerId: true },
    });
    return p?.ownerId === userId;
  }
}
