import { Injectable } from '@nestjs/common';
import { ManagerOwnerStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccessService {
  constructor(private prisma: PrismaService) {}

  /**
   * Returns property IDs the user is allowed to access (view/edit).
   * USER/SUPER_ADMIN: owned properties only.
   * PROPERTY_MANAGER: properties in ManagedProperty where managerId = userId, restricted to owners where ManagerOwner is ACTIVE.
   */
  async getAccessiblePropertyIds(userId: string, role: UserRole): Promise<string[]> {
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      const owned = await this.prisma.property.findMany({
        where: { ownerId: userId },
        select: { id: true },
      });
      return owned.map((p) => p.id);
    }
    if (role === UserRole.PROPERTY_MANAGER) {
      const managed = await this.prisma.managedProperty.findMany({
        where: {
          managerId: userId,
          property: {
            archivedAt: null,
            owner: {
              managedBy: {
                some: { managerId: userId, status: ManagerOwnerStatus.ACTIVE },
              },
            },
          },
        },
        select: { propertyId: true },
      });
      return managed.map((m) => m.propertyId);
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

  /** Owner IDs the manager can manage (for create flows). From ManagerOwner where status ACTIVE. */
  async getManagedOwnerIds(userId: string): Promise<string[]> {
    const list = await this.prisma.managerOwner.findMany({
      where: { managerId: userId, status: ManagerOwnerStatus.ACTIVE },
      select: { ownerId: true },
    });
    return list.map((m) => m.ownerId);
  }

  /** True if ManagerOwner(managerId, ownerId, ACTIVE) exists. */
  async canManageOwner(managerId: string, ownerId: string): Promise<boolean> {
    const mo = await this.prisma.managerOwner.findUnique({
      where: { managerId_ownerId: { managerId, ownerId } },
      select: { status: true },
    });
    return mo?.status === ManagerOwnerStatus.ACTIVE;
  }

  /** Owner can assign manager to property if they own property and ManagerOwner ACTIVE. */
  async canAssignManagerToProperty(ownerId: string, managerId: string, propertyId: string): Promise<boolean> {
    const [property, mo] = await Promise.all([
      this.prisma.property.findUnique({ where: { id: propertyId }, select: { ownerId: true } }),
      this.prisma.managerOwner.findUnique({
        where: { managerId_ownerId: { managerId, ownerId } },
        select: { status: true },
      }),
    ]);
    return property?.ownerId === ownerId && mo?.status === ManagerOwnerStatus.ACTIVE;
  }
}
