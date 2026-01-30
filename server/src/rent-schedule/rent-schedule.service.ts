import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class RentScheduleService {
  constructor(private prisma: PrismaService) {}

  async findByLease(ownerId: string, leaseId: string, pagination: PaginationDto) {
    const { page = 1, limit = 50 } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.rentSchedule.findMany({
        where: { lease: { ownerId, id: leaseId } },
        include: { lease: { select: { id: true, unit: true, tenant: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.rentSchedule.count({ where: { lease: { ownerId, id: leaseId } } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOverdue(ownerId: string, propertyId?: string, pagination?: PaginationDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const where: Record<string, unknown> = {
      lease: { ownerId },
      status: { in: ['DUE', 'PARTIAL'] },
      dueDate: { lt: today },
    };
    if (propertyId) (where.lease as Record<string, string>).propertyId = propertyId;
    const { page = 1, limit = 50 } = pagination ?? {};
    const [data, total] = await Promise.all([
      this.prisma.rentSchedule.findMany({
        where,
        include: { lease: { include: { property: true, unit: true, tenant: true } } },
        skip: ((page as number) - 1) * (limit as number),
        take: limit as number,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.rentSchedule.count({ where }),
    ]);
    return paginatedResponse(data, total, page as number, limit as number);
  }

  async findOutstanding(ownerId: string, propertyId?: string, from?: string, to?: string) {
    const leaseWhere: { ownerId: string; propertyId?: string } = { ownerId };
    if (propertyId) leaseWhere.propertyId = propertyId;
    const dueDateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dueDateFilter.gte = new Date(from);
    if (to) dueDateFilter.lte = new Date(to);
    return this.prisma.rentSchedule.findMany({
      where: {
        lease: leaseWhere,
        status: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
        ...(Object.keys(dueDateFilter).length ? { dueDate: dueDateFilter } : {}),
      },
      include: { lease: { include: { property: true, unit: true, tenant: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }
}
