import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ScheduleStatus, ChequeStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async dashboard(ownerId: string, propertyId?: string) {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);

    const leaseWhere = { ownerId, ...(propertyId && { propertyId }) };

    const expiryEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const unitWhere = { property: { ownerId, ...(propertyId && { id: propertyId }) } };

    const [monthExpected, monthPaid, quarterExpected, quarterPaid, overdueSchedules, upcomingCheques, bouncedCount, vacantCount, occupiedCount, expiringLeases] = await Promise.all([
      this.prisma.rentSchedule.aggregate({
        where: {
          lease: leaseWhere,
          dueDate: { gte: monthStart, lte: monthEnd },
        },
        _sum: { expectedAmount: true },
      }),
      this.prisma.rentSchedule.aggregate({
        where: {
          lease: leaseWhere,
          dueDate: { gte: monthStart, lte: monthEnd },
          status: ScheduleStatus.PAID,
        },
        _sum: { expectedAmount: true },
      }),
      this.prisma.rentSchedule.aggregate({
        where: {
          lease: leaseWhere,
          dueDate: { gte: quarterStart, lte: quarterEnd },
        },
        _sum: { expectedAmount: true },
      }),
      this.prisma.rentSchedule.aggregate({
        where: {
          lease: leaseWhere,
          dueDate: { gte: quarterStart, lte: quarterEnd },
          status: ScheduleStatus.PAID,
        },
        _sum: { expectedAmount: true },
      }),
      this.prisma.rentSchedule.findMany({
        where: {
          lease: leaseWhere,
          status: { in: [ScheduleStatus.DUE, ScheduleStatus.PARTIAL] },
          dueDate: { lt: now },
        },
        include: { lease: { include: { property: true, unit: true, tenant: true } } },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      this.prisma.cheque.findMany({
        where: {
          ownerId,
          ...(propertyId && { propertyId }),
          chequeDate: { gte: now, lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
        },
        include: { lease: true, tenant: true, property: true, unit: true },
        orderBy: { chequeDate: 'asc' },
        take: 20,
      }),
      this.prisma.cheque.count({
        where: { ownerId, ...(propertyId && { propertyId }), status: ChequeStatus.BOUNCED },
      }),
      this.prisma.unit.count({ where: { ...unitWhere, status: 'VACANT' } }),
      this.prisma.unit.count({ where: { ...unitWhere, status: 'OCCUPIED' } }),
      this.prisma.lease.findMany({
        where: {
          ownerId,
          ...(propertyId && { propertyId }),
          endDate: { gte: now, lte: expiryEnd },
        },
        include: { property: true, unit: true, tenant: true },
        orderBy: { endDate: 'asc' },
        take: 20,
      }),
    ]);

    const [overdueAmount, totalTrackedExpected, totalTrackedReceived, totalChequeValueTracked, totalSecurityDepositsTracked] = await Promise.all([
      this.prisma.rentSchedule.aggregate({
        where: {
          lease: leaseWhere,
          status: { in: [ScheduleStatus.DUE, ScheduleStatus.PARTIAL] },
          dueDate: { lt: now },
        },
        _sum: { expectedAmount: true },
      }),
      this.prisma.rentSchedule.aggregate({
        where: { lease: leaseWhere },
        _sum: { expectedAmount: true },
      }),
      this.prisma.payment.aggregate({
        where: { ownerId },
        _sum: { amount: true },
      }),
      this.prisma.cheque.aggregate({
        where: { ownerId },
        _sum: { amount: true },
      }),
      this.prisma.lease.aggregate({
        where: { ownerId },
        _sum: { securityDeposit: true },
      }),
    ]);

    const monthExpectedVal = Number(monthExpected._sum.expectedAmount ?? 0);
    const monthPaidVal = Number(monthPaid._sum.expectedAmount ?? 0);
    const quarterExpectedVal = Number(quarterExpected._sum.expectedAmount ?? 0);
    const quarterPaidVal = Number(quarterPaid._sum.expectedAmount ?? 0);

    return {
      month: { expected: monthExpectedVal, received: monthPaidVal },
      quarter: { expected: quarterExpectedVal, received: quarterPaidVal },
      overdueAmount: Number(overdueAmount._sum.expectedAmount ?? 0),
      overdueSchedules,
      upcomingCheques,
      bouncedCount,
      unitStats: { vacant: vacantCount, occupied: occupiedCount },
      expiringLeases,
      totalTrackedExpected: Number(totalTrackedExpected._sum.expectedAmount ?? 0),
      totalTrackedReceived: Number(totalTrackedReceived._sum.amount ?? 0),
      totalChequeValueTracked: Number(totalChequeValueTracked._sum.amount ?? 0),
      totalSecurityDepositsTracked: Number(totalSecurityDepositsTracked._sum.securityDeposit ?? 0),
    };
  }

  async chequesCsv(ownerId: string, propertyId?: string, from?: string, to?: string) {
    const where: { ownerId: string; propertyId?: string; chequeDate?: { gte?: Date; lte?: Date } } = { ownerId };
    if (propertyId) where.propertyId = propertyId;
    if (from || to) {
      where.chequeDate = {};
      if (from) where.chequeDate.gte = new Date(from);
      if (to) where.chequeDate.lte = new Date(to);
    }
    const rows = await this.prisma.cheque.findMany({
      where,
      include: { tenant: true, property: true, unit: true },
      orderBy: { chequeDate: 'asc' },
    });
    const headers = ['id', 'chequeNumber', 'bankName', 'chequeDate', 'amount', 'coversPeriod', 'status', 'depositDate', 'clearedOrBounceDate', 'bounceReason', 'tenantName', 'propertyName', 'unitNo'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const row = [
        r.id,
        r.chequeNumber,
        r.bankName,
        r.chequeDate.toISOString().slice(0, 10),
        r.amount.toString(),
        `"${(r.coversPeriod || '').replace(/"/g, '""')}"`,
        r.status,
        r.depositDate?.toISOString().slice(0, 10) ?? '',
        r.clearedOrBounceDate?.toISOString().slice(0, 10) ?? '',
        `"${(r.bounceReason || '').replace(/"/g, '""')}"`,
        `"${(r.tenant?.name ?? '').replace(/"/g, '""')}"`,
        `"${(r.property?.name ?? '').replace(/"/g, '""')}"`,
        r.unit?.unitNo ?? '',
      ];
      lines.push(row.join(','));
    }
    return lines.join('\n');
  }

  async rentScheduleCsv(ownerId: string, propertyId?: string, from?: string, to?: string) {
    const leaseWhere: { ownerId: string; propertyId?: string } = { ownerId };
    if (propertyId) leaseWhere.propertyId = propertyId;
    const dueDateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dueDateFilter.gte = new Date(from);
    if (to) dueDateFilter.lte = new Date(to);
    const rows = await this.prisma.rentSchedule.findMany({
      where: {
        lease: leaseWhere,
        ...(Object.keys(dueDateFilter).length ? { dueDate: dueDateFilter } : {}),
      },
      include: { lease: { include: { property: true, unit: true, tenant: true } } },
      orderBy: { dueDate: 'asc' },
    });
    const headers = ['id', 'dueDate', 'expectedAmount', 'paidAmount', 'status', 'leaseId', 'tenantName', 'propertyName', 'unitNo'];
    const lines = [headers.join(',')];
    for (const r of rows) {
      const row = [
        r.id,
        r.dueDate.toISOString().slice(0, 10),
        r.expectedAmount.toString(),
        r.paidAmount?.toString() ?? '',
        r.status,
        r.leaseId,
        `"${(r.lease?.tenant?.name || '').replace(/"/g, '""')}"`,
        `"${(r.lease?.property?.name || '').replace(/"/g, '""')}"`,
        r.lease?.unit?.unitNo ?? '',
      ];
      lines.push(row.join(','));
    }
    return lines.join('\n');
  }
}
