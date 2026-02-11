import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { ScheduleStatus, ChequeStatus } from '@prisma/client';

@Injectable()
export class ReportsService {
  constructor(
    private prisma: PrismaService,
    private accessService: AccessService,
  ) {}

  async dashboard(userId: string, role: UserRole, propertyId?: string) {
    const accessibleIds =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN ? [] : await this.accessService.getAccessiblePropertyIds(userId, role);
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN && accessibleIds.length === 0) {
      return this.emptyDashboardResponse();
    }
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
    const quarterEnd = new Date(quarterStart.getFullYear(), quarterStart.getMonth() + 3, 0);

    const leaseWhere: Record<string, unknown> =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId, archivedAt: null, ...(propertyId && { propertyId }) }
        : { propertyId: propertyId ? propertyId : { in: accessibleIds }, archivedAt: null };
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN && propertyId) {
      if (!accessibleIds.includes(propertyId)) {
        return this.emptyDashboardResponse();
      }
    }

    const expiryEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const propertyWhere: Record<string, unknown> =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId, archivedAt: null, ...(propertyId && { id: propertyId }) }
        : { id: propertyId ? propertyId : { in: accessibleIds }, archivedAt: null };

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
        include: { lease: { include: { property: true, tenant: true } } },
        orderBy: { dueDate: 'asc' },
        take: 50,
      }),
      this.prisma.cheque.findMany({
        where: {
          ...(role === UserRole.USER || role === UserRole.SUPER_ADMIN ? { ownerId: userId } : { propertyId: propertyId ?? { in: accessibleIds } }),
          ...(propertyId && (role === UserRole.USER || role === UserRole.SUPER_ADMIN) ? { propertyId } : {}),
          chequeDate: { gte: now, lte: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000) },
          archivedAt: null,
        },
        include: { lease: true, tenant: true, property: true },
        orderBy: { chequeDate: 'asc' },
        take: 20,
      }),
      this.prisma.cheque.count({
        where: {
          ...(role === UserRole.USER || role === UserRole.SUPER_ADMIN ? { ownerId: userId } : { propertyId: propertyId ?? { in: accessibleIds } }),
          status: ChequeStatus.BOUNCED,
          archivedAt: null,
        },
      }),
      this.prisma.property.count({ where: { ...propertyWhere, status: 'VACANT' } }),
      this.prisma.property.count({ where: { ...propertyWhere, status: 'OCCUPIED' } }),
      this.prisma.lease.findMany({
        where: {
          ...(role === UserRole.USER || role === UserRole.SUPER_ADMIN ? { ownerId: userId } : { propertyId: propertyId ?? { in: accessibleIds } }),
          endDate: { gte: now, lte: expiryEnd },
          archivedAt: null,
        },
        include: { property: true, tenant: true },
        orderBy: { endDate: 'asc' },
        take: 20,
      }),
    ]);

    const paymentWhere =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId, archivedAt: null, ...(propertyId && { propertyId }) }
        : { propertyId: propertyId ?? { in: accessibleIds }, archivedAt: null };
    const chequeWhere =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId, archivedAt: null, ...(propertyId && { propertyId }) }
        : { propertyId: propertyId ?? { in: accessibleIds }, archivedAt: null };
    const leaseWhereForDeposits =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId, archivedAt: null, ...(propertyId && { propertyId }) }
        : { propertyId: propertyId ?? { in: accessibleIds }, archivedAt: null };

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
        where: paymentWhere as { ownerId?: string; propertyId?: string | { in: string[] } },
        _sum: { amount: true },
      }),
      this.prisma.cheque.aggregate({
        where: chequeWhere as { ownerId?: string; propertyId?: string | { in: string[] } },
        _sum: { amount: true },
      }),
      this.prisma.lease.aggregate({
        where: leaseWhereForDeposits as { ownerId?: string; propertyId?: string | { in: string[] } },
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

  private emptyDashboardResponse() {
    return {
      month: { expected: 0, received: 0 },
      quarter: { expected: 0, received: 0 },
      overdueAmount: 0,
      overdueSchedules: [],
      upcomingCheques: [],
      bouncedCount: 0,
      unitStats: { vacant: 0, occupied: 0 },
      expiringLeases: [],
      totalTrackedExpected: 0,
      totalTrackedReceived: 0,
      totalChequeValueTracked: 0,
      totalSecurityDepositsTracked: 0,
    };
  }

  async chequesCsv(userId: string, role: UserRole, propertyId?: string, from?: string, to?: string) {
    const where: { ownerId?: string; propertyId?: string | { in: string[] }; chequeDate?: { gte?: Date; lte?: Date }; archivedAt: null } =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN ? { ownerId: userId, archivedAt: null } : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) }, archivedAt: null };
    if (propertyId) where.propertyId = propertyId;
    if (from || to) {
      where.chequeDate = {};
      if (from) where.chequeDate.gte = new Date(from);
      if (to) where.chequeDate.lte = new Date(to);
    }
    const rows = await this.prisma.cheque.findMany({
      where,
      include: { tenant: true, property: true },
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
        r.property?.unitNo ?? '',
      ];
      lines.push(row.join(','));
    }
    return lines.join('\n');
  }

  async rentScheduleCsv(userId: string, role: UserRole, propertyId?: string, from?: string, to?: string) {
    const leaseWhere: { ownerId?: string; propertyId?: string | { in: string[] }; archivedAt: null } =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN ? { ownerId: userId, archivedAt: null } : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) }, archivedAt: null };
    if (propertyId) leaseWhere.propertyId = propertyId;
    const dueDateFilter: { gte?: Date; lte?: Date } = {};
    if (from) dueDateFilter.gte = new Date(from);
    if (to) dueDateFilter.lte = new Date(to);
    const rows = await this.prisma.rentSchedule.findMany({
      where: {
        lease: leaseWhere,
        ...(Object.keys(dueDateFilter).length ? { dueDate: dueDateFilter } : {}),
      },
      include: { lease: { include: { property: true, tenant: true } } },
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
        r.lease?.property?.unitNo ?? '',
      ];
      lines.push(row.join(','));
    }
    return lines.join('\n');
  }
}
