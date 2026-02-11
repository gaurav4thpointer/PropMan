import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
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
    } else {
      throw new ForbiddenException('Only owners can create tenants');
    }
    const { propertyId: _omit, ...rest } = dto;
    return this.prisma.tenant.create({
      data: { ...rest, ownerId },
    });
  }

  async findAll(userId: string, role: UserRole, pagination: PaginationDto, search?: string, includeArchived?: boolean) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { ownerId: userId };
    if (!includeArchived) where.archivedAt = null;
    if (search?.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.tenant.findMany({
        where: where as { ownerId: string },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.tenant.count({ where: where as { ownerId: string } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, role: UserRole, id: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException('Tenant not found');
    if (tenant.ownerId !== userId || (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN)) {
      throw new NotFoundException('Tenant not found');
    }
    return tenant;
  }

  async update(userId: string, role: UserRole, id: string, dto: UpdateTenantDto) {
    await this.findOne(userId, role, id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async remove(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    await this.prisma.tenant.delete({ where: { id } });
    return { deleted: true };
  }

  async archive(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
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
    await this.findOne(userId, role, id);
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
