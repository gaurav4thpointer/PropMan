"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcrypt = require("bcrypt");
const prisma = new client_1.PrismaClient();
async function main() {
    const hashed = await bcrypt.hash('password123', 10);
    const adminHashed = await bcrypt.hash('admin123', 10);
    const user = await prisma.user.upsert({
        where: { email: 'owner@example.com' },
        update: {},
        create: {
            email: 'owner@example.com',
            password: hashed,
            name: 'Demo Owner',
        },
    });
    await prisma.user.upsert({
        where: { email: 'admin@propman.com' },
        update: { role: client_1.UserRole.SUPER_ADMIN, password: adminHashed, name: 'Super Admin' },
        create: {
            email: 'admin@propman.com',
            password: adminHashed,
            name: 'Super Admin',
            role: client_1.UserRole.SUPER_ADMIN,
        },
    });
    const propMumbai101 = await prisma.property.upsert({
        where: { id: 'seed-property-in-101' },
        update: {},
        create: {
            id: 'seed-property-in-101',
            name: 'Mumbai Apartment - 101',
            address: 'Andheri West, Mumbai 400058',
            country: client_1.Country.IN,
            emirateOrState: 'Maharashtra',
            currency: client_1.Currency.INR,
            unitNo: '101',
            bedrooms: 2,
            status: client_1.UnitStatus.OCCUPIED,
            notes: 'India property - monthly rent',
            ownerId: user.id,
        },
    });
    const propMumbai102 = await prisma.property.upsert({
        where: { id: 'seed-property-in-102' },
        update: {},
        create: {
            id: 'seed-property-in-102',
            name: 'Mumbai Apartment - 102',
            address: 'Andheri West, Mumbai 400058',
            country: client_1.Country.IN,
            emirateOrState: 'Maharashtra',
            currency: client_1.Currency.INR,
            unitNo: '102',
            bedrooms: 3,
            status: client_1.UnitStatus.OCCUPIED,
            notes: 'India property',
            ownerId: user.id,
        },
    });
    const propMumbai201 = await prisma.property.upsert({
        where: { id: 'seed-property-in-201' },
        update: {},
        create: {
            id: 'seed-property-in-201',
            name: 'Mumbai Apartment - 201',
            address: 'Andheri West, Mumbai 400058',
            country: client_1.Country.IN,
            emirateOrState: 'Maharashtra',
            currency: client_1.Currency.INR,
            unitNo: '201',
            bedrooms: 2,
            status: client_1.UnitStatus.VACANT,
            ownerId: user.id,
        },
    });
    const propBlr1 = await prisma.property.create({
        data: {
            name: 'Koramangala Residency - A-101',
            address: 'Koramangala 5th Block, Bengaluru 560034',
            country: client_1.Country.IN,
            emirateOrState: 'Karnataka',
            currency: client_1.Currency.INR,
            unitNo: 'A-101',
            bedrooms: 2,
            status: client_1.UnitStatus.OCCUPIED,
            notes: 'Bangalore property',
            ownerId: user.id,
        },
    });
    const propBlr2 = await prisma.property.create({
        data: {
            name: 'Koramangala Residency - A-102',
            address: 'Koramangala 5th Block, Bengaluru 560034',
            country: client_1.Country.IN,
            emirateOrState: 'Karnataka',
            currency: client_1.Currency.INR,
            unitNo: 'A-102',
            bedrooms: 2,
            status: client_1.UnitStatus.OCCUPIED,
            ownerId: user.id,
        },
    });
    const propDelhi1 = await prisma.property.create({
        data: {
            name: 'Saket Greens - 101',
            address: 'Saket, New Delhi 110017',
            country: client_1.Country.IN,
            emirateOrState: 'Delhi',
            currency: client_1.Currency.INR,
            unitNo: '101',
            bedrooms: 3,
            status: client_1.UnitStatus.OCCUPIED,
            ownerId: user.id,
        },
    });
    const propMarina2201 = await prisma.property.upsert({
        where: { id: 'seed-property-ae-2201' },
        update: {},
        create: {
            id: 'seed-property-ae-2201',
            name: 'Dubai Marina Tower - 2201',
            address: 'Marina, Dubai',
            country: client_1.Country.AE,
            emirateOrState: 'Dubai',
            currency: client_1.Currency.AED,
            unitNo: '2201',
            bedrooms: 3,
            status: client_1.UnitStatus.OCCUPIED,
            notes: 'Dubai property - quarterly rent',
            ownerId: user.id,
        },
    });
    const propMarina2202 = await prisma.property.create({
        data: {
            name: 'Dubai Marina Tower - 2202',
            address: 'Marina, Dubai',
            country: client_1.Country.AE,
            emirateOrState: 'Dubai',
            currency: client_1.Currency.AED,
            unitNo: '2202',
            bedrooms: 2,
            status: client_1.UnitStatus.OCCUPIED,
            ownerId: user.id,
        },
    });
    const propJBR1 = await prisma.property.create({
        data: {
            name: 'JBR The Walk - 1505',
            address: 'Jumeirah Beach Residence, Dubai',
            country: client_1.Country.AE,
            emirateOrState: 'Dubai',
            currency: client_1.Currency.AED,
            unitNo: '1505',
            bedrooms: 2,
            status: client_1.UnitStatus.OCCUPIED,
            ownerId: user.id,
        },
    });
    const propDowntown1 = await prisma.property.create({
        data: {
            name: 'Downtown Boulevard - 3201',
            address: 'Downtown Dubai',
            country: client_1.Country.AE,
            emirateOrState: 'Dubai',
            currency: client_1.Currency.AED,
            unitNo: '3201',
            bedrooms: 4,
            status: client_1.UnitStatus.VACANT,
            ownerId: user.id,
        },
    });
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
    const leaseMumbai101 = await prisma.lease.upsert({
        where: { id: 'seed-lease-mum-101' },
        update: {},
        create: {
            id: 'seed-lease-mum-101',
            propertyId: propMumbai101.id,
            tenantId: tenantRaj.id,
            ownerId: user.id,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            rentFrequency: client_1.RentFrequency.MONTHLY,
            installmentAmount: 45000,
            dueDay: 5,
            securityDeposit: 90000,
            notes: 'India monthly lease',
        },
    });
    const mumbaiScheduleDates = [];
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
                status: i < 2 ? client_1.ScheduleStatus.PAID : i === 2 ? client_1.ScheduleStatus.PARTIAL : client_1.ScheduleStatus.DUE,
                paidAmount: i < 2 ? 45000 : i === 2 ? 25000 : null,
            })),
        });
    }
    else {
        for (let i = 0; i < Math.min(3, mumbaiSchedules.length); i++) {
            await prisma.rentSchedule.update({
                where: { id: mumbaiSchedules[i].id },
                data: {
                    status: i < 2 ? client_1.ScheduleStatus.PAID : client_1.ScheduleStatus.PARTIAL,
                    paidAmount: i < 2 ? 45000 : 25000,
                },
            });
        }
    }
    const leaseMumbai102 = await prisma.lease.create({
        data: {
            propertyId: propMumbai102.id,
            tenantId: tenantPriya.id,
            ownerId: user.id,
            startDate: new Date('2026-02-01'),
            endDate: new Date('2027-01-31'),
            rentFrequency: client_1.RentFrequency.MONTHLY,
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
                status: m <= 3 ? client_1.ScheduleStatus.PAID : client_1.ScheduleStatus.DUE,
                paidAmount: m <= 3 ? 52000 : null,
            },
        });
    }
    const leaseBlr = await prisma.lease.create({
        data: {
            propertyId: propBlr1.id,
            tenantId: tenantVikram.id,
            ownerId: user.id,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            rentFrequency: client_1.RentFrequency.MONTHLY,
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
                status: m <= 1 ? client_1.ScheduleStatus.PAID : client_1.ScheduleStatus.DUE,
                paidAmount: m <= 1 ? 38000 : null,
            },
        });
    }
    const leaseBlr2 = await prisma.lease.create({
        data: {
            propertyId: propBlr2.id,
            tenantId: tenantSuresh.id,
            ownerId: user.id,
            startDate: new Date('2026-03-01'),
            endDate: new Date('2027-02-28'),
            rentFrequency: client_1.RentFrequency.MONTHLY,
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
            propertyId: propDelhi1.id,
            tenantId: tenantVikram.id,
            ownerId: user.id,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            rentFrequency: client_1.RentFrequency.YEARLY,
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
            status: client_1.ScheduleStatus.PAID,
            paidAmount: 600000,
        },
    });
    const leaseDubaiMarina = await prisma.lease.upsert({
        where: { id: 'seed-lease-ae-marina' },
        update: {},
        create: {
            id: 'seed-lease-ae-marina',
            propertyId: propMarina2201.id,
            tenantId: tenantAhmed.id,
            ownerId: user.id,
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-12-31'),
            rentFrequency: client_1.RentFrequency.QUARTERLY,
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
                status: i === 0 ? client_1.ScheduleStatus.PAID : client_1.ScheduleStatus.DUE,
                paidAmount: i === 0 ? 45000 : null,
            })),
        });
    }
    const leaseMarina2202 = await prisma.lease.create({
        data: {
            propertyId: propMarina2202.id,
            tenantId: tenantFatima.id,
            ownerId: user.id,
            startDate: new Date('2026-02-01'),
            endDate: new Date('2026-12-31'),
            rentFrequency: client_1.RentFrequency.QUARTERLY,
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
            propertyId: propJBR1.id,
            tenantId: tenantOmar.id,
            ownerId: user.id,
            startDate: new Date('2026-01-15'),
            endDate: new Date('2026-12-15'),
            rentFrequency: client_1.RentFrequency.MONTHLY,
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
                status: m <= 1 ? client_1.ScheduleStatus.PAID : client_1.ScheduleStatus.DUE,
                paidAmount: m <= 1 ? 12000 : null,
            },
        });
    }
    await prisma.cheque.upsert({
        where: { id: 'seed-cheque-dq1' },
        update: {},
        create: {
            id: 'seed-cheque-dq1',
            leaseId: leaseDubaiMarina.id,
            tenantId: tenantAhmed.id,
            propertyId: propMarina2201.id,
            ownerId: user.id,
            chequeNumber: 'DQ001',
            bankName: 'Emirates NBD',
            chequeDate: new Date(2026, 0, 1),
            amount: 45000,
            coversPeriod: 'Q1 2026 Rent',
            status: client_1.ChequeStatus.CLEARED,
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
            propertyId: propMarina2201.id,
            ownerId: user.id,
            chequeNumber: 'DQ002',
            bankName: 'Emirates NBD',
            chequeDate: new Date(2026, 3, 1),
            amount: 45000,
            coversPeriod: 'Q2 2026 Rent',
            status: client_1.ChequeStatus.DEPOSITED,
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
            propertyId: propMarina2201.id,
            ownerId: user.id,
            chequeNumber: 'DQ003',
            bankName: 'Emirates NBD',
            chequeDate: new Date(2026, 6, 1),
            amount: 45000,
            coversPeriod: 'Q3 2026 Rent',
            status: client_1.ChequeStatus.RECEIVED,
        },
    });
    await prisma.cheque.createMany({
        data: [
            {
                leaseId: leaseMumbai101.id,
                tenantId: tenantRaj.id,
                propertyId: propMumbai101.id,
                ownerId: user.id,
                chequeNumber: 'INR-001',
                bankName: 'HDFC Bank',
                chequeDate: new Date(2026, 0, 5),
                amount: 45000,
                coversPeriod: 'Jan 2026 Rent',
                status: client_1.ChequeStatus.CLEARED,
                depositDate: new Date(2026, 0, 6),
                clearedOrBounceDate: new Date(2026, 0, 8),
            },
            {
                leaseId: leaseMumbai101.id,
                tenantId: tenantRaj.id,
                propertyId: propMumbai101.id,
                ownerId: user.id,
                chequeNumber: 'INR-002',
                bankName: 'HDFC Bank',
                chequeDate: new Date(2026, 1, 5),
                amount: 45000,
                coversPeriod: 'Feb 2026 Rent',
                status: client_1.ChequeStatus.CLEARED,
                depositDate: new Date(2026, 1, 6),
                clearedOrBounceDate: new Date(2026, 1, 9),
            },
            {
                leaseId: leaseMumbai101.id,
                tenantId: tenantRaj.id,
                propertyId: propMumbai101.id,
                ownerId: user.id,
                chequeNumber: 'INR-003',
                bankName: 'HDFC Bank',
                chequeDate: new Date(2026, 2, 5),
                amount: 45000,
                coversPeriod: 'Mar 2026 Rent',
                status: client_1.ChequeStatus.RECEIVED,
            },
            {
                leaseId: leaseMumbai102.id,
                tenantId: tenantPriya.id,
                propertyId: propMumbai102.id,
                ownerId: user.id,
                chequeNumber: 'INR-P01',
                bankName: 'ICICI Bank',
                chequeDate: new Date(2026, 3, 10),
                amount: 52000,
                coversPeriod: 'Apr 2026 Rent',
                status: client_1.ChequeStatus.BOUNCED,
                depositDate: new Date(2026, 3, 11),
                clearedOrBounceDate: new Date(2026, 3, 14),
                bounceReason: 'Insufficient funds',
            },
        ],
    });
    const pay1 = await prisma.payment.create({
        data: {
            leaseId: leaseMumbai101.id,
            tenantId: tenantRaj.id,
            propertyId: propMumbai101.id,
            ownerId: user.id,
            date: new Date(2026, 0, 5),
            amount: 45000,
            method: client_1.PaymentMethod.BANK_TRANSFER,
            reference: 'NEFT123456789',
            notes: 'Jan 2026 rent',
        },
    });
    const pay2 = await prisma.payment.create({
        data: {
            leaseId: leaseBlr.id,
            tenantId: tenantVikram.id,
            propertyId: propBlr1.id,
            ownerId: user.id,
            date: new Date(2026, 0, 2),
            amount: 38000,
            method: client_1.PaymentMethod.UPI,
            reference: 'UPI987654321',
        },
    });
    const pay3 = await prisma.payment.create({
        data: {
            leaseId: leaseJBR.id,
            tenantId: tenantOmar.id,
            propertyId: propJBR1.id,
            ownerId: user.id,
            date: new Date(2026, 0, 15),
            amount: 12000,
            method: client_1.PaymentMethod.CASH,
            notes: 'Jan 2026 rent',
        },
    });
    const pay4 = await prisma.payment.create({
        data: {
            leaseId: leaseDelhi.id,
            tenantId: tenantVikram.id,
            propertyId: propDelhi1.id,
            ownerId: user.id,
            date: new Date(2026, 0, 1),
            amount: 600000,
            method: client_1.PaymentMethod.BANK_TRANSFER,
            reference: 'YEARLY-RENT-2026',
        },
    });
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
            data: { status: client_1.ScheduleStatus.PAID, paidAmount: 45000 },
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
            data: { status: client_1.ScheduleStatus.PAID, paidAmount: 38000 },
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
            data: { status: client_1.ScheduleStatus.PAID, paidAmount: 12000 },
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
            data: { status: client_1.ScheduleStatus.PAID, paidAmount: 600000 },
        });
    }
    console.log('Seed completed. Owner:', user.email, '/ password123 | Super admin: admin@propman.com / admin123 | 10 properties, 8 tenants, 8 leases, cheques, payments.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map