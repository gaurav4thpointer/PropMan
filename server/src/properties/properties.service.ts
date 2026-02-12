import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private prisma: PrismaService,
    private accessService: AccessService,
  ) {}

  async create(userId: string, role: UserRole, dto: CreatePropertyDto) {
    let ownerId: string;
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      ownerId = userId;
    } else if (role === UserRole.PROPERTY_MANAGER) {
      const providedOwnerId = dto.ownerId;
      if (!providedOwnerId) throw new ForbiddenException('Property manager must specify ownerId');
      const canManage = await this.accessService.canManageOwner(userId, providedOwnerId);
      if (!canManage) throw new ForbiddenException('You cannot create properties for this owner');
      ownerId = providedOwnerId;
    } else {
      throw new ForbiddenException('Only owners or property managers can create properties');
    }
    const { ownerId: _omit, ...propertyData } = dto;
    const property = await this.prisma.property.create({
      data: {
        ...propertyData,
        ownerId,
        status: propertyData.status ?? 'VACANT',
      },
    });
    if (role === UserRole.PROPERTY_MANAGER) {
      await this.prisma.managedProperty.create({
        data: { propertyId: property.id, managerId: userId },
      });
    }
    return property;
  }

  async findAll(
    userId: string,
    role: UserRole,
    pagination: PaginationDto,
    filters?: { search?: string; country?: string; currency?: string; includeArchived?: boolean },
  ) {
    const accessibleIds = await this.accessService.getAccessiblePropertyIds(userId, role);
    if (accessibleIds.length === 0) {
      return paginatedResponse([], 0, pagination.page ?? 1, pagination.limit ?? 20);
    }
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { id: { in: accessibleIds } };
    if (!filters?.includeArchived) where.archivedAt = null;
    if (filters?.country) where.country = filters.country;
    if (filters?.currency) where.currency = filters.currency;
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.AND = [
        { id: { in: accessibleIds } },
        ...(filters?.includeArchived ? [] : [{ archivedAt: null }]),
        { OR: [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }] },
      ];
      delete where.id;
      delete where.archivedAt;
    }
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where: where as Prisma.PropertyWhereInput,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where: where as Prisma.PropertyWhereInput }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, role: UserRole, id: string) {
    const canAccess = await this.accessService.canAccessProperty(userId, role, id);
    if (!canAccess) throw new NotFoundException('Property not found');
    const property = await this.prisma.property.findUnique({
      where: { id },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(userId: string, role: UserRole, id: string, dto: UpdatePropertyDto) {
    await this.findOne(userId, role, id);
    return this.prisma.property.update({
      where: { id },
      data: dto,
    });
  }

  async remove(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    const isOwner = await this.accessService.isPropertyOwner(userId, id);
    if (!isOwner) throw new ForbiddenException('Only the property owner can delete the property');
    await this.prisma.property.delete({ where: { id } });
    return { deleted: true };
  }

  async archive(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.property.update({ where: { id }, data: { archivedAt: now } }),
      this.prisma.lease.updateMany({ where: { propertyId: id, archivedAt: null }, data: { archivedAt: now } }),
      this.prisma.cheque.updateMany({ where: { propertyId: id, archivedAt: null }, data: { archivedAt: now } }),
      this.prisma.payment.updateMany({ where: { propertyId: id, archivedAt: null }, data: { archivedAt: now } }),
    ]);
    return this.prisma.property.findUnique({ where: { id } });
  }

  async restore(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    await this.prisma.$transaction([
      this.prisma.property.update({ where: { id }, data: { archivedAt: null } }),
      this.prisma.lease.updateMany({ where: { propertyId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
      this.prisma.cheque.updateMany({ where: { propertyId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
      this.prisma.payment.updateMany({ where: { propertyId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
    ]);
    return this.prisma.property.findUnique({ where: { id } });
  }

  async getCascadeInfo(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    const [leaseCount, chequeCount, paymentCount] = await Promise.all([
      this.prisma.lease.count({ where: { propertyId: id } }),
      this.prisma.cheque.count({ where: { propertyId: id } }),
      this.prisma.payment.count({ where: { propertyId: id } }),
    ]);
    return { leases: leaseCount, cheques: chequeCount, payments: paymentCount };
  }
}
