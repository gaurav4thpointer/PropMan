import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private usersService: UsersService,
  ) {}

  async getStats() {
    const [
      totalUsers,
      totalProperties,
      totalUnits,
      totalLeases,
      totalTenants,
      totalCheques,
      totalPayments,
      usersByRole,
      propertiesByCountry,
      totalRentExpectedAllTime,
      totalRentReceivedAllTime,
      totalChequeValueTracked,
      totalSecurityDepositsTracked,
      rentExpectedByCurrency,
      rentReceivedByCurrency,
      chequeValueByCurrency,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.property.count(),
      this.prisma.unit.count(),
      this.prisma.lease.count(),
      this.prisma.tenant.count(),
      this.prisma.cheque.count(),
      this.prisma.payment.count(),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { id: true },
      }),
      this.prisma.property.groupBy({
        by: ['country'],
        _count: { id: true },
      }),
      this.prisma.rentSchedule.aggregate({ _sum: { expectedAmount: true } }),
      this.prisma.payment.aggregate({ _sum: { amount: true } }),
      this.prisma.cheque.aggregate({ _sum: { amount: true } }),
      this.prisma.lease.aggregate({ _sum: { securityDeposit: true } }),
      this.prisma.rentSchedule.groupBy({
        by: ['leaseId'],
        _sum: { expectedAmount: true },
      }).then(async (byLease) => {
        const leaseIds = byLease.map((x) => x.leaseId);
        const leases = leaseIds.length === 0 ? [] : await this.prisma.lease.findMany({
          where: { id: { in: leaseIds } },
          include: { property: { select: { currency: true } } },
        });
        const map = new Map(leases.map((l) => [l.id, l.property.currency]));
        const out: Record<string, number> = {};
        for (const row of byLease) {
          const currency = map.get(row.leaseId) ?? 'INR';
          const val = Number(row._sum.expectedAmount ?? 0);
          out[currency] = (out[currency] ?? 0) + val;
        }
        return out;
      }),
      this.prisma.payment.groupBy({
        by: ['propertyId'],
        _sum: { amount: true },
      }).then(async (byProp) => {
        const propIds = byProp.map((x) => x.propertyId);
        const props = propIds.length === 0 ? [] : await this.prisma.property.findMany({
          where: { id: { in: propIds } },
          select: { id: true, currency: true },
        });
        const map = new Map(props.map((p) => [p.id, p.currency]));
        const out: Record<string, number> = {};
        for (const row of byProp) {
          const currency = map.get(row.propertyId) ?? 'INR';
          const val = Number(row._sum.amount ?? 0);
          out[currency] = (out[currency] ?? 0) + val;
        }
        return out;
      }),
      this.prisma.cheque.groupBy({
        by: ['propertyId'],
        _sum: { amount: true },
      }).then(async (byProp) => {
        const propIds = byProp.map((x) => x.propertyId);
        const props = propIds.length === 0 ? [] : await this.prisma.property.findMany({
          where: { id: { in: propIds } },
          select: { id: true, currency: true },
        });
        const map = new Map(props.map((p) => [p.id, p.currency]));
        const out: Record<string, number> = {};
        for (const row of byProp) {
          const currency = map.get(row.propertyId) ?? 'INR';
          const val = Number(row._sum.amount ?? 0);
          out[currency] = (out[currency] ?? 0) + val;
        }
        return out;
      }),
    ]);

    const roleCounts = Object.fromEntries(
      usersByRole.map((r) => [r.role, r._count.id]),
    );
    const countryCounts = Object.fromEntries(
      propertiesByCountry.map((c) => [c.country, c._count.id]),
    );

    return {
      totalUsers,
      totalProperties,
      totalUnits,
      totalLeases,
      totalTenants,
      totalCheques,
      totalPayments,
      usersByRole: roleCounts,
      propertiesByCountry: countryCounts,
      totalRentExpectedAllTime: Number(totalRentExpectedAllTime._sum.expectedAmount ?? 0),
      totalRentReceivedAllTime: Number(totalRentReceivedAllTime._sum.amount ?? 0),
      totalChequeValueTracked: Number(totalChequeValueTracked._sum.amount ?? 0),
      totalSecurityDepositsTracked: Number(totalSecurityDepositsTracked._sum.securityDeposit ?? 0),
      rentExpectedByCurrency: rentExpectedByCurrency ?? {},
      rentReceivedByCurrency: rentReceivedByCurrency ?? {},
      chequeValueByCurrency: chequeValueByCurrency ?? {},
    };
  }

  async getRecentActivity(limit = 10) {
    const [recentLeases, recentPayments, recentUsers] = await Promise.all([
      this.prisma.lease.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { name: true, country: true } },
          unit: { select: { unitNo: true } },
          tenant: { select: { name: true } },
        },
      }),
      this.prisma.payment.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          property: { select: { name: true } },
          tenant: { select: { name: true } },
        },
      }),
      this.prisma.user.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, name: true, role: true, createdAt: true },
      }),
    ]);

    return {
      recentLeases,
      recentPayments,
      recentUsers,
    };
  }

  async getUsers(page: number, limit: number, search?: string) {
    return this.usersService.findAll(page, limit, search);
  }
}
