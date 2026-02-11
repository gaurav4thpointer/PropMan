import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
import { TerminateLeaseDto } from './dto/terminate-lease.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';
import { RentFrequency, UnitStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function getDueDate(year: number, month: number, dueDay: number): Date {
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(dueDay, lastDay);
  return new Date(year, month - 1, day);
}

function generateScheduleDates(
  startDate: Date,
  endDate: Date,
  dueDay: number,
  frequency: RentFrequency,
): Date[] {
  const dates: Date[] = [];
  const start = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate);

  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  current.setMonth(current.getMonth() - 1);
  let stepMonths = 1;
  if (frequency === RentFrequency.QUARTERLY) stepMonths = 3;
  else if (frequency === RentFrequency.YEARLY) stepMonths = 12;

  while (current <= end) {
    const due = getDueDate(current.getFullYear(), current.getMonth() + 1, dueDay);
    if (due >= startDate && due <= endDate) dates.push(due);
    current = addMonths(current, stepMonths);
  }
  return dates;
}

@Injectable()
export class LeasesService {
  constructor(
    private prisma: PrismaService,
    private accessService: AccessService,
  ) {}

  async create(userId: string, role: UserRole, dto: CreateLeaseDto) {
    await this.ensurePropertyAndTenantAccessible(userId, role, dto.propertyId, dto.tenantId);
    await this.checkNoOverlappingLease(dto.propertyId, dto.startDate, dto.endDate, null);

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) throw new BadRequestException('endDate must be after startDate');

    const property = await this.prisma.property.findUniqueOrThrow({
      where: { id: dto.propertyId },
      select: { ownerId: true },
    });
    const ownerId = role === UserRole.USER || role === UserRole.SUPER_ADMIN ? userId : property.ownerId;

    const lease = await this.prisma.lease.create({
      data: {
        ownerId,
        propertyId: dto.propertyId,
        tenantId: dto.tenantId,
        startDate: start,
        endDate: end,
        rentFrequency: dto.rentFrequency,
        installmentAmount: new Decimal(dto.installmentAmount),
        dueDay: dto.dueDay,
        securityDeposit: dto.securityDeposit != null ? new Decimal(dto.securityDeposit) : null,
        notes: dto.notes,
      },
      include: { property: true, tenant: true },
    });

    await this.generateRentSchedule(lease.id, start, end, dto.dueDay, dto.rentFrequency, new Decimal(dto.installmentAmount));
    await this.prisma.property.update({ where: { id: dto.propertyId }, data: { status: UnitStatus.OCCUPIED } });
    return this.findOne(userId, role, lease.id);
  }

  async findAll(
    userId: string,
    role: UserRole,
    pagination: PaginationDto,
    filters?: { propertyId?: string; tenantId?: string; search?: string; includeArchived?: boolean },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId }
        : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) } };
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN && (where.propertyId as { in: string[] }).in.length === 0) {
      return paginatedResponse([], 0, page, limit);
    }
    if (filters?.propertyId) {
      if (role === UserRole.USER || role === UserRole.SUPER_ADMIN) {
        where.propertyId = filters.propertyId;
      } else {
        const ids = (where.propertyId as { in: string[] }).in;
        if (!ids.includes(filters.propertyId)) return paginatedResponse([], 0, page, limit);
        where.propertyId = filters.propertyId;
      }
    }
    if (!filters?.includeArchived) where.archivedAt = null;
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { tenant: { name: { contains: q, mode: 'insensitive' } } },
        { property: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.lease.findMany({
        where: where as Prisma.LeaseWhereInput,
        include: { property: true, tenant: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.lease.count({ where: where as Prisma.LeaseWhereInput }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, role: UserRole, id: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id },
      include: {
        property: true,
        tenant: true,
        rentSchedules: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!lease) throw new NotFoundException('Lease not found');
    const canAccess = await this.accessService.canAccessProperty(userId, role, lease.propertyId);
    if (!canAccess) throw new NotFoundException('Lease not found');
    return lease;
  }

  async update(userId: string, role: UserRole, id: string, dto: UpdateLeaseDto) {
    const existing = await this.findOne(userId, role, id);
    const propertyId = dto.propertyId ?? existing.propertyId;
    const tenantId = dto.tenantId ?? existing.tenantId;
    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    const dueDay = dto.dueDay ?? existing.dueDay;
    const frequency = dto.rentFrequency ?? existing.rentFrequency;
    const amount = dto.installmentAmount != null ? new Decimal(dto.installmentAmount) : existing.installmentAmount;

    if (endDate <= startDate) {
      throw new BadRequestException('endDate must be after startDate');
    }

    await this.ensurePropertyAndTenantAccessible(userId, role, propertyId, tenantId);
    await this.checkNoOverlappingLease(propertyId, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10), id);

    const updated = await this.prisma.lease.update({
      where: { id },
      data: {
        ...(dto.propertyId && { propertyId: dto.propertyId }),
        ...(dto.tenantId && { tenantId: dto.tenantId }),
        ...(dto.startDate && { startDate: new Date(dto.startDate) }),
        ...(dto.endDate && { endDate: new Date(dto.endDate) }),
        ...(dto.rentFrequency && { rentFrequency: dto.rentFrequency }),
        ...(dto.installmentAmount != null && { installmentAmount: new Decimal(dto.installmentAmount) }),
        ...(dto.dueDay != null && { dueDay: dto.dueDay }),
        ...(dto.securityDeposit != null && { securityDeposit: new Decimal(dto.securityDeposit) }),
        ...(dto.notes !== undefined && { notes: dto.notes }),
      },
    });

    // Regenerate schedule: delete existing and recreate (MVP: simple approach)
    await this.prisma.paymentScheduleMatch.deleteMany({
      where: { rentSchedule: { leaseId: id } },
    });
    await this.prisma.rentSchedule.deleteMany({ where: { leaseId: id } });
    await this.generateRentSchedule(updated.id, startDate, endDate, dueDay, frequency, amount);

    // If property changed, update property statuses: free old if no other active lease, occupy new
    if (dto.propertyId && existing.propertyId !== dto.propertyId) {
      await this.setPropertyVacantIfNoActiveLease(existing.propertyId, id);
      await this.prisma.property.update({ where: { id: dto.propertyId }, data: { status: UnitStatus.OCCUPIED } });
    }

    return this.findOne(userId, role, id);
  }

  async remove(userId: string, role: UserRole, id: string) {
    const lease = await this.findOne(userId, role, id);
    const propertyId = lease.propertyId;
    await this.prisma.lease.delete({ where: { id } });
    await this.setPropertyVacantIfNoActiveLease(propertyId, null);
    return { deleted: true };
  }

  async archive(userId: string, role: UserRole, id: string) {
    const lease = await this.findOne(userId, role, id);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.lease.update({ where: { id }, data: { archivedAt: now } }),
      this.prisma.cheque.updateMany({ where: { leaseId: id, archivedAt: null }, data: { archivedAt: now } }),
      this.prisma.payment.updateMany({ where: { leaseId: id, archivedAt: null }, data: { archivedAt: now } }),
    ]);
    await this.setPropertyVacantIfNoActiveLease(lease.propertyId, id);
    return this.findOne(userId, role, id);
  }

  async restore(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    await this.prisma.$transaction([
      this.prisma.lease.update({ where: { id }, data: { archivedAt: null } }),
      this.prisma.cheque.updateMany({ where: { leaseId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
      this.prisma.payment.updateMany({ where: { leaseId: id, archivedAt: { not: null } }, data: { archivedAt: null } }),
    ]);
    return this.findOne(userId, role, id);
  }

  async getCascadeInfo(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    const [chequeCount, paymentCount, scheduleCount, documentCount] = await Promise.all([
      this.prisma.cheque.count({ where: { leaseId: id } }),
      this.prisma.payment.count({ where: { leaseId: id } }),
      this.prisma.rentSchedule.count({ where: { leaseId: id } }),
      this.prisma.leaseDocument.count({ where: { leaseId: id } }),
    ]);
    return { cheques: chequeCount, payments: paymentCount, schedules: scheduleCount, documents: documentCount };
  }

  /** Set property to VACANT if it has no active (non-expired, not terminated) lease, excluding optional lease id. */
  private async setPropertyVacantIfNoActiveLease(propertyId: string, excludeLeaseId: string | null) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const leases = await this.prisma.lease.findMany({
      where: {
        propertyId,
        archivedAt: null,
        ...(excludeLeaseId && { id: { not: excludeLeaseId } }),
        endDate: { gte: now },
      },
      select: { id: true, endDate: true, terminationDate: true },
    });
    const active = leases.some((l) => {
      const end = new Date(l.endDate);
      end.setHours(0, 0, 0, 0);
      if (end < now) return false;
      if (l.terminationDate == null) return true;
      const term = new Date(l.terminationDate);
      term.setHours(0, 0, 0, 0);
      return term > now;
    });
    if (!active) {
      await this.prisma.property.update({ where: { id: propertyId }, data: { status: UnitStatus.VACANT } });
    }
  }

  async terminateEarly(userId: string, role: UserRole, id: string, dto: TerminateLeaseDto) {
    const lease = await this.findOne(userId, role, id);
    const start = new Date(lease.startDate);
    const end = new Date(lease.endDate);
    const term = new Date(dto.terminationDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    term.setHours(0, 0, 0, 0);
    if (term < start) throw new BadRequestException('terminationDate must be on or after lease startDate');
    if (term > end) throw new BadRequestException('terminationDate must be on or before lease endDate');
    if (lease.terminationDate) throw new BadRequestException('Lease is already terminated');

    await this.prisma.lease.update({
      where: { id },
      data: { terminationDate: term },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (term <= today) {
      await this.setPropertyVacantIfNoActiveLease(lease.propertyId, null);
    }
    return this.findOne(userId, role, id);
  }

  private async ensurePropertyAndTenantAccessible(
    userId: string,
    role: UserRole,
    propertyId: string,
    tenantId: string,
  ) {
    const canAccess = await this.accessService.canAccessProperty(userId, role, propertyId);
    if (!canAccess) throw new NotFoundException('Property not found');
    const property = await this.prisma.property.findUnique({ where: { id: propertyId }, select: { ownerId: true } });
    if (!property) throw new NotFoundException('Property not found');
    const tenant = await this.prisma.tenant.findFirst({
      where: { id: tenantId, ownerId: property.ownerId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');
  }

  private async checkNoOverlappingLease(propertyId: string, start: string, end: string, excludeLeaseId: string | null) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const overlapping = await this.prisma.lease.findFirst({
      where: {
        propertyId,
        archivedAt: null,
        ...(excludeLeaseId && { id: { not: excludeLeaseId } }),
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlapping) throw new BadRequestException('Property already has an overlapping active lease');
  }

  private async generateRentSchedule(
    leaseId: string,
    startDate: Date,
    endDate: Date,
    dueDay: number,
    frequency: RentFrequency,
    amount: Decimal,
  ) {
    const freq = frequency === RentFrequency.CUSTOM ? RentFrequency.MONTHLY : frequency;
    const dates = generateScheduleDates(startDate, endDate, dueDay, freq);
    await this.prisma.rentSchedule.createMany({
      data: dates.map((dueDate) => ({
        leaseId,
        dueDate,
        expectedAmount: amount,
        status: 'DUE',
      })),
    });
  }
}
