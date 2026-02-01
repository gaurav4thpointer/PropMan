import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { UpdateLeaseDto } from './dto/update-lease.dto';
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
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateLeaseDto) {
    await this.ensurePropertyUnitTenantOwned(ownerId, dto.propertyId, dto.unitId, dto.tenantId);
    await this.checkNoOverlappingLease(dto.unitId, dto.startDate, dto.endDate, null);

    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    if (end <= start) throw new BadRequestException('endDate must be after startDate');

    const lease = await this.prisma.lease.create({
      data: {
        ownerId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        tenantId: dto.tenantId,
        startDate: start,
        endDate: end,
        rentFrequency: dto.rentFrequency,
        installmentAmount: new Decimal(dto.installmentAmount),
        dueDay: dto.dueDay,
        securityDeposit: dto.securityDeposit != null ? new Decimal(dto.securityDeposit) : null,
        notes: dto.notes,
      },
      include: { property: true, unit: true, tenant: true },
    });

    await this.generateRentSchedule(lease.id, start, end, dto.dueDay, dto.rentFrequency, new Decimal(dto.installmentAmount));
    await this.prisma.unit.update({ where: { id: dto.unitId }, data: { status: UnitStatus.OCCUPIED } });
    return this.findOne(ownerId, lease.id);
  }

  async findAll(ownerId: string, pagination: PaginationDto, filters?: { propertyId?: string; tenantId?: string; search?: string }) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { ownerId };
    if (filters?.propertyId) where.propertyId = filters.propertyId;
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
        where: where as { ownerId: string },
        include: { property: true, unit: true, tenant: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { startDate: 'desc' },
      }),
      this.prisma.lease.count({ where: where as { ownerId: string } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(ownerId: string, id: string) {
    const lease = await this.prisma.lease.findFirst({
      where: { id, ownerId },
      include: {
        property: true,
        unit: true,
        tenant: true,
        rentSchedules: { orderBy: { dueDate: 'asc' } },
      },
    });
    if (!lease) throw new NotFoundException('Lease not found');
    return lease;
  }

  async update(ownerId: string, id: string, dto: UpdateLeaseDto) {
    const existing = await this.findOne(ownerId, id);
    const propertyId = dto.propertyId ?? existing.propertyId;
    const unitId = dto.unitId ?? existing.unitId;
    const tenantId = dto.tenantId ?? existing.tenantId;
    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    const dueDay = dto.dueDay ?? existing.dueDay;
    const frequency = dto.rentFrequency ?? existing.rentFrequency;
    const amount = dto.installmentAmount != null ? new Decimal(dto.installmentAmount) : existing.installmentAmount;

    await this.ensurePropertyUnitTenantOwned(ownerId, propertyId, unitId, tenantId);
    await this.checkNoOverlappingLease(unitId, startDate.toISOString().slice(0, 10), endDate.toISOString().slice(0, 10), id);

    const updated = await this.prisma.lease.update({
      where: { id },
      data: {
        ...(dto.propertyId && { propertyId: dto.propertyId }),
        ...(dto.unitId && { unitId: dto.unitId }),
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

    // If unit changed, update unit statuses: free old unit if no other active lease, occupy new unit
    if (dto.unitId && existing.unitId !== dto.unitId) {
      await this.setUnitVacantIfNoActiveLease(existing.unitId, id);
      await this.prisma.unit.update({ where: { id: dto.unitId }, data: { status: UnitStatus.OCCUPIED } });
    }

    return this.findOne(ownerId, id);
  }

  async remove(ownerId: string, id: string) {
    const lease = await this.findOne(ownerId, id);
    const unitId = lease.unitId;
    await this.prisma.lease.delete({ where: { id } });
    await this.setUnitVacantIfNoActiveLease(unitId, null);
    return { deleted: true };
  }

  /** Set unit to VACANT if it has no active (non-expired) lease, excluding optional lease id. */
  private async setUnitVacantIfNoActiveLease(unitId: string, excludeLeaseId: string | null) {
    const now = new Date();
    const active = await this.prisma.lease.findFirst({
      where: {
        unitId,
        ...(excludeLeaseId && { id: { not: excludeLeaseId } }),
        endDate: { gte: now },
      },
    });
    if (!active) {
      await this.prisma.unit.update({ where: { id: unitId }, data: { status: UnitStatus.VACANT } });
    }
  }

  private async ensurePropertyUnitTenantOwned(
    ownerId: string,
    propertyId: string,
    unitId: string,
    tenantId: string,
  ) {
    const [prop, unit, tenant] = await Promise.all([
      this.prisma.property.findFirst({ where: { id: propertyId, ownerId } }),
      this.prisma.unit.findFirst({ where: { id: unitId, propertyId } }),
      this.prisma.tenant.findFirst({ where: { id: tenantId, ownerId } }),
    ]);
    if (!prop) throw new NotFoundException('Property not found');
    if (!unit) throw new NotFoundException('Unit not found');
    if (!tenant) throw new NotFoundException('Tenant not found');
  }

  private async checkNoOverlappingLease(unitId: string, start: string, end: string, excludeLeaseId: string | null) {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const overlapping = await this.prisma.lease.findFirst({
      where: {
        unitId,
        ...(excludeLeaseId && { id: { not: excludeLeaseId } }),
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
    if (overlapping) throw new BadRequestException('Unit already has an overlapping active lease');
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
