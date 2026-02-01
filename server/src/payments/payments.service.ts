import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { MatchScheduleItemDto } from './dto/match-payment.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';
import { ScheduleStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreatePaymentDto) {
    await this.ensureLeaseOwned(ownerId, dto.leaseId);
    return this.prisma.payment.create({
      data: {
        ownerId,
        leaseId: dto.leaseId,
        tenantId: dto.tenantId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        date: new Date(dto.date),
        amount: new Decimal(dto.amount),
        method: dto.method,
        reference: dto.reference,
        notes: dto.notes,
        chequeId: dto.chequeId,
      },
      include: { lease: true, tenant: true, property: true, unit: true },
    });
  }

  async findAll(ownerId: string, pagination: PaginationDto, filters?: { leaseId?: string; propertyId?: string; tenantId?: string; search?: string }) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { ownerId };
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
        where: where as { ownerId: string },
        include: { lease: true, tenant: true, property: true, unit: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.payment.count({ where: where as { ownerId: string } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(ownerId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, ownerId },
      include: { lease: true, tenant: true, property: true, unit: true, scheduleMatches: { include: { rentSchedule: true } } },
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async matchToSchedule(ownerId: string, paymentId: string, matches: MatchScheduleItemDto[]) {
    const payment = await this.findOne(ownerId, paymentId);
    const totalPayment = Number(payment.amount);
    let applied = 0;
    for (const m of matches) {
      const schedule = await this.prisma.rentSchedule.findFirst({
        where: { id: m.rentScheduleId, lease: { ownerId } },
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
    for (const rentScheduleId of scheduleIds) {
      const schedule = await this.prisma.rentSchedule.findUnique({ where: { id: rentScheduleId } });
      if (!schedule) continue;
      const expected = Number(schedule.expectedAmount);
      const agg = await this.prisma.paymentScheduleMatch.aggregate({
        where: { rentScheduleId },
        _sum: { amount: true },
      });
      const totalPaid = Number(agg._sum.amount ?? 0);
      let status: ScheduleStatus =
        totalPaid >= expected ? ScheduleStatus.PAID : totalPaid > 0 ? ScheduleStatus.PARTIAL : new Date(schedule.dueDate) < new Date() ? ScheduleStatus.OVERDUE : ScheduleStatus.DUE;
      await this.prisma.rentSchedule.update({
        where: { id: rentScheduleId },
        data: {
          status,
          paidAmount: totalPaid > 0 ? new Decimal(totalPaid) : null,
        },
      });
    }
    return this.findOne(ownerId, paymentId);
  }

  async remove(ownerId: string, id: string) {
    const payment = await this.findOne(ownerId, id);
    await this.prisma.paymentScheduleMatch.deleteMany({ where: { paymentId: id } });
    await this.prisma.payment.delete({ where: { id } });
    return { deleted: true };
  }

  private async ensureLeaseOwned(ownerId: string, leaseId: string) {
    const lease = await this.prisma.lease.findFirst({ where: { id: leaseId, ownerId } });
    if (!lease) throw new NotFoundException('Lease not found');
  }
}
