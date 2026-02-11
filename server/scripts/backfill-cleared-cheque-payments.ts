/**
 * Backfill script: Create Payment records for all CLEARED cheques
 * that don't have a linked payment.
 *
 * This fixes the historical gap where clearing a cheque did not
 * automatically create a payment or update the rent schedule.
 *
 * Run with:  npx ts-node scripts/backfill-cleared-cheque-payments.ts
 */
import { PrismaClient, PaymentMethod, ScheduleStatus } from '@prisma/client'
import { Decimal } from '@prisma/client/runtime/library'

const prisma = new PrismaClient()

async function autoMatchPayment(paymentId: string, leaseId: string, paymentAmount: number) {
  const schedules = await prisma.rentSchedule.findMany({
    where: { leaseId },
    orderBy: { dueDate: 'asc' },
  })

  let remaining = paymentAmount
  const matches: { rentScheduleId: string; amount: number }[] = []

  for (const schedule of schedules) {
    if (remaining <= 0) break

    const expected = Number(schedule.expectedAmount)
    const agg = await prisma.paymentScheduleMatch.aggregate({
      where: { rentScheduleId: schedule.id },
      _sum: { amount: true },
    })
    const alreadyPaid = Number(agg._sum.amount ?? 0)
    const stillOwed = expected - alreadyPaid

    if (stillOwed <= 0) continue

    const toApply = Math.min(remaining, stillOwed)
    matches.push({ rentScheduleId: schedule.id, amount: toApply })
    remaining -= toApply
  }

  for (const m of matches) {
    await prisma.paymentScheduleMatch.create({
      data: {
        paymentId,
        rentScheduleId: m.rentScheduleId,
        amount: new Decimal(m.amount),
      },
    })
  }

  // Recalculate status for each affected schedule
  for (const m of matches) {
    const schedule = await prisma.rentSchedule.findUnique({ where: { id: m.rentScheduleId } })
    if (!schedule) continue

    const expected = Number(schedule.expectedAmount)
    const agg = await prisma.paymentScheduleMatch.aggregate({
      where: { rentScheduleId: m.rentScheduleId },
      _sum: { amount: true },
    })
    const totalPaid = Number(agg._sum.amount ?? 0)

    const status: ScheduleStatus =
      totalPaid >= expected
        ? ScheduleStatus.PAID
        : totalPaid > 0
          ? ScheduleStatus.PARTIAL
          : new Date(schedule.dueDate) < new Date()
            ? ScheduleStatus.OVERDUE
            : ScheduleStatus.DUE

    await prisma.rentSchedule.update({
      where: { id: m.rentScheduleId },
      data: {
        status,
        paidAmount: totalPaid > 0 ? new Decimal(totalPaid) : null,
      },
    })
  }

  return { matched: matches.length, unallocated: remaining }
}

async function main() {
  console.log('Finding cleared cheques without linked payments...\n')

  const orphanedCheques = await prisma.$queryRaw<
    {
      id: string
      chequeNumber: string
      bankName: string
      chequeDate: Date
      clearedOrBounceDate: Date | null
      amount: Decimal
      leaseId: string
      tenantId: string
      propertyId: string
      ownerId: string
    }[]
  >`
    SELECT c.id, c."chequeNumber", c."bankName", c."chequeDate",
           c."clearedOrBounceDate", c.amount, c."leaseId", c."tenantId",
           c."propertyId", c."ownerId"
    FROM "Cheque" c
    LEFT JOIN "Payment" p ON p."chequeId" = c.id
    WHERE c.status = 'CLEARED' AND p.id IS NULL
    ORDER BY c."chequeDate"
  `

  console.log(`Found ${orphanedCheques.length} cleared cheques without payments.\n`)

  if (orphanedCheques.length === 0) {
    console.log('Nothing to do.')
    return
  }

  let created = 0
  let errors = 0

  for (const cheque of orphanedCheques) {
    const paymentDate = cheque.clearedOrBounceDate ?? cheque.chequeDate

    try {
      const payment = await prisma.payment.create({
        data: {
          ownerId: cheque.ownerId,
          leaseId: cheque.leaseId,
          tenantId: cheque.tenantId,
          propertyId: cheque.propertyId,
          date: paymentDate,
          amount: cheque.amount,
          method: PaymentMethod.CHEQUE,
          reference: `Cheque #${cheque.chequeNumber} (${cheque.bankName})`,
          chequeId: cheque.id,
        },
      })

      const result = await autoMatchPayment(payment.id, payment.leaseId, Number(payment.amount))
      created++

      console.log(
        `  [OK] Cheque ${cheque.chequeNumber} (${cheque.bankName}) -> Payment created, ` +
        `matched ${result.matched} schedule(s), unallocated: ${result.unallocated}`
      )
    } catch (err) {
      errors++
      console.error(`  [ERR] Cheque ${cheque.chequeNumber} (${cheque.id}): ${err}`)
    }
  }

  console.log(`\nDone. Created: ${created}, Errors: ${errors}`)
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
