import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { UserRole, Prisma, PaymentMethod } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { PaymentsService } from '../payments/payments.service';
import { CreateChequeDto } from './dto/create-cheque.dto';
import { UpdateChequeDto } from './dto/update-cheque.dto';
import { ChequeStatusUpdateDto } from './dto/cheque-status.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginatedResponse } from '../common/dto/pagination.dto';
import { ChequeStatus } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

const VALID_TRANSITIONS: Record<ChequeStatus, ChequeStatus[]> = {
  [ChequeStatus.RECEIVED]: [ChequeStatus.DEPOSITED],
  [ChequeStatus.DEPOSITED]: [ChequeStatus.CLEARED, ChequeStatus.BOUNCED],
  [ChequeStatus.CLEARED]: [],
  [ChequeStatus.BOUNCED]: [ChequeStatus.REPLACED],
  [ChequeStatus.REPLACED]: [],
};

@Injectable()
export class ChequesService {
  private readonly logger = new Logger(ChequesService.name);

  constructor(
    private prisma: PrismaService,
    private accessService: AccessService,
    private paymentsService: PaymentsService,
  ) {}

  async create(userId: string, role: UserRole, dto: CreateChequeDto) {
    const lease = await this.ensureLeaseAccessible(userId, role, dto.leaseId);
    const ownerId = role === UserRole.USER || role === UserRole.SUPER_ADMIN ? userId : lease.ownerId;
    return this.prisma.cheque.create({
      data: {
        ownerId,
        leaseId: dto.leaseId,
        tenantId: dto.tenantId,
        propertyId: dto.propertyId,
        chequeNumber: dto.chequeNumber,
        bankName: dto.bankName,
        chequeDate: new Date(dto.chequeDate),
        amount: new Decimal(dto.amount),
        coversPeriod: dto.coversPeriod,
        status: ChequeStatus.RECEIVED,
        notes: dto.notes,
      },
      include: { lease: true, tenant: true, property: true },
    });
  }

  async findAll(
    userId: string,
    role: UserRole,
    pagination: PaginationDto,
    filters?: { propertyId?: string; tenantId?: string; status?: ChequeStatus; search?: string },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId }
        : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) } };
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN && (where.propertyId as { in: string[] }).in.length === 0) {
      return paginatedResponse([], 0, page, limit);
    }
    if (filters?.propertyId) where.propertyId = filters.propertyId;
    if (filters?.tenantId) where.tenantId = filters.tenantId;
    if (filters?.status) where.status = filters.status;
    if (filters?.search?.trim()) {
      const q = filters.search.trim();
      where.OR = [
        { chequeNumber: { contains: q, mode: 'insensitive' } },
        { bankName: { contains: q, mode: 'insensitive' } },
        { coversPeriod: { contains: q, mode: 'insensitive' } },
      ];
    }
    const [data, total] = await Promise.all([
      this.prisma.cheque.findMany({
        where: where as Prisma.ChequeWhereInput,
        include: { lease: true, tenant: true, property: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { chequeDate: 'asc' },
      }),
      this.prisma.cheque.count({ where: where as Prisma.ChequeWhereInput }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(userId: string, role: UserRole, id: string) {
    const cheque = await this.prisma.cheque.findUnique({
      where: { id },
      include: {
        lease: true,
        tenant: true,
        property: true,
        replacedBy: true,
        replacesCheque: true,
      },
    });
    if (!cheque) throw new NotFoundException('Cheque not found');
    const canAccess = await this.accessService.canAccessProperty(userId, role, cheque.propertyId);
    if (!canAccess) throw new NotFoundException('Cheque not found');
    return cheque;
  }

  async update(userId: string, role: UserRole, id: string, dto: UpdateChequeDto) {
    await this.findOne(userId, role, id);
    const data: Record<string, unknown> = {};
    if (dto.depositDate != null) data.depositDate = new Date(dto.depositDate);
    if (dto.clearedOrBounceDate != null) data.clearedOrBounceDate = new Date(dto.clearedOrBounceDate);
    if (dto.bounceReason != null) data.bounceReason = dto.bounceReason;
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.status != null) {
      const cheque = await this.prisma.cheque.findUnique({ where: { id } });
      this.assertValidTransition(cheque!.status, dto.status, undefined);
      data.status = dto.status;
    }
    return this.prisma.cheque.update({
      where: { id },
      data,
      include: { lease: true, tenant: true, property: true },
    });
  }

  async updateStatus(userId: string, role: UserRole, id: string, dto: ChequeStatusUpdateDto) {
    const cheque = await this.findOne(userId, role, id);
    this.assertValidTransition(cheque.status, dto.status, dto.replacedByChequeId);

    const data: Record<string, unknown> = { status: dto.status };
    if (dto.depositDate) data.depositDate = new Date(dto.depositDate);
    if (dto.clearedOrBounceDate) data.clearedOrBounceDate = new Date(dto.clearedOrBounceDate);
    if (dto.bounceReason) data.bounceReason = dto.bounceReason;
    if (dto.replacedByChequeId) data.replacedByChequeId = dto.replacedByChequeId;

    const updated = await this.prisma.cheque.update({
      where: { id },
      data,
      include: { lease: true, tenant: true, property: true },
    });

    // When a cheque is cleared, automatically create a linked Payment
    // so the amount is matched against the lease's rent schedule.
    if (dto.status === ChequeStatus.CLEARED) {
      await this.createPaymentForClearedCheque(userId, role, updated);
    }

    return updated;
  }

  /**
   * Create a Payment record linked to a cleared cheque.
   * Uses the cleared date (or cheque date) as the payment date.
   * Skips if a payment already exists for this cheque.
   */
  private async createPaymentForClearedCheque(
    userId: string,
    role: UserRole,
    cheque: { id: string; chequeDate: Date; clearedOrBounceDate: Date | null; amount: Decimal; leaseId: string; tenantId: string; propertyId: string; chequeNumber: string; bankName: string },
  ) {
    // Guard: skip if a payment already exists for this cheque
    const existing = await this.prisma.payment.findFirst({
      where: { chequeId: cheque.id },
    });
    if (existing) {
      this.logger.log(`Payment already exists for cheque ${cheque.id}, skipping auto-creation`);
      return;
    }

    const paymentDate = cheque.clearedOrBounceDate ?? cheque.chequeDate;

    try {
      await this.paymentsService.create(userId, role, {
        date: paymentDate.toISOString().split('T')[0],
        amount: Number(cheque.amount),
        method: PaymentMethod.CHEQUE,
        reference: `Cheque #${cheque.chequeNumber} (${cheque.bankName})`,
        leaseId: cheque.leaseId,
        tenantId: cheque.tenantId,
        propertyId: cheque.propertyId,
        chequeId: cheque.id,
      });
      this.logger.log(`Auto-created payment for cleared cheque ${cheque.id}`);
    } catch (err) {
      this.logger.error(`Failed to auto-create payment for cheque ${cheque.id}: ${err}`);
    }
  }

  async upcoming(userId: string, role: UserRole, days: 30 | 60 | 90, propertyId?: string) {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + days);
    const where: { ownerId?: string; propertyId?: string | { in: string[] }; chequeDate: { gte: Date; lte: Date } } =
      role === UserRole.USER || role === UserRole.SUPER_ADMIN
        ? { ownerId: userId, chequeDate: { gte: from, lte: to } }
        : { propertyId: { in: await this.accessService.getAccessiblePropertyIds(userId, role) }, chequeDate: { gte: from, lte: to } };
    if (role !== UserRole.USER && role !== UserRole.SUPER_ADMIN && (where.propertyId as { in: string[] }).in.length === 0) {
      return [];
    }
    if (propertyId) where.propertyId = propertyId;
    return this.prisma.cheque.findMany({
      where,
      include: { lease: true, tenant: true, property: true },
      orderBy: { chequeDate: 'asc' },
    });
  }

  async remove(userId: string, role: UserRole, id: string) {
    await this.findOne(userId, role, id);
    await this.prisma.cheque.delete({ where: { id } });
    return { deleted: true };
  }

  private assertValidTransition(current: ChequeStatus, next: ChequeStatus, replacedByChequeId?: string) {
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed?.includes(next)) throw new BadRequestException(`Invalid status transition from ${current} to ${next}`);
    if (next === ChequeStatus.REPLACED && !replacedByChequeId) throw new BadRequestException('replacedByChequeId required when status is REPLACED');
  }

  private async ensureLeaseAccessible(userId: string, role: UserRole, leaseId: string) {
    const lease = await this.prisma.lease.findUnique({ where: { id: leaseId }, include: { property: true } });
    if (!lease) throw new NotFoundException('Lease not found');
    const canAccess = await this.accessService.canAccessProperty(userId, role, lease.propertyId);
    if (!canAccess) throw new NotFoundException('Lease not found');
    return lease;
  }
}
