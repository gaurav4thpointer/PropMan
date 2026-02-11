import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { UserRole, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MatchScheduleItemDto } from './dto/match-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';
import { ScheduleStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  constructor(
    private prisma: PrismaService,
    private accessService: AccessService,
  ) {}

  async create(userId: string, role: UserRole, dto: CreatePaymentDto) {
    const lease = await this.ensureLeaseAccessible(userId, role, dto.leaseId);
    const ownerId = role === UserRole.USER || role === UserRole.SUPER_ADMIN ? userId : lease.ownerId;
    const payment = await this.prisma.payment.create({
      data: {
        ownerId,
        leaseId: dto.leaseId,
        tenantId: dto.tenantId,
        propertyId: dto.propertyId,
        date: new Date(dto.date),
        amount: new Decimal(dto.amount),
        method: dto.method,
        reference: dto.reference,
        notes: dto.notes,
        chequeId: dto.chequeId,
      },
    });

    // Auto-match payment to the oldest unpaid rent schedule entries
    await this.autoMatchPayment(payment.id, payment.leaseId, Number(payment.amount));

    return this.prisma.payment.findUnique({
      where: { id: payment.id },
      include: { lease: true, tenant: true, property: true, scheduleMatches: { include: { rentSchedule: true } } },
    });
  }

  async findAll(
    userId: string,
    role: UserRole,
    pagination: PaginationDto,
    filters?: { leaseId?: string; propertyId?: string; tenantId?: string; search?: string; includeArchived?: boolean },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId }
        : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) } };
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN && (where.propertyId as { in: string[] }).in.length === 0) {
      return paginatedResponse([], 0, page, limit);
    }
    if (!filters?.includeArchived) where.archivedAt = null;
    if (filters?.leaseId) where.leaseId = filters.leaseId;
    if (filters?.propertyId) where.propertyId = filters.propertyId;
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { reference: { contains: q, mode: 'insensitive' } },
        { tenant: { name: { contains: q, mode: 'insensitive' } } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: where as Prisma.PaymentWhereInput,
        include: { lease: true, tenant: true, property: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.payment.count({ where: where as Prisma.PaymentWhereInput }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, role: UserRole, id: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
      include: { lease: true, tenant: true, property: true, scheduleMatches: { include: { rentSchedule: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    const canAccess = await this.accessService.canAccessProperty(userId, role, payment.propertyId);
    if (!canAccess) throw new NotFoundException('Payment not found');
    return payment;
  }

  async matchToSchedule(userId: string, role: UserRole, paymentId: string, matches: MatchScheduleItemDto[]) {
    const payment = await this.findOne(userId, role, paymentId);
    const totalPayment = Number(payment.amount);
    const accessibleIds = await this.accessService.getAccessiblePropertyIds(userId, role);
    let applied = 0;
    for (const m of matches) {
      const schedule = await this.prisma.rentSchedule.findFirst({
        where: {
          id: m.rentScheduleId,
          lease: { propertyId: { in: accessibleIds } },
        },
      });
      if (!schedule) throw new NotFoundException(`RentSchedule ${m.rentScheduleId} not found`);
      if (schedule.leaseId !== payment.leaseId) throw new BadRequestException('RentSchedule must belong to same lease as payment');
      applied += m.amount;
    }
    if (applied > totalPayment) throw new BadRequestException('Total applied amount exceeds payment amount');

    await this.prisma.paymentScheduleMatch.deleteMany({ where: { paymentId } });

    const scheduleIds = [...new Set(matches.filter((m) => m.amount > 0).map((m) => m.rentScheduleId))];
    for (const m of matches) {
      if (m.amount <= 0) continue;
      await this.prisma.paymentScheduleMatch.create({
        data: {
          paymentId,
          rentScheduleId: m.rentScheduleId,
          amount: new Decimal(m.amount),
        },
      });
    }
    await this.recalcScheduleStatuses(scheduleIds);
    return this.findOne(userId, role, paymentId);
  }

  async remove(userId: string, role: UserRole, id: string) {
    const payment = await this.findOne(userId, role, id);
    await this.prisma.paymentScheduleMatch.deleteMany({ where: { paymentId: id } });
    await this.prisma.payment.delete({ where: { id } });
    return { deleted: true };
  }

  /**
   * Auto-match a payment to the oldest unpaid/partially-paid rent schedule
   * entries for the same lease, allocating the full payment amount.
   */
  private async autoMatchPayment(paymentId: string, leaseId: string, paymentAmount: number) {
    const schedules = await this.prisma.rentSchedule.findMany({
      where: { leaseId },
      orderBy: { dueDate: 'asc' },
    });

    let remaining = paymentAmount;
    const matches: { rentScheduleId: string; amount: number }[] = [];

    for (const schedule of schedules) {
      if (remaining <= 0) break;

      const expected = Number(schedule.expectedAmount);

      // How much is already matched from other payments?
      const agg = await this.prisma.paymentScheduleMatch.aggregate({
        where: { rentScheduleId: schedule.id },
        _sum: { amount: true },
      });
      const alreadyPaid = Number(agg._sum.amount ?? 0);
      const stillOwed = expected - alreadyPaid;

      if (stillOwed <= 0) continue; // Already fully covered

      const toApply = Math.min(remaining, stillOwed);
      matches.push({ rentScheduleId: schedule.id, amount: toApply });
      remaining -= toApply;
    }

    // Create match records
    for (const m of matches) {
      await this.prisma.paymentScheduleMatch.create({
        data: {
          paymentId,
          rentScheduleId: m.rentScheduleId,
          amount: new Decimal(m.amount),
        },
      });
    }

    // Recalculate status for each affected schedule
    await this.recalcScheduleStatuses(matches.map((m) => m.rentScheduleId));
  }

  /**
   * Recalculate paidAmount + status for the given rent schedule IDs
   * based on their current PaymentScheduleMatch totals.
   */
  private async recalcScheduleStatuses(scheduleIds: string[]) {
    const uniqueIds = [...new Set(scheduleIds)];
    for (const rentScheduleId of uniqueIds) {
      const schedule = await this.prisma.rentSchedule.findUnique({ where: { id: rentScheduleId } });
      if (!schedule) continue;

      const expected = Number(schedule.expectedAmount);
      const agg = await this.prisma.paymentScheduleMatch.aggregate({
        where: { rentScheduleId },
        _sum: { amount: true },
      });
      const totalPaid = Number(agg._sum.amount ?? 0);

      const status: ScheduleStatus =
        totalPaid >= expected
          ? ScheduleStatus.PAID
          : totalPaid > 0
            ? ScheduleStatus.PARTIAL
            : new Date(schedule.dueDate) < new Date()
              ? ScheduleStatus.OVERDUE
              : ScheduleStatus.DUE;

      await this.prisma.rentSchedule.update({
        where: { id: rentScheduleId },
        data: {
          status,
          paidAmount: totalPaid > 0 ? new Decimal(totalPaid) : null,
        },
      });
    }
  }

  private async ensureLeaseAccessible(userId: string, role: UserRole, leaseId: string) {
    const lease = await this.prisma.lease.findUnique({ where: { id: leaseId } });
    if (!lease) throw new NotFoundException('Lease not found');
    const canAccess = await this.accessService.canAccessProperty(userId, role, lease.propertyId);
    if (!canAccess) throw new NotFoundException('Lease not found');
    return lease;
  }
}
