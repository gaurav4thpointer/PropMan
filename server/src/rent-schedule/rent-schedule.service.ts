import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, ScheduleStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';

@Injectable()
export class RentScheduleService {
  constructor(
    private prisma: PrismaService,
    private accessService: AccessService,
  ) {}

  async findByLease(userId: string, role: UserRole, leaseId: string, pagination: PaginationDto) {
    const lease = await this.prisma.lease.findUnique({ where: { id: leaseId } });
    if (!lease) throw new NotFoundException('Lease not found');
    const canAccess = await this.accessService.canAccessProperty(userId, role, lease.propertyId);
    if (!canAccess) throw new NotFoundException('Lease not found');
    const { page = 1, limit = 50 } = pagination;
    const [data, total] = await Promise.all([
      this.prisma.rentSchedule.findMany({
        where: { leaseId },
        include: { lease: { select: { id: true, property: true, tenant: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.rentSchedule.count({ where: { leaseId } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOverdue(userId: string, role: UserRole, propertyId?: string, pagination?: PaginationDto) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const leaseWhere: { ownerId?: string; propertyId?: string | { in: string[] } } =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId, ...(propertyId && { propertyId }) }
        : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) }, ...(propertyId && { propertyId }) };
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN && (leaseWhere.propertyId as { in: string[] })?.in?.length === 0) {
      return paginatedResponse([], 0, 1, 50);
    }
    const where = { lease: leaseWhere, status: { in: [ScheduleStatus.DUE, ScheduleStatus.PARTIAL] }, dueDate: { lt: today } };
    const { page = 1, limit = 50 } = pagination ?? {};
    const [data, total] = await Promise.all([
      this.prisma.rentSchedule.findMany({
        where,
        include: { lease: { include: { property: true, tenant: true } } },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { dueDate: 'asc' },
      }),
      this.prisma.rentSchedule.count({ where }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOutstanding(userId: string, role: UserRole, propertyId?: string, from?: string, to?: string) {
    const leaseWhere: { ownerId?: string; propertyId?: string | { in: string[] } } =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId, ...(propertyId && { propertyId }) }
        : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) }, ...(propertyId && { propertyId }) };
    const dueDateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dueDateFilter.gte = new Date(from);
    if (to) dueDateFilter.lte = new Date(to);
    return this.prisma.rentSchedule.findMany({
      where: {
        lease: leaseWhere,
        status: { in: ['DUE', 'OVERDUE', 'PARTIAL'] },
        ...(Object.keys(dueDateFilter).length ? { dueDate: dueDateFilter } : {}),
      },
      include: { lease: { include: { property: true, tenant: true } } },
      orderBy: { dueDate: 'asc' },
    });
  }
}
