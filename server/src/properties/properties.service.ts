import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePropertyDto) {
    const { firstUnit, ...propertyData } = dto;
    return this.prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: { ...propertyData, ownerId },
      });
      if (firstUnit?.unitNo) {
        await tx.unit.create({
          data: {
            propertyId: property.id,
            unitNo: firstUnit.unitNo,
            bedrooms: firstUnit.bedrooms,
            status: firstUnit.status ?? 'VACANT',
            notes: firstUnit.notes,
          },
        });
      }
      return tx.property.findUniqueOrThrow({
        where: { id: property.id },
        include: { units: true },
      });
    });
  }

  async findAll(ownerId: string, pagination: PaginationDto, filters?: { search?: string; country?: string; currency?: string }) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { ownerId };
    if (filters?.country) where.country = filters.country;
    if (filters?.currency) where.currency = filters.currency;
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.AND = [
        { OR: [{ name: { contains: q, mode: 'insensitive' } }, { address: { contains: q, mode: 'insensitive' } }] },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where: where as { ownerId: string },
        include: { units: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where: where as { ownerId: string } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(ownerId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, ownerId },
      include: { units: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async update(ownerId: string, id: string, dto: UpdatePropertyDto) {
    await this.findOne(ownerId, id);
    return this.prisma.property.update({
      where: { id },
      data: dto,
      include: { units: true },
    });
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.prisma.property.delete({ where: { id } });
    return { deleted: true };
  }
}
