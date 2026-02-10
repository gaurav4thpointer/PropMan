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

  async findAll(userId: string, role: UserRole, pagination: PaginationDto, search?: string) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { ownerId: userId };
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
}
