import { PrismaClient, Country, Currency, UnitStatus, RentFrequency, ChequeStatus, PaymentMethod, ScheduleStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash('password123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'owner@example.com' },
    update: {},
    create: {
      email: 'owner@example.com',
      password: hashed,
      name: 'Demo Owner',
    },
  });

  // ========== INDIA PROPERTIES ==========
  const propMumbai = await prisma.property.upsert({
    where: { id: 'seed-property-in-1' },
    update: {},
    create: {
      id: 'seed-property-in-1',
      name: 'Mumbai Apartment',
      address: 'Andheri West, Mumbai 400058',
      country: Country.IN,
      emirateOrState: 'Maharashtra',
      currency: Currency.INR,
      notes: 'India property - monthly rent',
      ownerId: user.id,
    },
  });

  const unitMumbai101 = await prisma.unit.upsert({
    where: { id: 'seed-unit-mum-101' },
    update: {},
    create: {
      id: 'seed-unit-mum-101',
      unitNo: '101',
      bedrooms: 2,
      status: UnitStatus.OCCUPIED,
      propertyId: propMumbai.id,
    },
  });

  const unitMumbai102 = await prisma.unit.upsert({
    where: { id: 'seed-unit-mum-102' },
    update: {},
    create: {
      id: 'seed-unit-mum-102',
      unitNo: '102',
      bedrooms: 3,
      status: UnitStatus.OCCUPIED,
      propertyId: propMumbai.id,
    },
  });

  const unitMumbai201 = await prisma.unit.upsert({
    where: { id: 'seed-unit-mum-201' },
    update: {},
    create: {
      id: 'seed-unit-mum-201',
      unitNo: '201',
      bedrooms: 2,
      status: UnitStatus.VACANT,
      propertyId: propMumbai.id,
    },
  });

  const propBangalore = await prisma.property.create({
    data: {
      name: 'Koramangala Residency',
      address: 'Koramangala 5th Block, Bengaluru 560034',
      country: Country.IN,
      emirateOrState: 'Karnataka',
      currency: Currency.INR,
      notes: 'Bangalore property',
      ownerId: user.id,
    },
  });

  const unitBlr1 = await prisma.unit.create({
    data: { unitNo: 'A-101', bedrooms: 2, status: UnitStatus.OCCUPIED, propertyId: propBangalore.id },
  });
  const unitBlr2 = await prisma.unit.create({
    data: { unitNo: 'A-102', bedrooms: 2, status: UnitStatus.OCCUPIED, propertyId: propBangalore.id },
  });

  const propDelhi = await prisma.property.create({
    data: {
      name: 'Saket Greens',
      address: 'Saket, New Delhi 110017',
      country: Country.IN,
      emirateOrState: 'Delhi',
      currency: Currency.INR,
      ownerId: user.id,
    },
  });

  const unitDelhi1 = await prisma.unit.create({
    data: { unitNo: '101', bedrooms: 3, status: UnitStatus.OCCUPIED, propertyId: propDelhi.id },
  });

  // ========== UAE PROPERTIES ==========
  const propDubaiMarina = await prisma.property.upsert({
    where: { id: 'seed-property-ae-1' },
    update: {},
    create: {
      id: 'seed-property-ae-1',
      name: 'Dubai Marina Tower',
      address: 'Marina, Dubai',
      country: Country.AE,
      emirateOrState: 'Dubai',
      currency: Currency.AED,
      notes: 'Dubai property - quarterly rent',
      ownerId: user.id,
    },
  });

  const unitMarina2201 = await prisma.unit.upsert({
    where: { id: 'seed-unit-ae-2201' },
    update: {},
    create: {
      id: 'seed-unit-ae-2201',
      unitNo: '2201',
      bedrooms: 3,
      status: UnitStatus.OCCUPIED,
      propertyId: propDubaiMarina.id,
    },
  });

  const unitMarina2202 = await prisma.unit.create({
    data: { unitNo: '2202', bedrooms: 2, status: UnitStatus.OCCUPIED, propertyId: propDubaiMarina.id },
  });

  const propJBR = await prisma.property.create({
    data: {
      name: 'JBR The Walk',
      address: 'Jumeirah Beach Residence, Dubai',
      country: Country.AE,
      emirateOrState: 'Dubai',
      currency: Currency.AED,
      ownerId: user.id,
    },
  });

  const unitJBR1 = await prisma.unit.create({
    data: { unitNo: '1505', bedrooms: 2, status: UnitStatus.OCCUPIED, propertyId: propJBR.id },
  });

  const propDowntown = await prisma.property.create({
    data: {
      name: 'Downtown Boulevard',
      address: 'Downtown Dubai',
      country: Country.AE,
      emirateOrState: 'Dubai',
      currency: Currency.AED,
      ownerId: user.id,
    },
  });

  const unitDowntown1 = await prisma.unit.create({
    data: { unitNo: '3201', bedrooms: 4, status: UnitStatus.VACANT, propertyId: propDowntown.id },
  });

  // ========== TENANTS ==========
  const tenantRaj = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-raj' },
    update: {},
    create: {
      id: 'seed-tenant-raj',
      name: 'Raj Sharma',
      phone: '+91 98765 43210',
      email: 'raj@example.com',
      idNumber: 'XXXX XXXX 1234',
      notes: 'India tenant - monthly',
      ownerId: user.id,
    },
  });

  const tenantAhmed = await prisma.tenant.upsert({
    where: { id: 'seed-tenant-ahmed' },
    update: {},
    create: {
      id: 'seed-tenant-ahmed',
      name: 'Ahmed Al Maktoum',
      phone: '+971 50 123 4567',
      email: 'ahmed@example.ae',
      notes: 'Dubai tenant - quarterly PDC',
      ownerId: user.id,
    },
  });

  const tenantPriya = await prisma.tenant.create({
    data: {
      name: 'Priya Nair',
      phone: '+91 99887 76543',
      email: 'priya@example.com',
      ownerId: user.id,
    },
  });

  const tenantVikram = await prisma.tenant.create({
    data: {
      name: 'Vikram Singh',
      phone: '+91 91234 56789',
      email: 'vikram@example.com',
      idNumber: 'Aadhaar **** 5678',
      ownerId: user.id,
    },
  });

  const tenantSuresh = await prisma.tenant.create({
    data: {
      name: 'Suresh Reddy',
      phone: '+91 98765 11111',
      ownerId: user.id,
    },
  });

  const tenantFatima = await prisma.tenant.create({
    data: {
      name: 'Fatima Hassan',
      phone: '+971 55 999 8888',
      email: 'fatima@example.ae',
      ownerId: user.id,
    },
  });

  const tenantOmar = await prisma.tenant.create({
    data: {
      name: 'Omar Khalid',
      phone: '+971 50 222 3333',
      ownerId: user.id,
    },
  });

  // ========== LEASES + RENT SCHEDULES ==========
  const leaseMumbai101 = await prisma.lease.upsert({
    where: { id: 'seed-lease-mum-101' },
    update: {},
    create: {
      id: 'seed-lease-mum-101',
      propertyId: propMumbai.id,
      unitId: unitMumbai101.id,
      tenantId: tenantRaj.id,
      ownerId: user.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      rentFrequency: RentFrequency.MONTHLY,
      installmentAmount: 45000,
      dueDay: 5,
      securityDeposit: 90000,
      notes: 'India monthly lease',
    },
  });

  const mumbaiScheduleDates: Date[] = [];
  for (let m = 1; m <= 12; m++) {
    mumbaiScheduleDates.push(new Date(2026, m - 1, 5));
  }
  const mumbaiSchedules = await prisma.rentSchedule.findMany({
    where: { leaseId: leaseMumbai101.id },
    orderBy: { dueDate: 'asc' },
  });
  if (mumbaiSchedules.length === 0) {
    await prisma.rentSchedule.createMany({
      data: mumbaiScheduleDates.map((dueDate, i) => ({
        leaseId: leaseMumbai101.id,
        dueDate,
        expectedAmount: 45000,
        status: i < 2 ? ScheduleStatus.PAID : i === 2 ? ScheduleStatus.PARTIAL : ScheduleStatus.DUE,
        paidAmount: i < 2 ? 45000 : i === 2 ? 25000 : null,
      })),
    });
  } else {
    for (let i = 0; i < Math.min(3, mumbaiSchedules.length); i++) {
      await prisma.rentSchedule.update({
        where: { id: mumbaiSchedules[i].id },
        data: {
          status: i < 2 ? ScheduleStatus.PAID : ScheduleStatus.PARTIAL,
          paidAmount: i < 2 ? 45000 : 25000,
        },
      });
    }
  }

  const leaseMumbai102 = await prisma.lease.create({
    data: {
      propertyId: propMumbai.id,
      unitId: unitMumbai102.id,
      tenantId: tenantPriya.id,
      ownerId: user.id,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2027-01-31'),
      rentFrequency: RentFrequency.MONTHLY,
      installmentAmount: 52000,
      dueDay: 10,
      securityDeposit: 104000,
      notes: '2BHK premium',
    },
  });
  for (let m = 2; m <= 12; m++) {
    await prisma.rentSchedule.create({
      data: {
        leaseId: leaseMumbai102.id,
        dueDate: new Date(2026, m - 1, 10),
        expectedAmount: 52000,
        status: m <= 3 ? ScheduleStatus.PAID : ScheduleStatus.DUE,
        paidAmount: m <= 3 ? 52000 : null,
      },
    });
  }

  const leaseBlr = await prisma.lease.create({
    data: {
      propertyId: propBangalore.id,
      unitId: unitBlr1.id,
      tenantId: tenantVikram.id,
      ownerId: user.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      rentFrequency: RentFrequency.MONTHLY,
      installmentAmount: 38000,
      dueDay: 1,
      securityDeposit: 76000,
    },
  });
  for (let m = 1; m <= 12; m++) {
    await prisma.rentSchedule.create({
      data: {
        leaseId: leaseBlr.id,
        dueDate: new Date(2026, m - 1, 1),
        expectedAmount: 38000,
        status: m <= 1 ? ScheduleStatus.PAID : ScheduleStatus.DUE,
        paidAmount: m <= 1 ? 38000 : null,
      },
    });
  }

  const leaseBlr2 = await prisma.lease.create({
    data: {
      propertyId: propBangalore.id,
      unitId: unitBlr2.id,
      tenantId: tenantSuresh.id,
      ownerId: user.id,
      startDate: new Date('2026-03-01'),
      endDate: new Date('2027-02-28'),
      rentFrequency: RentFrequency.MONTHLY,
      installmentAmount: 36000,
      dueDay: 5,
    },
  });
  for (let m = 3; m <= 12; m++) {
    await prisma.rentSchedule.create({
      data: {
        leaseId: leaseBlr2.id,
        dueDate: new Date(2026, m - 1, 5),
        expectedAmount: 36000,
        status: 'DUE',
      },
    });
  }

  const leaseDelhi = await prisma.lease.create({
    data: {
      propertyId: propDelhi.id,
      unitId: unitDelhi1.id,
      tenantId: tenantVikram.id,
      ownerId: user.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      rentFrequency: RentFrequency.YEARLY,
      installmentAmount: 600000,
      dueDay: 1,
      securityDeposit: 100000,
    },
  });
  await prisma.rentSchedule.create({
    data: {
      leaseId: leaseDelhi.id,
      dueDate: new Date(2026, 0, 1),
      expectedAmount: 600000,
      status: ScheduleStatus.PAID,
      paidAmount: 600000,
    },
  });

  const leaseDubaiMarina = await prisma.lease.upsert({
    where: { id: 'seed-lease-ae-marina' },
    update: {},
    create: {
      id: 'seed-lease-ae-marina',
      propertyId: propDubaiMarina.id,
      unitId: unitMarina2201.id,
      tenantId: tenantAhmed.id,
      ownerId: user.id,
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      rentFrequency: RentFrequency.QUARTERLY,
      installmentAmount: 45000,
      dueDay: 1,
      securityDeposit: 90000,
      notes: 'Dubai quarterly lease',
    },
  });

  const marinaSchedules = await prisma.rentSchedule.findMany({ where: { leaseId: leaseDubaiMarina.id } });
  if (marinaSchedules.length === 0) {
    const qDates = [new Date(2026, 0, 1), new Date(2026, 3, 1), new Date(2026, 6, 1), new Date(2026, 9, 1)];
    await prisma.rentSchedule.createMany({
      data: qDates.map((dueDate, i) => ({
        leaseId: leaseDubaiMarina.id,
        dueDate,
        expectedAmount: 45000,
        status: i === 0 ? ScheduleStatus.PAID : ScheduleStatus.DUE,
        paidAmount: i === 0 ? 45000 : null,
      })),
    });
  }

  const leaseMarina2202 = await prisma.lease.create({
    data: {
      propertyId: propDubaiMarina.id,
      unitId: unitMarina2202.id,
      tenantId: tenantFatima.id,
      ownerId: user.id,
      startDate: new Date('2026-02-01'),
      endDate: new Date('2026-12-31'),
      rentFrequency: RentFrequency.QUARTERLY,
      installmentAmount: 38000,
      dueDay: 1,
    },
  });
  const q2Dates = [new Date(2026, 2, 1), new Date(2026, 5, 1), new Date(2026, 8, 1)];
  for (const d of q2Dates) {
    await prisma.rentSchedule.create({
      data: { leaseId: leaseMarina2202.id, dueDate: d, expectedAmount: 38000, status: 'DUE' },
    });
  }

  const leaseJBR = await prisma.lease.create({
    data: {
      propertyId: propJBR.id,
      unitId: unitJBR1.id,
      tenantId: tenantOmar.id,
      ownerId: user.id,
      startDate: new Date('2026-01-15'),
      endDate: new Date('2026-12-15'),
      rentFrequency: RentFrequency.MONTHLY,
      installmentAmount: 12000,
      dueDay: 15,
    },
  });
  for (let m = 1; m <= 12; m++) {
    await prisma.rentSchedule.create({
      data: {
        leaseId: leaseJBR.id,
        dueDate: new Date(2026, m - 1, 15),
        expectedAmount: 12000,
        status: m <= 1 ? ScheduleStatus.PAID : ScheduleStatus.DUE,
        paidAmount: m <= 1 ? 12000 : null,
      },
    });
  }

  // ========== CHEQUES ==========
  await prisma.cheque.upsert({
    where: { id: 'seed-cheque-dq1' },
    update: {},
    create: {
      id: 'seed-cheque-dq1',
      leaseId: leaseDubaiMarina.id,
      tenantId: tenantAhmed.id,
      propertyId: propDubaiMarina.id,
      unitId: unitMarina2201.id,
      ownerId: user.id,
      chequeNumber: 'DQ001',
      bankName: 'Emirates NBD',
      chequeDate: new Date(2026, 0, 1),
      amount: 45000,
      coversPeriod: 'Q1 2026 Rent',
      status: ChequeStatus.CLEARED,
      depositDate: new Date(2026, 0, 2),
      clearedOrBounceDate: new Date(2026, 0, 5),
    },
  });

  await prisma.cheque.upsert({
    where: { id: 'seed-cheque-dq2' },
    update: {},
    create: {
      id: 'seed-cheque-dq2',
      leaseId: leaseDubaiMarina.id,
      tenantId: tenantAhmed.id,
      propertyId: propDubaiMarina.id,
      unitId: unitMarina2201.id,
      ownerId: user.id,
      chequeNumber: 'DQ002',
      bankName: 'Emirates NBD',
      chequeDate: new Date(2026, 3, 1),
      amount: 45000,
      coversPeriod: 'Q2 2026 Rent',
      status: ChequeStatus.DEPOSITED,
      depositDate: new Date(2026, 2, 28),
    },
  });

  await prisma.cheque.upsert({
    where: { id: 'seed-cheque-dq3' },
    update: {},
    create: {
      id: 'seed-cheque-dq3',
      leaseId: leaseDubaiMarina.id,
      tenantId: tenantAhmed.id,
      propertyId: propDubaiMarina.id,
      unitId: unitMarina2201.id,
      ownerId: user.id,
      chequeNumber: 'DQ003',
      bankName: 'Emirates NBD',
      chequeDate: new Date(2026, 6, 1),
      amount: 45000,
      coversPeriod: 'Q3 2026 Rent',
      status: ChequeStatus.RECEIVED,
    },
  });

  await prisma.cheque.createMany({
    data: [
      {
        leaseId: leaseMumbai101.id,
        tenantId: tenantRaj.id,
        propertyId: propMumbai.id,
        unitId: unitMumbai101.id,
        ownerId: user.id,
        chequeNumber: 'INR-001',
        bankName: 'HDFC Bank',
        chequeDate: new Date(2026, 0, 5),
        amount: 45000,
        coversPeriod: 'Jan 2026 Rent',
        status: ChequeStatus.CLEARED,
        depositDate: new Date(2026, 0, 6),
        clearedOrBounceDate: new Date(2026, 0, 8),
      },
      {
        leaseId: leaseMumbai101.id,
        tenantId: tenantRaj.id,
        propertyId: propMumbai.id,
        unitId: unitMumbai101.id,
        ownerId: user.id,
        chequeNumber: 'INR-002',
        bankName: 'HDFC Bank',
        chequeDate: new Date(2026, 1, 5),
        amount: 45000,
        coversPeriod: 'Feb 2026 Rent',
        status: ChequeStatus.CLEARED,
        depositDate: new Date(2026, 1, 6),
        clearedOrBounceDate: new Date(2026, 1, 9),
      },
      {
        leaseId: leaseMumbai101.id,
        tenantId: tenantRaj.id,
        propertyId: propMumbai.id,
        unitId: unitMumbai101.id,
        ownerId: user.id,
        chequeNumber: 'INR-003',
        bankName: 'HDFC Bank',
        chequeDate: new Date(2026, 2, 5),
        amount: 45000,
        coversPeriod: 'Mar 2026 Rent',
        status: ChequeStatus.RECEIVED,
      },
      {
        leaseId: leaseMumbai102.id,
        tenantId: tenantPriya.id,
        propertyId: propMumbai.id,
        unitId: unitMumbai102.id,
        ownerId: user.id,
        chequeNumber: 'INR-P01',
        bankName: 'ICICI Bank',
        chequeDate: new Date(2026, 3, 10),
        amount: 52000,
        coversPeriod: 'Apr 2026 Rent',
        status: ChequeStatus.BOUNCED,
        depositDate: new Date(2026, 3, 11),
        clearedOrBounceDate: new Date(2026, 3, 14),
        bounceReason: 'Insufficient funds',
      },
    ],
  });

  // ========== PAYMENTS ==========
  const pay1 = await prisma.payment.create({
    data: {
      leaseId: leaseMumbai101.id,
      tenantId: tenantRaj.id,
      propertyId: propMumbai.id,
      unitId: unitMumbai101.id,
      ownerId: user.id,
      date: new Date(2026, 0, 5),
      amount: 45000,
      method: PaymentMethod.BANK_TRANSFER,
      reference: 'NEFT123456789',
      notes: 'Jan 2026 rent',
    },
  });

  const pay2 = await prisma.payment.create({
    data: {
      leaseId: leaseBlr.id,
      tenantId: tenantVikram.id,
      propertyId: propBangalore.id,
      unitId: unitBlr1.id,
      ownerId: user.id,
      date: new Date(2026, 0, 2),
      amount: 38000,
      method: PaymentMethod.UPI,
      reference: 'UPI987654321',
    },
  });

  const pay3 = await prisma.payment.create({
    data: {
      leaseId: leaseJBR.id,
      tenantId: tenantOmar.id,
      propertyId: propJBR.id,
      unitId: unitJBR1.id,
      ownerId: user.id,
      date: new Date(2026, 0, 15),
      amount: 12000,
      method: PaymentMethod.CASH,
      notes: 'Jan 2026 rent',
    },
  });

  const pay4 = await prisma.payment.create({
    data: {
      leaseId: leaseDelhi.id,
      tenantId: tenantVikram.id,
      propertyId: propDelhi.id,
      unitId: unitDelhi1.id,
      ownerId: user.id,
      date: new Date(2026, 0, 1),
      amount: 600000,
      method: PaymentMethod.BANK_TRANSFER,
      reference: 'YEARLY-RENT-2026',
    },
  });

  // Match payments to rent schedules (so PAID status is reflected)
  const mumSchedJan = await prisma.rentSchedule.findFirst({
    where: { leaseId: leaseMumbai101.id, dueDate: new Date(2026, 0, 5) },
  });
  if (mumSchedJan) {
    await prisma.paymentScheduleMatch.upsert({
      where: {
        paymentId_rentScheduleId: { paymentId: pay1.id, rentScheduleId: mumSchedJan.id },
      },
      update: {},
      create: {
        paymentId: pay1.id,
        rentScheduleId: mumSchedJan.id,
        amount: 45000,
      },
    });
    await prisma.rentSchedule.update({
      where: { id: mumSchedJan.id },
      data: { status: ScheduleStatus.PAID, paidAmount: 45000 },
    });
  }

  const blrSchedJan = await prisma.rentSchedule.findFirst({
    where: { leaseId: leaseBlr.id, dueDate: new Date(2026, 0, 1) },
  });
  if (blrSchedJan) {
    await prisma.paymentScheduleMatch.upsert({
      where: {
        paymentId_rentScheduleId: { paymentId: pay2.id, rentScheduleId: blrSchedJan.id },
      },
      update: {},
      create: {
        paymentId: pay2.id,
        rentScheduleId: blrSchedJan.id,
        amount: 38000,
      },
    });
    await prisma.rentSchedule.update({
      where: { id: blrSchedJan.id },
      data: { status: ScheduleStatus.PAID, paidAmount: 38000 },
    });
  }

  const jbrSchedJan = await prisma.rentSchedule.findFirst({
    where: { leaseId: leaseJBR.id, dueDate: new Date(2026, 0, 15) },
  });
  if (jbrSchedJan) {
    await prisma.paymentScheduleMatch.upsert({
      where: {
        paymentId_rentScheduleId: { paymentId: pay3.id, rentScheduleId: jbrSchedJan.id },
      },
      update: {},
      create: {
        paymentId: pay3.id,
        rentScheduleId: jbrSchedJan.id,
        amount: 12000,
      },
    });
    await prisma.rentSchedule.update({
      where: { id: jbrSchedJan.id },
      data: { status: ScheduleStatus.PAID, paidAmount: 12000 },
    });
  }

  const delhiSched = await prisma.rentSchedule.findFirst({
    where: { leaseId: leaseDelhi.id },
  });
  if (delhiSched) {
    await prisma.paymentScheduleMatch.upsert({
      where: {
        paymentId_rentScheduleId: { paymentId: pay4.id, rentScheduleId: delhiSched.id },
      },
      update: {},
      create: {
        paymentId: pay4.id,
        rentScheduleId: delhiSched.id,
        amount: 600000,
      },
    });
    await prisma.rentSchedule.update({
      where: { id: delhiSched.id },
      data: { status: ScheduleStatus.PAID, paidAmount: 600000 },
    });
  }

  console.log(
    'Seed completed. User:',
    user.email,
    '| 5 properties, multiple units, 8 tenants, 8 leases, cheques (incl. bounced), payments + matches.'
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
