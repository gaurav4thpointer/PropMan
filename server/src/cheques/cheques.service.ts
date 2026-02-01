import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, dto: CreateChequeDto) {
    await this.ensureLeaseOwned(ownerId, dto.leaseId);
    return this.prisma.cheque.create({
      data: {
        ownerId,
        leaseId: dto.leaseId,
        tenantId: dto.tenantId,
        propertyId: dto.propertyId,
        unitId: dto.unitId,
        chequeNumber: dto.chequeNumber,
        bankName: dto.bankName,
        chequeDate: new Date(dto.chequeDate),
        amount: new Decimal(dto.amount),
        coversPeriod: dto.coversPeriod,
        status: ChequeStatus.RECEIVED,
        notes: dto.notes,
      },
      include: { lease: true, tenant: true, property: true, unit: true },
    });
  }

  async findAll(
    ownerId: string,
    pagination: PaginationDto,
    filters?: { propertyId?: string; tenantId?: string; status?: ChequeStatus; search?: string },
  ) {
    const { page = 1, limit = 20 } = pagination;
    const where: Record<string, unknown> = { ownerId };
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
        where: where as { ownerId: string },
        include: { lease: true, tenant: true, property: true, unit: true },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { chequeDate: 'asc' },
      }),
      this.prisma.cheque.count({ where: where as { ownerId: string } }),
    ]);
    return paginatedResponse(data, total, page, limit);
  }

  async findOne(ownerId: string, id: string) {
    const cheque = await this.prisma.cheque.findFirst({
      where: { id, ownerId },
      include: { lease: true, tenant: true, property: true, unit: true },
    });
    if (!cheque) throw new NotFoundException('Cheque not found');
    return cheque;
  }

  async update(ownerId: string, id: string, dto: UpdateChequeDto) {
    await this.findOne(ownerId, id);
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
      include: { lease: true, tenant: true, property: true, unit: true },
    });
  }

  async updateStatus(ownerId: string, id: string, dto: ChequeStatusUpdateDto) {
    const cheque = await this.findOne(ownerId, id);
    this.assertValidTransition(cheque.status, dto.status, dto.replacedByChequeId);

    const data: Record<string, unknown> = { status: dto.status };
    if (dto.depositDate) data.depositDate = new Date(dto.depositDate);
    if (dto.clearedOrBounceDate) data.clearedOrBounceDate = new Date(dto.clearedOrBounceDate);
    if (dto.bounceReason) data.bounceReason = dto.bounceReason;
    if (dto.replacedByChequeId) data.replacedByChequeId = dto.replacedByChequeId;

    return this.prisma.cheque.update({
      where: { id },
      data,
      include: { lease: true, tenant: true, property: true, unit: true },
    });
  }

  async upcoming(ownerId: string, days: 30 | 60 | 90, propertyId?: string) {
    const from = new Date();
    const to = new Date();
    to.setDate(to.getDate() + days);
    const where: { ownerId: string; chequeDate: { gte: Date; lte: Date }; propertyId?: string } = {
      ownerId,
      chequeDate: { gte: from, lte: to },
    };
    if (propertyId) where.propertyId = propertyId;
    return this.prisma.cheque.findMany({
      where,
      include: { lease: true, tenant: true, property: true, unit: true },
      orderBy: { chequeDate: 'asc' },
    });
  }

  async remove(ownerId: string, id: string) {
    await this.findOne(ownerId, id);
    await this.prisma.cheque.delete({ where: { id } });
    return { deleted: true };
  }

  private assertValidTransition(current: ChequeStatus, next: ChequeStatus, replacedByChequeId?: string) {
    const allowed = VALID_TRANSITIONS[current];
    if (!allowed?.includes(next)) throw new BadRequestException(`Invalid status transition from ${current} to ${next}`);
    if (next === ChequeStatus.REPLACED && !replacedByChequeId) throw new BadRequestException('replacedByChequeId required when status is REPLACED');
  }

  private async ensureLeaseOwned(ownerId: string, leaseId: string) {
    const lease = await this.prisma.lease.findFirst({ where: { id: leaseId, ownerId } });
    if (!lease) throw new NotFoundException('Lease not found');
  }
}
