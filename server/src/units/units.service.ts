import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class UnitsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, propertyId: string, dto: CreateUnitDto) {
    await this.ensurePropertyOwned(ownerId, propertyId);
    return this.prisma.unit.create({
      data: { ...dto, propertyId },
    });
  }

  async findByProperty(ownerId: string, propertyId: string, pagination: PaginationDto) {
    await this.ensurePropertyOwned(ownerId, propertyId);
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.unit.findMany({
        where: { propertyId },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { unitNo: 'asc' },
      }),
      this.prisma.unit.count({ where: { propertyId } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(ownerId: string, id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, property: { ownerId } },
      include: { property: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  async update(ownerId: string, id: string, dto: UpdateUnitDto) {
    await this.findOne(ownerId, id);
    return this.prisma.unit.update({ where: { id }, data: dto });
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.prisma.unit.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensurePropertyOwned(ownerId: string, propertyId: string) {
    const p = await this.prisma.property.findFirst({
      where: { id: propertyId, ownerId },
    });
    if (!p) throw new NotFoundException('Property not found');
  }
}
