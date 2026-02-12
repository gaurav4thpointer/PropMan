import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class TenantsService {
  constructor(
    private prisma: PrismaService,
    private accessService: AccessService,
  ) {}

  async create(userId: string, role: UserRole, dto: CreateTenantDto) {
    let ownerId: string;
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      ownerId = userId;
    } else if (role === UserRole.PROPERTY_MANAGER) {
      const providedOwnerId = dto.ownerId;
      if (!providedOwnerId) throw new ForbiddenException('Property manager must specify ownerId');
      const canManage = await this.accessService.canManageOwner(userId, providedOwnerId);
      if (!canManage) throw new ForbiddenException('You cannot create tenants for this owner');
      ownerId = providedOwnerId;
    } else {
      throw new ForbiddenException('Only owners or property managers can create tenants');
    }
    const { ownerId: _omit, propertyId: _p, ...rest } = dto;
    return this.prisma.tenant.create({
      data: { ...rest, ownerId },
    });
  }

  async findAll(userId: string, role: UserRole, pagination: PaginationDto, search?: string, includeArchived?: boolean) {
    const { page = 1, limit = 20 } = pagination;
    const accessiblePropertyIds = await this.accessService.getAccessiblePropertyIds(userId, role);

    let visibilityOr: Prisma.TenantWhereInput[] = [];
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      // Tenants they directly own
      visibilityOr.push({ ownerId: userId });
      // Tenants that appear in any lease (current, future, or past) on their properties
      if (accessiblePropertyIds.length > 0) {
        visibilityOr.push({
          leases: {
            some: {
              propertyId: { in: accessiblePropertyIds },
            },
          },
        });
      }
    } else if (role === UserRole.PROPERTY_MANAGER) {
      const managedOwnerIds = await this.accessService.getManagedOwnerIds(userId);
      if (managedOwnerIds.length === 0 && accessiblePropertyIds.length === 0) {
        return paginatedResponse([], 0, page, limit);
      }
      if (managedOwnerIds.length > 0) {
        visibilityOr.push({ ownerId: { in: managedOwnerIds } });
      }
      if (accessiblePropertyIds.length > 0) {
        visibilityOr.push({
          leases: {
            some: {
              propertyId: { in: accessiblePropertyIds },
            },
          },
        });
      }
    } else {
      return paginatedResponse([], 0, page, limit);
    }

    const andConditions: Prisma.TenantWhereInput[] = [{ OR: visibilityOr }];
    if (!includeArchived) {
      andConditions.push({ archivedAt: null });
    }
    if (search?.trim()) {
      const q = search.trim();
      andConditions.push({
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      });
    }
    const where: Prisma.TenantWhereInput = andConditions.length === 1 ? andConditions[0]! : { AND: andConditions };

    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.tenant.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, role: UserRole, id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      if (tenant.ownerId !== userId) {
        // Allow owner to see tenants that are part of their leases even if the tenant is owned by another owner
        const hasLease = await this.prisma.lease.findFirst({
          where: { tenantId: id, ownerId: userId },
          select: { id: true },
        });
        if (!hasLease) throw new NotFoundException('Tenant not found');
      }
    } else if (role === UserRole.PROPERTY_MANAGER) {
      const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
      if (!canManage) throw new NotFoundException('Tenant not found');
    } else {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async update(userId: string, role: UserRole, id: string, dto: UpdateTenantDto) {
    const tenant = await this.findOne(userId, role, id);
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      // Owners/super admins can only modify tenants they directly own
      if (tenant.ownerId !== userId) throw new ForbiddenException('You cannot modify this tenant');
    } else if (role === UserRole.PROPERTY_MANAGER) {
      const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
      if (!canManage) throw new ForbiddenException('You cannot modify this tenant');
    }
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async remove(userId: string, role: UserRole, id: string) {
    const tenant = await this.findOne(userId, role, id);
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      if (tenant.ownerId !== userId) throw new ForbiddenException('You cannot delete this tenant');
    } else if (role === UserRole.PROPERTY_MANAGER) {
      const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
      if (!canManage) throw new ForbiddenException('You cannot delete this tenant');
    }
    await this.prisma.tenant.delete({ where: { id } });
    return { deleted: true };
  }

  async archive(userId: string, role: UserRole, id: string) {
    const tenant = await this.findOne(userId, role, id);
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      if (tenant.ownerId !== userId) throw new ForbiddenException('You cannot archive this tenant');
    } else if (role === UserRole.PROPERTY_MANAGER) {
      const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
      if (!canManage) throw new ForbiddenException('You cannot archive this tenant');
    }
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.tenant.update({ where: { id }, data: { archivedAt: now } }),
      this.prisma.lease.updateMany({ where: { tenantId: id, archivedAt: null }, data: { archivedAt: now } }),
      this.prisma.cheque.updateMany({ where: { tenantId: id, archivedAt: null }, data: { archivedAt: now } }),
      this.prisma.payment.updateMany({ where: { tenantId: id, archivedAt: null }, data: { archivedAt: now } }),
    ]);
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async restore(userId: string, role: UserRole, id: string) {
    const tenant = await this.findOne(userId, role, id);
    if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
      if (tenant.ownerId !== userId) throw new ForbiddenException('You cannot restore this tenant');
    } else if (role === UserRole.PROPERTY_MANAGER) {
      const canManage = await this.accessService.canManageOwner(userId, tenant.ownerId);
      if (!canManage) throw new ForbiddenException('You cannot restore this tenant');
    }
    await this.prisma.$transaction([
      this.prisma.tenant.update({ where: { id }, data: { archivedAt: null } }),
      this.prisma.lease.updateMany({ where: { tenantId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
      this.prisma.cheque.updateMany({ where: { tenantId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
      this.prisma.payment.updateMany({ where: { tenantId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
    ]);
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async getCascadeInfo(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    const [leaseCount, chequeCount, paymentCount] = await Promise.all([
      this.prisma.lease.count({ where: { tenantId: id } }),
      this.prisma.cheque.count({ where: { tenantId: id } }),
      this.prisma.payment.count({ where: { tenantId: id } }),
    ]);
    return { leases: leaseCount, cheques: chequeCount, payments: paymentCount };
  }
}
