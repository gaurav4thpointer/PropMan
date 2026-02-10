import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UsersService } from '../users/users.service';
import { Country, Currency, UnitStatus, RentFrequency, ChequeStatus, PaymentMethod, ScheduleStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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
          property: { select: { name: true, country: true, unitNo: true } },
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

  async resetUserPassword(userId: string, newPassword: string) {
    return this.usersService.resetPassword(userId, newPassword);
  }

  /** Add random sample data for a user (properties, units, tenants, leases, cheques, payments). */
  async addSampleData(userId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!targetUser) throw new NotFoundException('User not found');

    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
    const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5);

    const propNamesIN = [
      'Sunrise Apartments', 'Green Valley Residency', 'Palm Grove', 'Lake View Heights', 'Maple Towers',
      'Oakwood Estates', 'Riverside Plaza', 'Hill Crest Residency', 'Garden View', 'Silver Springs',
      'Coral Residency', 'Peacock Heights', 'Lotus Towers', 'Royal Greens', 'Emerald Park',
      'Sapphire Apartments', 'Golden Gate', 'Ivory Heights', 'Jasmine Residency', 'Meadow Brook',
    ];
    const propNamesAE = [
      'Marina Heights', 'JBR View Tower', 'Downtown Residency', 'Creek Vista', 'Palm Jumeirah Villa',
      'Business Bay Tower', 'JLT Lake View', 'DIFC Residency', 'Arabian Ranches Villa', 'JVC Gardens',
      'Dubai Hills Estate', 'Meydan Heights', 'City Walk Residency', 'Bluewaters View', 'Al Barsha Tower',
      'Discovery Gardens', 'Silicon Oasis', 'Sports City Residency', 'Motor City Villa', 'Emirates Living',
    ];
    const addressesIN = ['Mumbai 400058', 'Bengaluru 560034', 'Delhi 110017', 'Pune 411001', 'Hyderabad 500032', 'Chennai 600001', 'Kolkata 700001', 'Ahmedabad 380001'];
    const addressesAE = ['Dubai Marina', 'JBR The Walk', 'Downtown Dubai', 'Business Bay', 'JLT', 'DIFC', 'JVC', 'Al Barsha', 'Jumeirah', 'Deira'];
    const statesIN = ['Maharashtra', 'Karnataka', 'Delhi', 'Tamil Nadu', 'Telangana', 'West Bengal', 'Gujarat'];
    const firstNames = ['Rahul', 'Priya', 'Vikram', 'Anita', 'Suresh', 'Fatima', 'Omar', 'Lakshmi', 'Kiran', 'Deepa', 'Arun', 'Meera', 'Sanjay', 'Kavita', 'Rajesh', 'Pooja', 'Amit', 'Neha', 'Ravi', 'Anjali'];
    const lastNames = ['Sharma', 'Nair', 'Singh', 'Patel', 'Reddy', 'Khan', 'Kumar', 'Menon', 'Iyer', 'Gupta', 'Joshi', 'Desai', 'Pillai', 'Nair', 'Mehta', 'Shah', 'Rao', 'Verma', 'Malhotra', 'Chopra'];
    const bankNamesIN = ['HDFC Bank', 'ICICI Bank', 'SBI', 'Axis Bank', 'Kotak Mahindra'];
    const bankNamesAE = ['Emirates NBD', 'Mashreq Bank', 'ADCB', 'ENBD', 'Dubai Islamic Bank'];

    const now = new Date();
    const currentYear = now.getFullYear();

    const result = await this.prisma.$transaction(async (tx) => {
      const propertyIds: string[] = [];

      // 60 properties (one property = one rentable unit): 30 IN, 30 AE
      for (let i = 0; i < 60; i++) {
        const country: Country = i < 30 ? Country.IN : Country.AE;
        const currency = country === Country.IN ? Currency.INR : Currency.AED;
        const propNames = country === Country.IN ? propNamesIN : propNamesAE;
        const addresses = country === Country.IN ? addressesIN : addressesAE;
        const stateOrEmirate = country === Country.IN ? pick(statesIN) : 'Dubai';

        const prop = await tx.property.create({
          data: {
            ownerId: userId,
            name: `${propNames[i % propNames.length]} - ${String(100 + (i % 10) * 10 + (i % 3))}`,
            address: pick(addresses),
            country,
            emirateOrState: stateOrEmirate,
            currency,
            unitNo: String(100 + (i % 10) * 10 + (i % 3)),
            bedrooms: randInt(1, 4),
            status: UnitStatus.VACANT,
            notes: 'Sample data',
          },
        });
        propertyIds.push(prop.id);
      }

      // 40 tenants
      const tenantIds: string[] = [];
      for (let t = 0; t < 40; t++) {
        const country: Country = pick([Country.IN, Country.AE]);
        const tenant = await tx.tenant.create({
          data: {
            ownerId: userId,
            name: `${pick(firstNames)} ${pick(lastNames)}`,
            phone: country === Country.IN ? `+91 ${randInt(9000000000, 9999999999)}` : `+971 50 ${randInt(1000000, 9999999)}`,
            email: `sample${Date.now()}+${t}@example.com`,
          },
        });
        tenantIds.push(tenant.id);
      }

      // 60 leases: ~40% expired, ~60% current; vary dates and frequency
      const shuffledPropertyIds = shuffle(propertyIds);
      let totalCheques = 0;
      let totalPayments = 0;

      for (let L = 0; L < 60; L++) {
        const propertyId = shuffledPropertyIds[L];
        const prop = await tx.property.findUniqueOrThrow({ where: { id: propertyId } });
        const country: Country = prop.country;
        const currency = country === Country.IN ? Currency.INR : Currency.AED;
        const amount = country === Country.IN ? randInt(20000, 80000) : randInt(6000, 28000);
        const dueDay = randInt(1, 28);
        const freq = pick([RentFrequency.MONTHLY, RentFrequency.QUARTERLY, RentFrequency.YEARLY]);
        const tenantId = pick(tenantIds);

        // Expired: end in past (40%); current: end in future (60%)
        const isExpired = L < 24; // 24 expired, 36 current
        let startDate: Date;
        let endDate: Date;
        if (isExpired) {
          const endYear = currentYear - randInt(0, 1);
          const endMonth = randInt(0, 11);
          endDate = new Date(endYear, endMonth, Math.min(dueDay, 28));
          startDate = new Date(endYear - 1, endMonth, Math.min(dueDay, 28));
        } else {
          startDate = new Date(currentYear, randInt(0, 6), Math.min(dueDay, 28));
          endDate = new Date(currentYear + 1, randInt(0, 11), Math.min(dueDay, 28));
        }

        const lease = await tx.lease.create({
          data: {
            ownerId: userId,
            propertyId: prop.id,
            tenantId,
            startDate,
            endDate,
            rentFrequency: freq,
            installmentAmount: new Decimal(amount),
            dueDay,
            securityDeposit: new Decimal(Math.round(amount * 2)),
            notes: 'Sample lease',
          },
        });
        await tx.property.update({ where: { id: prop.id }, data: { status: UnitStatus.OCCUPIED } });

        const scheduleDates: Date[] = [];
        const day = Math.min(dueDay, 28);
        if (freq === RentFrequency.MONTHLY) {
          let d = new Date(startDate.getFullYear(), startDate.getMonth(), day);
          while (d <= endDate) {
            if (d >= startDate) scheduleDates.push(new Date(d));
            d.setMonth(d.getMonth() + 1);
          }
        } else if (freq === RentFrequency.QUARTERLY) {
          let d = new Date(startDate.getFullYear(), startDate.getMonth(), day);
          while (d <= endDate) {
            if (d >= startDate) scheduleDates.push(new Date(d));
            d.setMonth(d.getMonth() + 3);
          }
        } else {
          const d = new Date(startDate.getFullYear(), startDate.getMonth(), day);
          if (d >= startDate && d <= endDate) scheduleDates.push(d);
        }
        await tx.rentSchedule.createMany({
          data: scheduleDates.map((dueDate) => ({
            leaseId: lease.id,
            dueDate,
            expectedAmount: new Decimal(amount),
            status: pick([ScheduleStatus.DUE, ScheduleStatus.PAID, ScheduleStatus.OVERDUE, ScheduleStatus.PARTIAL]),
            paidAmount: Math.random() > 0.5 ? new Decimal(amount) : null,
          })),
        });
        const schedules = await tx.rentSchedule.findMany({
          where: { leaseId: lease.id },
          orderBy: { dueDate: 'asc' },
        });

        // 2–4 cheques per lease (varied status: RECEIVED, DEPOSITED, CLEARED, BOUNCED)
        const numC = randInt(2, 4);
        const banks = country === Country.IN ? bankNamesIN : bankNamesAE;
        for (let c = 0; c < numC && c < scheduleDates.length; c++) {
          const dueDate = scheduleDates[c];
          const chqStatus = pick([ChequeStatus.RECEIVED, ChequeStatus.DEPOSITED, ChequeStatus.CLEARED, ChequeStatus.BOUNCED]);
          const depositDate = chqStatus !== ChequeStatus.RECEIVED ? dueDate : null;
          const clearedDate = (chqStatus === ChequeStatus.CLEARED || chqStatus === ChequeStatus.BOUNCED) ? new Date(dueDate.getTime() + 5 * 86400000) : null;
          await tx.cheque.create({
            data: {
              leaseId: lease.id,
              tenantId,
              propertyId: prop.id,
              ownerId: userId,
              chequeNumber: `SMP-${randInt(10000, 99999)}`,
              bankName: pick(banks),
              chequeDate: dueDate,
              amount: new Decimal(amount),
              coversPeriod: dueDate.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }) + ' Rent',
              status: chqStatus,
              depositDate,
              clearedOrBounceDate: clearedDate,
              bounceReason: chqStatus === ChequeStatus.BOUNCED ? 'Insufficient funds' : null,
            },
          });
          totalCheques++;
        }

        // 2–4 payments per lease; match some to rent schedules
        const numP = randInt(2, 4);
        const methods = [PaymentMethod.BANK_TRANSFER, PaymentMethod.UPI, PaymentMethod.CHEQUE, PaymentMethod.CASH];
        for (let p = 0; p < numP && p < scheduleDates.length; p++) {
          const payDate = new Date(scheduleDates[p]);
          const pay = await tx.payment.create({
            data: {
              leaseId: lease.id,
              tenantId,
              propertyId: prop.id,
              ownerId: userId,
              date: payDate,
              amount: new Decimal(amount),
              method: pick(methods),
              reference: `SMP-${randInt(100000, 999999)}`,
              notes: 'Sample payment',
            },
          });
          totalPayments++;
          if (schedules.length > p) {
            const sched = schedules[p];
            if (sched) {
              await tx.rentSchedule.update({
                where: { id: sched.id },
                data: { status: ScheduleStatus.PAID, paidAmount: new Decimal(amount) },
              });
              await tx.paymentScheduleMatch.upsert({
                where: {
                  paymentId_rentScheduleId: { paymentId: pay.id, rentScheduleId: sched.id },
                },
                update: {},
                create: {
                  paymentId: pay.id,
                  rentScheduleId: sched.id,
                  amount: new Decimal(amount),
                },
              });
            }
          }
        }
      }

      return {
        properties: 60,
        tenants: 40,
        leases: 60,
        cheques: totalCheques,
        payments: totalPayments,
      };
    });

    return {
      message: 'Sample data added successfully',
      ...result,
    };
  }

  /** Get platform-wide enabled countries and currencies, plus all supported values. */
  async getCountryConfig() {
    const allCountries = Object.values(Country);
    const allCurrencies = Object.values(Currency);

    const settings = await this.prisma.platformSettings.findUnique({
      where: { id: 1 },
    });

    const enabledCountries = settings?.enabledCountries?.length
      ? settings.enabledCountries
      : allCountries;
    const enabledCurrencies = settings?.enabledCurrencies?.length
      ? settings.enabledCurrencies
      : allCurrencies;

    return {
      allCountries,
      allCurrencies,
      enabledCountries,
      enabledCurrencies,
    };
  }

  /** Update platform-wide enabled countries and currencies (super admin only). */
  async updateCountryConfig(enabledCountries: Country[], enabledCurrencies: Currency[]) {
    const allCountries = new Set(Object.values(Country));
    const allCurrencies = new Set(Object.values(Currency));

    const sanitizedCountries = enabledCountries.filter((c) => allCountries.has(c));
    const sanitizedCurrencies = enabledCurrencies.filter((c) => allCurrencies.has(c));

    const settings = await this.prisma.platformSettings.upsert({
      where: { id: 1 },
      update: {
        enabledCountries: sanitizedCountries,
        enabledCurrencies: sanitizedCurrencies,
      },
      create: {
        id: 1,
        enabledCountries: sanitizedCountries.length ? sanitizedCountries : Array.from(allCountries),
        enabledCurrencies: sanitizedCurrencies.length ? sanitizedCurrencies : Array.from(allCurrencies),
      },
    });

    return {
      enabledCountries: settings.enabledCountries,
      enabledCurrencies: settings.enabledCurrencies,
    };
  }
}
