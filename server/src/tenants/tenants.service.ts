import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class TenantsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateTenantDto) {
    return this.prisma.tenant.create({
      data: { ...dto, ownerId },
    });
  }

  async findAll(ownerId: string, pagination: PaginationDto, search?: string) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { ownerId };
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

  async findOne(ownerId: string, id: string) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { id, ownerId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  async update(ownerId: string, id: string, dto: UpdateTenantDto) {
    await this.findOne(ownerId, id);
    return this.prisma.tenant.update({ where: { id }, data: dto });
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.prisma.tenant.delete({ where: { id } });
    return { deleted: true };
  }
}
