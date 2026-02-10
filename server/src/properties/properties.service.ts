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
    } else {
      throw new ForbiddenException('Only owners can create properties');
    }
    const { ownerId: _omit, ...propertyData } = dto;
    return this.prisma.property.create({
      data: {
        ...propertyData,
        ownerId,
        status: propertyData.status ?? 'VACANT',
      },
    });
  }

  async findAll(
    userId: string,
    role: UserRole,
    pagination: PaginationDto,
    filters?: { search?: string; country?: string; currency?: string },
  ) {
    const accessibleIds = await this.accessService.getAccessiblePropertyIds(userId, role);
    if (accessibleIds.length === 0) {
      return paginatedResponse([], 0, pagination.page ?? 1, pagination.limit ?? 20);
    }
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { id: { in: accessibleIds } };
    if (filters?.country) where.country = filters.country;
    if (filters?.currency) where.currency = filters.currency;
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.AND = [
        { id: { in: accessibleIds } },
        { OR: [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }] },
      ];
      delete where.id;
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
}
