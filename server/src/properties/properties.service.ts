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
    return this.prisma.property.create({
      data: { ...dto, ownerId },
      include: { units: true },
    });
  }

  async findAll(ownerId: string, pagination: PaginationDto) {
    const { page = 1, limit = 20 } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where: { ownerId },
        include: { units: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.property.count({ where: { ownerId } }),
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
