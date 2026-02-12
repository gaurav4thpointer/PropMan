import { Injectable, ForbiddenException, NotFoundException, ConflictException } from '@nestjs/common';
import { ManagerOwnerStatus, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreateOwnerDto } from './dto/create-owner.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class OwnersService {
  constructor(
    private prisma: PrismaService,
    private accessService: AccessService,
  ) {}

  async create(userId: string, role: UserRole, dto: CreateOwnerDto) {
    if (role !== UserRole.PROPERTY_MANAGER) {
      throw new ForbiddenException('Only property managers can onboard owners');
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      if (existing.role !== UserRole.USER) {
        throw new ConflictException('User with this email exists but is not an owner');
      }
      const mo = await this.prisma.managerOwner.findUnique({
        where: { managerId_ownerId: { managerId: userId, ownerId: existing.id } },
      });
      if (mo?.status === ManagerOwnerStatus.ACTIVE) {
        return this.prisma.user.findUnique({
          where: { id: existing.id },
          select: { id: true, email: true, name: true, mobile: true, role: true, createdAt: true },
        });
      }
      await this.prisma.managerOwner.upsert({
        where: { managerId_ownerId: { managerId: userId, ownerId: existing.id } },
        create: { managerId: userId, ownerId: existing.id },
        update: { status: ManagerOwnerStatus.ACTIVE },
      });
      return this.prisma.user.findUnique({
        where: { id: existing.id },
        select: { id: true, email: true, name: true, mobile: true, role: true, createdAt: true },
      });
    }
    const hashed = await bcrypt.hash(dto.password, 10);
    const owner = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashed,
        name: dto.name,
        mobile: dto.mobile,
        role: UserRole.USER,
      },
      select: { id: true, email: true, name: true, mobile: true, role: true, createdAt: true },
    });
    await this.prisma.managerOwner.create({
      data: { managerId: userId, ownerId: owner.id },
    });
    return owner;
  }

  async findAll(
    userId: string,
    role: UserRole,
    pagination: { page?: number; limit?: number },
    search?: string,
  ) {
    if (role !== UserRole.PROPERTY_MANAGER) {
      throw new ForbiddenException('Only property managers can list owners');
    }
    const { page = 1, limit = 20 } = pagination;
    const where: { managerId: string; status: ManagerOwnerStatus; owner?: object } = {
      managerId: userId,
      status: ManagerOwnerStatus.ACTIVE,
    };
    if (search?.trim()) {
      const q = search.trim();
      where.owner = {
        OR: [
          { email: { contains: q, mode: 'insensitive' } },
          { name: { contains: q, mode: 'insensitive' } },
        ],
      };
    }
    const [list, total] = await Promise.all([
      this.prisma.managerOwner.findMany({
        where,
        include: { owner: { select: { id: true, email: true, name: true, mobile: true, role: true, createdAt: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.managerOwner.count({ where }),
    ]);
    const ownerIds = list.map((mo) => mo.owner.id);
    const ownerPropCounts = await this.prisma.property.groupBy({
      by: ['ownerId'],
      where: {
        ownerId: { in: ownerIds },
        managedProperties: { some: { managerId: userId } },
      },
      _count: { id: true },
    });
    const countMap = Object.fromEntries(ownerPropCounts.map((x) => [x.ownerId, x._count.id]));
    const data = list.map((mo) => ({ ...mo.owner, propertyCount: countMap[mo.owner.id] ?? 0 }));
    return paginatedResponse(data, total, page, limit);
  }

  async findById(userId: string, role: UserRole, ownerId: string) {
    if (role !== UserRole.PROPERTY_MANAGER) {
      throw new ForbiddenException('Only property managers can view owner details');
    }
    const canManage = await this.accessService.canManageOwner(userId, ownerId);
    if (!canManage) throw new NotFoundException('Owner not found');
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId, role: UserRole.USER },
      select: { id: true, email: true, name: true, mobile: true, role: true, createdAt: true },
    });
    if (!owner) throw new NotFoundException('Owner not found');
    const ownerProperties = await this.prisma.property.findMany({
      where: {
        ownerId,
        managedProperties: { some: { managerId: userId } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { ...owner, properties: ownerProperties };
  }

  async assignManagerToProperty(propertyId: string, managerId: string, userId: string, role: UserRole) {
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only property owners can assign managers');
    }
    const isOwner = await this.accessService.isPropertyOwner(userId, propertyId);
    if (!isOwner) throw new ForbiddenException('You do not own this property');
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new NotFoundException('Property not found');
    const canAssign = await this.accessService.canAssignManagerToProperty(property.ownerId, managerId, propertyId);
    if (!canAssign) {
      throw new ForbiddenException('Cannot assign this manager. Ensure ManagerOwner link exists and is ACTIVE.');
    }
    const manager = await this.prisma.user.findUnique({ where: { id: managerId }, select: { role: true } });
    if (!manager || manager.role !== UserRole.PROPERTY_MANAGER) {
      throw new NotFoundException('Manager not found');
    }
    await this.prisma.managedProperty.upsert({
      where: { propertyId_managerId: { propertyId, managerId } },
      create: { propertyId, managerId },
      update: {},
    });
    return { assigned: true };
  }

  async revokeManagerFromProperty(propertyId: string, managerId: string, userId: string, role: UserRole) {
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only property owners can revoke managers');
    }
    const isOwner = await this.accessService.isPropertyOwner(userId, propertyId);
    if (!isOwner) throw new ForbiddenException('You do not own this property');
    await this.prisma.managedProperty.deleteMany({
      where: { propertyId, managerId },
    });
    return { revoked: true };
  }

  async revokeManagerEntirely(managerId: string, userId: string, role: UserRole) {
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only property owners can revoke managers');
    }
    const mo = await this.prisma.managerOwner.findUnique({
      where: { managerId_ownerId: { managerId: managerId, ownerId: userId } },
    });
    if (!mo) throw new NotFoundException('Manager not found');
    await this.prisma.$transaction([
      this.prisma.managerOwner.update({
        where: { managerId_ownerId: { managerId: managerId, ownerId: userId } },
        data: { status: ManagerOwnerStatus.REVOKED },
      }),
      this.prisma.managedProperty.deleteMany({
        where: { managerId, property: { ownerId: userId } },
      }),
    ]);
    return { revoked: true };
  }

  async getManagersForOwner(userId: string, role: UserRole) {
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only owners can view their managers');
    }
    const list = await this.prisma.managerOwner.findMany({
      where: { ownerId: userId, status: ManagerOwnerStatus.ACTIVE },
      include: {
        manager: { select: { id: true, email: true, name: true } },
      },
    });
    const managers = list.map((mo) => ({
      ...mo.manager,
      managerOwnerId: mo.id,
    }));
    return { data: managers };
  }

  async getManagersForProperty(propertyId: string, userId: string, role: UserRole) {
    const canAccess = await this.accessService.canAccessProperty(userId, role, propertyId);
    if (!canAccess) throw new NotFoundException('Property not found');
    const isOwner = await this.accessService.isPropertyOwner(userId, propertyId);
    if (!isOwner) throw new ForbiddenException('Only property owners can view managers for this property');
    const list = await this.prisma.managedProperty.findMany({
      where: { propertyId },
      include: { manager: { select: { id: true, email: true, name: true } } },
    });
    return { data: list.map((mp) => mp.manager) };
  }
}
